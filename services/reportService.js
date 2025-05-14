const AWS = require("aws-sdk");
const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");
const Profile = require("../models/Profile");
const { format } = require("date-fns");

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

exports.generateReport = async (userId, reportType, options = {}) => {
  try {
    // Get user profile for currency information
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      throw new Error("User profile not found");
    }

    // Generate report data based on type
    let reportData;
    switch (reportType) {
      case "monthly-summary":
        reportData = await generateMonthlySummary(
          userId,
          profile.currency,
          options
        );
        break;
      case "budget-analysis":
        reportData = await generateBudgetAnalysis(
          userId,
          profile.currency,
          options
        );
        break;
      case "transaction-history":
        reportData = await generateTransactionHistory(
          userId,
          profile.currency,
          options
        );
        break;
      default:
        throw new Error("Invalid report type");
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `reports/${userId}/${reportType}-${timestamp}.json`;

    // Upload to S3
    const uploadParams = {
      Bucket: process.env.REPORTS_BUCKET_NAME || "expense-tracker-reports",
      Key: filename,
      Body: JSON.stringify(reportData),
      ContentType: "application/json",
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    return {
      reportUrl: uploadResult.Location,
      s3Key: uploadResult.Key,
      reportType,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error("Report generation error:", error);
    throw error;
  }
};

async function generateMonthlySummary(userId, currency, { month, year }) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const [transactions, budgets] = await Promise.all([
    Transaction.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }),
    Budget.find({
      userId,
      month: { $gte: startDate, $lte: endDate },
    }),
  ]);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const budgetTotals = budgets.reduce((sum, b) => sum + b.amount, 0);

  return {
    reportType: "monthly-summary",
    period: `${month}/${year}`,
    currency,
    income,
    expenses,
    savings: income - expenses,
    budgetTotals,
    budgetUtilization: (expenses / budgetTotals) * 100 || 0,
    transactionCount: transactions.length,
    budgetCount: budgets.length,
  };
}

async function generateBudgetAnalysis(userId, currency, { month, year }) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const [transactions, budgets] = await Promise.all([
    Transaction.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
      type: "expense",
    }),
    Budget.find({
      userId,
      month: { $gte: startDate, $lte: endDate },
    }),
  ]);

  const categories = [...new Set(budgets.map((b) => b.category))];

  const analysis = categories.map((category) => {
    const budget = budgets.find((b) => b.category === category);
    const categoryTransactions = transactions.filter(
      (t) => t.category === category
    );
    const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      category,
      budgetAmount: budget.amount,
      spent,
      remaining: budget.amount - spent,
      utilization: (spent / budget.amount) * 100,
      transactionCount: categoryTransactions.length,
    };
  });

  return {
    reportType: "budget-analysis",
    period: `${month}/${year}`,
    currency,
    categories: analysis,
    totalBudget: budgets.reduce((sum, b) => sum + b.amount, 0),
    totalSpent: transactions.reduce((sum, t) => sum + t.amount, 0),
  };
}

async function generateTransactionHistory(
  userId,
  currency,
  { startDate, endDate, categories }
) {
  const query = { userId };

  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (categories && categories.length > 0) {
    query.category = { $in: categories };
  }

  const transactions = await Transaction.find(query).sort({ date: -1 });

  return {
    reportType: "transaction-history",
    currency,
    filters: { startDate, endDate, categories },
    transactions: transactions.map((t) => ({
      id: t._id,
      title: t.title,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date,
      createdAt: t.createdAt,
    })),
    count: transactions.length,
  };
}
