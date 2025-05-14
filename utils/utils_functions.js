import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import AWSBudgets from "../services/awsBudgets.js";

// const simpleBudgetCheck = async (userId, category, amount) => {
//   const budget = await Budget.findOne({ userId, category });
//   if (!budget) return null;

//   const now = new Date();
//   const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//   const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

//   const transactions = await Transaction.find({
//     userId,
//     category,
//     date: { $gte: startOfMonth, $lt: endOfMonth },
//     type: "expense",
//   });

//   const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
//   const percentage = ((totalSpent + parseFloat(amount)) / budget.amount) * 100;

//   if (percentage >= 100) {
//     return {
//       message: `Warning: Exceeds ${category} budget!`,
//       level: "critical",
//     };
//   } else if (percentage >= 90) {
//     return {
//       message: `Warning: Reaching ${Math.round(
//         percentage
//       )}% of ${category} budget`,
//       level: "warning",
//     };
//   }
//   return null;
// };

// export const checkBudgetWarning = async (userId, category, amount) => {
//   try {
//     const budget = await Budget.findOne({ userId, category });
//     if (!budget) return null;

//     // Try AWS check first
//     try {
//       const awsData = await AWSBudgets.checkBudgetWarning(
//         userId,
//         category,
//         amount
//       );
//       if (!awsData) return null;

//       const percentage = (awsData.forecastedSpending / budget.amount) * 100;

//       if (percentage >= 100) {
//         return {
//           message: `AWS Forecast: Exceeds budget by ${(
//             percentage - 100
//           ).toFixed(2)}%`,
//           level: "critical",
//           ...awsData,
//         };
//       } else if (percentage >= 90) {
//         return {
//           message: `AWS Forecast: Using ${percentage.toFixed(2)}% of budget`,
//           level: "warning",
//           ...awsData,
//         };
//       }
//       return null;
//     } catch (awsError) {
//       console.error(
//         "AWS Budget check failed, falling back to simple check:",
//         awsError
//       );
//       return simpleBudgetCheck(userId, category, amount);
//     }
//   } catch (err) {
//     console.error("Budget warning check error:", err);
//     return null;
//   }
// };

// Main budget check functon
export const checkBudgetWarning = async (userId, category, amount) => {
  try {
    // 1. Find the user's budget for this category
    const budget = await Budget.findOne({ userId, category });
    if (!budget) return null;

    // 2. Get current month's dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 3. Find all existing transactions in this category for current month
    const existingTransactions = await Transaction.find({
      userId,
      category,
      type: "expense",
      date: { $gte: startOfMonth, $lt: endOfMonth },
    });

    // 4. Calculate total spent so far
    const currentSpending = existingTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    // 5. Calculate mockSpending (existing + new amount)
    const mockSpending = currentSpending;
    const percentage = (mockSpending / budget.amount) * 100;

    console.log("start month:", startOfMonth);
    console.log("end month:", endOfMonth);
    console.log("amount:", amount);
    console.log("current spending:", currentSpending);
    console.log("total mockspending:", mockSpending);

    // 6. Generate appropriate response
    if (percentage > 100) {
      return {
        message: `🚨 Budget exceeded by ${(percentage - 100).toFixed(2)}%!`,
        details: `Already spent ${currentSpending.toFixed(
          2
        )} this month (+${amount} new transaction)`,
        level: "critical",
        currentSpending,
        newTransactionAmount: parseFloat(amount),
        totalForecasted: mockSpending,
        percentage,
      };
    } else if (percentage === 100) {
      return {
        message: "⚠️ Reached 100% of your budget!",
        details: `Total spending will be ${mockSpending.toFixed(2)}`,
        level: "critical",
        currentSpending,
        newTransactionAmount: parseFloat(amount),
        totalForecasted: mockSpending,
        percentage,
      };
    } else if (percentage >= 90) {
      return {
        message: `⚠️ Approaching budget limit (${percentage.toFixed(2)}%)`,
        details: `Current spending: ${currentSpending.toFixed(
          2
        )} + ${amount} new transaction`,
        level: "warning",
        currentSpending,
        newTransactionAmount: parseFloat(amount),
        totalForecasted: mockSpending,
        percentage,
      };
    }

    // Return null when under 90% (no warning needed)
    return null;
  } catch (err) {
    console.error("Budget warning check error:", err);
    return null;
  }
};
