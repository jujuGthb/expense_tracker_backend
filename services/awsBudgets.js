const {
  BudgetsClient,
  CreateBudgetCommand,
  UpdateBudgetCommand,
  DeleteBudgetCommand,
  DescribeBudgetCommand,
  CreateNotificationCommand,
} = require("@aws-sdk/client-budgets");
const {
  CostExplorerClient,
  GetCostForecastCommand,
} = require("@aws-sdk/client-cost-explorer");

class AWSBudgets {
  constructor() {
    this.budgetsClient = new BudgetsClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.costExplorerClient = new CostExplorerClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async createBudget(userId, budgetData) {
    const budgetName = `user-${userId}-${budgetData.category}`;
    const params = {
      AccountId: process.env.AWS_ACCOUNT_ID,
      Budget: {
        BudgetName: budgetName,
        BudgetType: "COST",
        TimeUnit: "MONTHLY",
        BudgetLimit: {
          Amount: budgetData.amount.toString(),
          Unit: budgetData.currency || "USD",
        },
        CostTypes: {
          IncludeTax: false,
          IncludeSubscription: true,
          UseBlended: false,
        },
      },
    };

    try {
      // Check if budget already exists, delete if it does
      try {
        await this.budgetsClient.send(
          new DescribeBudgetCommand({
            AccountId: process.env.AWS_ACCOUNT_ID,
            BudgetName: budgetName,
          })
        );

        // Budget exists, delete it first
        await this.budgetsClient.send(
          new DeleteBudgetCommand({
            AccountId: process.env.AWS_ACCOUNT_ID,
            BudgetName: budgetName,
          })
        );
      } catch (describeError) {
        if (describeError.name !== "NotFoundException") {
          throw describeError;
        }
      }

      // Create new budget
      await this.budgetsClient.send(new CreateBudgetCommand(params));

      if (process.env.AWS_BUDGET_NOTIFICATION_EMAIL) {
        await this.createBudgetNotification(
          budgetName,
          process.env.AWS_BUDGET_NOTIFICATION_EMAIL
        );
      }

      return {
        success: true,
        budgetId: budgetName,
      };
    } catch (error) {
      console.error("AWS Budget creation failed:", error);
      throw new Error(`Budget creation failed: ${error.message}`);
    }
  }

  async createBudgetNotification(budgetName, email) {
    const params = {
      AccountId: process.env.AWS_ACCOUNT_ID,
      BudgetName: budgetName,
      Notification: {
        NotificationType: "ACTUAL",
        ComparisonOperator: "GREATER_THAN",
        Threshold: 90,
        ThresholdType: "PERCENTAGE",
      },
      Subscribers: [{ SubscriptionType: "EMAIL", Address: email }],
    };

    try {
      await this.budgetsClient.send(new CreateNotificationCommand(params));
    } catch (error) {
      console.error("Notification creation failed:", error);
      throw error;
    }
  }

  async updateBudget(userId, category, updates) {
    if (!userId || !category) {
      throw new Error("userId and category must be provided");
    }

    const budgetName = `user-${userId}-${category}`;

    try {
      // First get existing budget to maintain all settings
      const describeResponse = await this.budgetsClient.send(
        new DescribeBudgetCommand({
          AccountId: process.env.AWS_ACCOUNT_ID,
          BudgetName: budgetName,
        })
      );

      // Prepare update command
      const command = new UpdateBudgetCommand({
        AccountId: process.env.AWS_ACCOUNT_ID,
        NewBudget: {
          ...describeResponse.Budget,
          BudgetLimit: {
            Amount: updates.amount.toString(),
            Unit:
              updates.currency ||
              describeResponse.Budget.BudgetLimit?.Unit ||
              "USD",
          },
        },
      });

      await this.budgetsClient.send(command);
      return { success: true };
    } catch (error) {
      console.error("AWS Budget update failed:", {
        error: error.message,
        stack: error.stack,
        userId,
        category,
        updates,
      });
      throw new Error(`Budget update failed: ${error.message}`);
    }
  }

  async deleteBudget(budgetName) {
    if (!budgetName || typeof budgetName !== "string") {
      throw new Error(`Invalid budgetName: ${budgetName}`);
    }

    const params = {
      AccountId: process.env.AWS_ACCOUNT_ID,
      BudgetName: budgetName,
    };

    try {
      // Verify budget exists before deleting
      try {
        await this.budgetsClient.send(new DescribeBudgetCommand(params));
      } catch (describeError) {
        if (describeError.name === "NotFoundException") {
          console.log(`Budget ${budgetName} not found, assuming deleted`);
          return { success: true, alreadyDeleted: true };
        }
        throw describeError;
      }

      // Delete the budget
      await this.budgetsClient.send(new DeleteBudgetCommand(params));
      return { success: true };
    } catch (error) {
      console.error("AWS Budget deletion failed:", error);
      throw new Error(`Budget deletion failed: ${error.message}`);
    }
  }

  async checkBudgetWarning(userId, category, amount) {
    const budgetName = `user-${userId}-${category}`;

    try {
      const budgetResponse = await this.budgetsClient.send(
        new DescribeBudgetCommand({
          AccountId: process.env.AWS_ACCOUNT_ID,
          BudgetName: budgetName,
        })
      );

      const budget = budgetResponse.Budget;
      const today = new Date();
      const forecast = await this.costExplorerClient.send(
        new GetCostForecastCommand({
          TimePeriod: {
            Start: today.toISOString().split("T")[0],
            End: new Date(today.getFullYear(), today.getMonth() + 1, 0)
              .toISOString()
              .split("T")[0],
          },
          Metric: "UNBLENDED_COST",
          Granularity: "MONTHLY",
        })
      );

      const currentSpending = parseFloat(
        budget.CalculatedSpend?.ActualSpend?.Amount || "0"
      );
      const forecastAmount = parseFloat(forecast.Total.Amount);
      const total = currentSpending + forecastAmount;
      const percentage = (total / parseFloat(budget.BudgetLimit.Amount)) * 100;

      return {
        message: `Projected to use ${percentage.toFixed(
          2
        )}% of your ${category} budget`,
        level:
          percentage >= 100
            ? "critical"
            : percentage >= 80
            ? "warning"
            : "normal",
        percentage: percentage,
        currentSpending: total,
        budgetLimit: parseFloat(budget.BudgetLimit.Amount),
        currency: budget.BudgetLimit.Unit,
      };
    } catch (error) {
      console.error("AWS Budget check failed:", error);
      throw error;
    }
  }
}

module.exports = new AWSBudgets();
