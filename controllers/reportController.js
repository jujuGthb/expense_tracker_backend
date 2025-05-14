const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const Profile = require("../models/Profile");
const { invokeLambda } = require("../services/awsLambda");
const { uploadToS3, getSignedUrl } = require("../services/awsS3");
const { format } = require("date-fns");

exports.generateTransactionReport = async (req, res) => {
  try {
    const { startDate, endDate, format = "pdf" } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (start > end) {
      return res
        .status(400)
        .json({ message: "Start date must be before end date" });
    }

    // Get user profile for currency and other preferences
    const profile = await Profile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    // Fetch transactions for the specified period
    const transactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    // Fetch budgets for context
    const budgets = await Budget.find({
      userId: req.user.id,
      month: { $gte: start, $lte: end },
    });

    // Prepare data for Lambda
    const reportData = {
      userId: req.user.id,
      userName: profile.name,
      currency: profile.currency,
      startDate,
      endDate,
      transactions: transactions.map((t) => ({
        id: t._id,
        title: t.title,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date,
      })),
      budgets: budgets.map((b) => ({
        id: b._id,
        category: b.category,
        amount: b.amount,
        month: b.month,
      })),
      format,
    };

    // Invoke Lambda function to generate report
    const lambdaResponse = await invokeLambda(
      process.env.AWS_LAMBDA_REPORT_FUNCTION,
      reportData
    );

    // Check for error in Lambda response
    if (lambdaResponse.error) {
      return res.status(500).json({ message: lambdaResponse.error });
    }

    // Check if reportKey exists in the response
    if (!lambdaResponse.reportKey) {
      console.error("Lambda response missing reportKey:", lambdaResponse);
      return res.status(500).json({
        message: "Report generation failed - missing report key in response",
      });
    }

    try {
      // Get the report URL
      const reportUrl = await getSignedUrl(lambdaResponse.reportKey, 3600); // 1 hour expiry

      res.status(200).json({
        message: "Report generated successfully",
        reportUrl,
        expiresIn: "1 hour",
      });
    } catch (urlError) {
      console.error("Failed to generate signed URL:", urlError);
      res.status(500).json({
        message: "Report generated but URL creation failed",
        error: urlError.message,
      });
    }
  } catch (err) {
    console.error("Report generation error:", err);
    res.status(500).json({
      message: "Failed to generate report",
      error: err.message,
    });
  }
};

exports.getUserReports = async (req, res) => {
  try {
    const lambdaResponse = await invokeLambda(
      process.env.AWS_LAMBDA_LIST_REPORTS_FUNCTION,
      { userId: req.user.id }
    );

    console.log("Lambda response:", JSON.stringify(lambdaResponse, null, 2));

    // Handle different response formats from Lambda
    let reports = [];

    // Case 1: Lambda returns { reports: [...] }
    if (lambdaResponse.reports) {
      reports = lambdaResponse.reports;
    }
    // Case 2: Lambda returns { statusCode, body } format (API Gateway format)
    else if (lambdaResponse.statusCode && lambdaResponse.body) {
      try {
        const parsedBody =
          typeof lambdaResponse.body === "string"
            ? JSON.parse(lambdaResponse.body)
            : lambdaResponse.body;

        if (parsedBody.reports) {
          reports = parsedBody.reports;
        }
      } catch (parseError) {
        console.error("Error parsing Lambda response body:", parseError);
      }
    }
    // Case 3: Lambda returns an error
    else if (lambdaResponse.error) {
      return res.status(500).json({ message: lambdaResponse.error });
    }

    // If we have reports, generate signed URLs
    if (reports.length > 0) {
      try {
        const reportsWithUrls = await Promise.all(
          reports.map(async (report) => {
            // Check if report has a key property
            if (!report.key) {
              return { ...report, url: null };
            }

            try {
              const url = await getSignedUrl(report.key, 3600);
              return { ...report, url };
            } catch (urlError) {
              console.error(
                `Error generating URL for ${report.key}:`,
                urlError
              );
              return { ...report, url: null };
            }
          })
        );

        res.status(200).json({
          count: reportsWithUrls.length,
          reports: reportsWithUrls,
        });
      } catch (urlError) {
        console.error("Error generating signed URLs:", urlError);
        res.status(500).json({
          message: "Failed to generate signed URLs",
          error: urlError.message,
        });
      }
    } else {
      // No reports found
      res.status(200).json({
        count: 0,
        reports: [],
        message: "No reports found",
      });
    }
  } catch (err) {
    console.error("Error fetching reports:", err);
    res.status(500).json({
      message: "Failed to fetch reports",
      error: err.message,
    });
  }
};
