const AWS = require("aws-sdk");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const { Readable } = require("stream");

// Configure AWS SDK
const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    const {
      userId,
      userName,
      currency,
      startDate,
      endDate,
      transactions,
      budgets,
      format = "pdf",
    } = event;

    // Format dates for display and filename
    const formattedStartDate = startDate.split("T")[0];
    const formattedEndDate = endDate.split("T")[0];
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    // Generate report filename
    const reportKey = `reports/${userId}/transactions_${formattedStartDate}_to_${formattedEndDate}_${timestamp}.${format}`;

    // Generate report content based on format
    let reportContent;
    let contentType;

    if (format === "pdf") {
      reportContent = await generatePdfReport(event);
      contentType = "application/pdf";
    } else if (format === "excel" || format === "xlsx") {
      reportContent = await generateExcelReport(event);
      contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    // Upload report to S3
    await s3
      .putObject({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: reportKey,
        Body: reportContent,
        ContentType: contentType,
      })
      .promise();

    return {
      reportKey,
      format,
    };
  } catch (error) {
    console.error("Report generation error:", error);
    return {
      error: error.message,
    };
  }
};


async function generatePdfReport(data) {
  const { userName, currency, startDate, endDate, transactions, budgets } =
    data;

  // Create a new PDF document
  const doc = new PDFDocument();
  const buffers = [];

  // Collect PDF data chunks
  doc.on("data", buffers.push.bind(buffers));

  // Add report title
  doc.fontSize(20).text("Transaction Report", { align: "center" });
  doc.moveDown();

  // Add report metadata
  doc.fontSize(12).text(`User: ${userName}`);
  doc.text(
    `Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(
      endDate
    ).toLocaleDateString()}`
  );
  doc.text(`Currency: ${currency}`);
  doc.moveDown();

  // Add transactions section
  doc.fontSize(16).text("Transactions", { underline: true });
  doc.moveDown();

  // Calculate totals
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  // Add summary
  doc.fontSize(12).text(`Total Income: ${formatCurrency(income, currency)}`);
  doc.text(`Total Expenses: ${formatCurrency(expenses, currency)}`);
  doc.text(`Balance: ${formatCurrency(balance, currency)}`);
  doc.moveDown();

  // Add transactions table
  if (transactions.length > 0) {
    // Table headers
    const tableTop = doc.y;
    const tableHeaders = ["Date", "Title", "Category", "Type", "Amount"];
    const columnWidth = 100;

    tableHeaders.forEach((header, i) => {
      doc.text(header, i * columnWidth + 50, tableTop, {
        width: columnWidth,
        align: "left",
      });
    });

    doc.moveDown();
    let rowTop = doc.y;

    // Table rows
    transactions.forEach((transaction, i) => {
      // Check if we need a new page
      if (rowTop > doc.page.height - 100) {
        doc.addPage();
        rowTop = 50;
      }

      doc.text(new Date(transaction.date).toLocaleDateString(), 50, rowTop, {
        width: columnWidth,
        align: "left",
      });
      doc.text(transaction.title, 150, rowTop, {
        width: columnWidth,
        align: "left",
      });
      doc.text(transaction.category, 250, rowTop, {
        width: columnWidth,
        align: "left",
      });
      doc.text(transaction.type, 350, rowTop, {
        width: columnWidth,
        align: "left",
      });
      doc.text(formatCurrency(transaction.amount, currency), 450, rowTop, {
        width: columnWidth,
        align: "right",
      });

      rowTop += 20;
    });
  } else {
    doc.text("No transactions found for this period.");
  }

  // Add budgets section
  doc.addPage();
  doc.fontSize(16).text("Budgets", { underline: true });
  doc.moveDown();

  if (budgets.length > 0) {
    // Table headers
    const tableTop = doc.y;
    const tableHeaders = [
      "Category",
      "Budget Amount",
      "Actual Spent",
      "Remaining",
    ];
    const columnWidth = 120;

    tableHeaders.forEach((header, i) => {
      doc.text(header, i * columnWidth + 50, tableTop, {
        width: columnWidth,
        align: "left",
      });
    });

    doc.moveDown();
    let rowTop = doc.y;

    // Table rows
    budgets.forEach((budget) => {
      // Calculate actual spent for this category
      const spent = transactions
        .filter((t) => t.type === "expense" && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);

      const remaining = budget.amount - spent;

      doc.text(budget.category, 50, rowTop, {
        width: columnWidth,
        align: "left",
      });
      doc.text(formatCurrency(budget.amount, currency), 170, rowTop, {
        width: columnWidth,
        align: "left",
      });
      doc.text(formatCurrency(spent, currency), 290, rowTop, {
        width: columnWidth,
        align: "left",
      });
      doc.text(formatCurrency(remaining, currency), 410, rowTop, {
        width: columnWidth,
        align: "left",
      });

      rowTop += 20;
    });
  } else {
    doc.text("No budgets found for this period.");
  }

  // Finalize the PDF
  doc.end();

  // Return the PDF as a buffer
  return new Promise((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
  });
}

