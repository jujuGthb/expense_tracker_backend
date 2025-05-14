const Budget = require("../models/Budget");
const AWSBudgets = require("../services/awsBudgets");

const getMonthRange = (monthString) => {
  const [year, month] = monthString.split("-").map(Number);
  return {
    startDate: new Date(year, month - 1, 1),
    endDate: new Date(year, month, 1),
  };
};

exports.createBudget = async (req, res) => {
  try {
    const { amount, category, currency = "USD", description } = req.body;

    if (!amount || amount <= 0 || !category) {
      return res.status(400).json({
        message: "Amount must be positive and category required",
      });
    }

    const budgetName = `user-${req.user.id}-${category}`;

    // Check both MongoDB and AWS for existing budget
    const existingBudget = await Budget.findOne({
      userId: req.user.id,
      category,
    });

    if (existingBudget) {
      return res.status(400).json({
        message: "Budget for this category already exists",
      });
    }

    // Create in AWS first
    const awsBudget = await AWSBudgets.createBudget(req.user.id, {
      amount,
      category,
      currency,
    });

    // Then create in MongoDB
    const budget = new Budget({
      userId: req.user.id,
      amount,
      category,
      currency,
      description,
      month: new Date(),
      awsBudgetId: awsBudget.budgetId,
    });

    await budget.save();

    res.status(201).json(budget);
  } catch (err) {
    console.error("Budget creation error:", err);

    // If AWS creation succeeded but MongoDB failed, clean up AWS budget
    if (err.message.includes("MongoDB") && err.awsBudgetId) {
      try {
        await AWSBudgets.deleteBudget(err.awsBudgetId);
      } catch (cleanupError) {
        console.error("Failed to clean up AWS budget:", cleanupError);
      }
    }

    res.status(500).json({
      message: err.message || "Failed to create budget",
    });
  }
};

exports.getBudgets = async (req, res) => {
  try {
    let query = { userId: req.user.id };

    if (req.query.month) {
      const { startDate, endDate } = getMonthRange(req.query.month);
      query.month = { $gte: startDate, $lt: endDate };
    }

    const budgets = await Budget.find(query).sort({ month: -1 });
    res.status(200).json({
      success: true,
      count: budgets.length,
      data: budgets,
    });
  } catch (err) {
    console.error("Error fetching budgets:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve budgets",
      error: err.message,
    });
  }
};

exports.updateBudget = async (req, res) => {
  try {
    const { amount, category, month, description } = req.body;
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    if (budget.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Update MongoDB first
    budget.amount = amount;
    budget.category = category;
    budget.month = new Date(month);
    budget.description = description;
    budget.currency = budget.currency || "USD";

    const updatedBudget = await budget.save();

    // Update AWS Budget - use original category if changed
    await AWSBudgets.updateBudget(
      req.user.id,
      budget.category, //original category, not the updated one
      {
        amount,
        currency: budget.currency,
      }
    );

    res.status(200).json(updatedBudget);
  } catch (err) {
    console.error("Budget update error:", err);
    res.status(500).json({
      message: "Failed to update budget",
      error: err.message,
    });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    if (budget.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const budgetName = `user-${budget.userId}-${budget.category}`;

    // Track deletion attempts
    const deletionAttempts = [];
    let awsDeleted = false;

    // Try deleting with the standard naming pattern first
    deletionAttempts.push(`Standard name: ${budgetName}`);
    try {
      await AWSBudgets.deleteBudget(budgetName);
      awsDeleted = true;
    } catch (nameError) {
      if (nameError.code !== "NotFoundException") {
        throw nameError;
      }

      // If standard name fails, try with stored AWS ID if different
      if (budget.awsBudgetId && budget.awsBudgetId !== budgetName) {
        deletionAttempts.push(`Stored AWS ID: ${budget.awsBudgetId}`);
        try {
          await AWSBudgets.deleteBudget(budget.awsBudgetId);
          awsDeleted = true;
        } catch (idError) {
          if (idError.code !== "NotFoundException") {
            throw idError;
          }
        }
      }
    }

    // Delete from MongoDB regardless of AWS deletion status
    await budget.deleteOne();

    res.status(200).json({
      message: "Budget deletion completed",
      details: {
        dbDeleted: true,
        awsDeleted,
        attempts: deletionAttempts,
        finalState: awsDeleted
          ? "Fully synchronized"
          : "AWS budget may still exist",
      },
    });
  } catch (err) {
    console.error("Budget deletion error:", err);

    const errorResponse = {
      message: "Failed to delete budget",
      error: err.message,
      code: err.code || "INTERNAL_ERROR",
    };

    // Add troubleshooting hints for common errors
    if (err.code === "AccessDeniedException") {
      errorResponse.suggestion =
        "Check IAM permissions for budgets:DeleteBudget";
    } else if (err.code === "InvalidParameterException") {
      errorResponse.suggestion =
        "Verify the budget name/ID format matches AWS requirements";
    }

    res.status(500).json(errorResponse);
  }
};

// exports.deleteBudget = async (req, res) => {
//   try {
//     const budget = await Budget.findById(req.params.id);

//     if (!budget) {
//       return res.status(404).json({ message: "Budget not found" });
//     }
//     if (budget.userId.toString() !== req.user.id) {
//       return res.status(401).json({ message: "Not authorized" });
//     }

//     // Generate the same budget name used in creation
//     const budgetName = generateBudgetName(budget.userId, budget.category);

//     // Delete from AWS using the same naming pattern
//     let awsDeleted = false;
//     try {
//       // await AWSBudgets.deleteBudget(budgetName);

//       awsDeleted = true;
//     } catch (awsError) {
//       if (awsError.code === "NotFoundException") {
//         // Try deleting with the stored ID if name fails
//         if (budget.awsBudgetId && budget.awsBudgetId !== budgetName) {
//           try {
//             await AWSBudgets.deleteBudget(budget.awsBudgetId);
//             awsDeleted = true;
//           } catch (secondTryError) {
//             if (secondTryError.code !== "NotFoundException") {
//               throw secondTryError;
//             }
//           }
//         }
//       } else {
//         throw awsError;
//       }
//     }

//     // Delete from MongoDB
//     await budget.deleteOne();

//     res.status(200).json({
//       message: "Budget deleted successfully",
//       details: {
//         dbDeleted: true,
//         awsDeleted,
//         usedBudgetName: budgetName,
//         storedAWSId: budget.awsBudgetId,
//       },
//     });
//   } catch (err) {
//     console.error("Budget deletion error:", err);
//     res.status(500).json({
//       message: "Failed to delete budget",
//       error: err.message,
//       code: err.code || "INTERNAL_ERROR",
//     });
//   }
// };