/**
 * Generate an Excel report
 * @param {Object} data - Report data
 * @returns {Buffer} - Excel workbook as buffer
 */
async function generateExcelReport(data) {
  const { userName, currency, startDate, endDate, transactions, budgets } =
    data;

  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Expense Tracker";
  workbook.created = new Date();

  // Add metadata worksheet
  const metaSheet = workbook.addWorksheet("Report Info");
  metaSheet.columns = [
    { header: "Property", key: "property", width: 20 },
    { header: "Value", key: "value", width: 40 },
  ];

  metaSheet.addRows([
    { property: "User", value: userName },
    { property: "Start Date", value: new Date(startDate) },
    { property: "End Date", value: new Date(endDate) },
    { property: "Currency", value: currency },
    { property: "Generated On", value: new Date() },
  ]);

  // Add transactions worksheet
  const txSheet = workbook.addWorksheet("Transactions");
  txSheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Title", key: "title", width: 30 },
    { header: "Category", key: "category", width: 15 },
    { header: "Type", key: "type", width: 10 },
    { header: "Amount", key: "amount", width: 15 },
  ];

  // Add transaction rows
  transactions.forEach((tx) => {
    txSheet.addRow({
      date: new Date(tx.date),
      title: tx.title,
      category: tx.category,
      type: tx.type,
      amount: tx.amount,
    });
  });

  // Format the amount column
  txSheet.getColumn("amount").numFmt = getCurrencyFormat(currency);

  // Add summary rows
  txSheet.addRow({});

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  txSheet.addRow({ title: "Total Income", amount: income });
  txSheet.addRow({ title: "Total Expenses", amount: expenses });
  txSheet.addRow({ title: "Balance", amount: balance });

  // Add budgets worksheet
  const budgetSheet = workbook.addWorksheet("Budgets");
  budgetSheet.columns = [
    { header: "Category", key: "category", width: 20 },
    { header: "Budget Amount", key: "budget", width: 15 },
    { header: "Actual Spent", key: "spent", width: 15 },
    { header: "Remaining", key: "remaining", width: 15 },
    { header: "% Used", key: "percentage", width: 10 },
  ];

  // Add budget rows
  budgets.forEach((budget) => {
    const spent = transactions
      .filter((t) => t.type === "expense" && t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0);

    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    budgetSheet.addRow({
      category: budget.category,
      budget: budget.amount,
      spent,
      remaining,
      percentage,
    });
  });

  // Format the numeric columns
  budgetSheet.getColumn("budget").numFmt = getCurrencyFormat(currency);
  budgetSheet.getColumn("spent").numFmt = getCurrencyFormat(currency);
  budgetSheet.getColumn("remaining").numFmt = getCurrencyFormat(currency);
  budgetSheet.getColumn("percentage").numFmt = "0.00%";

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code
 * @returns {string} - Formatted currency string
 */
function formatCurrency(amount, currency) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  });

  return formatter.format(amount);
}

/**
 * Get Excel number format for currency
 * @param {string} currency - The currency code
 * @returns {string} - Excel number format string
 */
function getCurrencyFormat(currency) {
  switch (currency) {
    case "EUR":
      return "€#,##0.00";
    case "GBP":
      return "£#,##0.00";
    default:
      return "$#,##0.00";
  }
}
