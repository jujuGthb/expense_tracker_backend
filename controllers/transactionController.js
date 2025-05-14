const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const AWSBudgets = require("../services/awsBudgets");

const { checkBudgetWarning } = require("../utils/utils_functions");

const speech = require("@google-cloud/speech");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "./.env") });

const os = require("os");

exports.googleSpeechTotext = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file received" });
    }

    const client = new speech.SpeechClient();

    // Create unique filenames using timestamp and random number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    const tempId = ` ${timestamp}_${random}`;
    const inputPath = path.join(os.tmpdir(), `${tempId}.m4a`);
    const outputPath = path.join(os.tmpdir(), `${tempId}.flac`);

    // Write the uploaded buffer to a temp .m4a file
    fs.writeFileSync(inputPath, req.file.buffer);

    ffmpeg(inputPath)
      .audioCodec("flac")
      .audioFrequency(44100)
      .audioChannels(1)
      .on("end", async () => {
        try {
          const audio = {
            content: fs.readFileSync(outputPath).toString("base64"),
          };

          const request = {
            audio,
            config: {
              encoding: "FLAC",
              sampleRateHertz: 44100,
              languageCode: req.body.language || "en-US",
            },
          };

          const [response] = await client.recognize(request);

          // Clean up temp files
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);

          if (!response.results || response.results.length === 0) {
            return res.status(400).json({ error: "No transcription found." });
          }

          const transcript = response.results
            .map((r) => r.alternatives[0].transcript)
            .join("\n");

          console.log(transcript);

          res.status(200).json({ message: "success", data: transcript });
        } catch (err) {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
          console.error("Transcription error:", err);
          res.status(500).json({ error: "Error during audio transcription" });
        }
      })
      .on("error", (err) => {
        fs.unlinkSync(inputPath);
        console.error("FFmpeg error:", err);
        res.status(500).json({ error: "Audio conversion error" });
      })
      .save(outputPath);
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// exports.createTransaction = async (req, res) => {
//   try {
//     const { title, amount, type, category = "Uncategorized" } = req.body;

//     if (!title || !amount || !type) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     console.log("Creating transaction for user:", req.user.id);

//     const transaction = new Transaction({
//       userId: req.user.id,
//       title,
//       amount: parseFloat(amount),
//       type,
//       category,
//       date: new Date(),
//     });

//     const savedTransaction = await transaction.save();
//     let warning = null;

//     if (type === "expense") {
//       warning = await checkBudgetWarning(req.user.id, category, amount);
//     }
//     console.log("Warning", warning);
//     res.status(201).json({
//       transaction: savedTransaction.toObject(),
//       warning,
//     });
//   } catch (err) {
//     console.error("Transaction creation error:", err);
//     res.status(500).json({ message: "Failed to create transaction" });
//   }
// };

exports.createTransaction = async (req, res) => {
  try {
    const { title, amount, type, category = "Uncategorized" } = req.body;

    if (!title || !amount || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const transaction = new Transaction({
      userId: req.user.id,
      title,
      amount: parseFloat(amount),
      type,
      category,
      date: new Date(),
    });

    const savedTransaction = await transaction.save();
    let warning = null;

    if (type === "expense") {
      warning = await checkBudgetWarning(req.user.id, category, amount);
    }

    res.status(201).json({
      transaction: savedTransaction.toObject(),
      warning,
    });
  } catch (err) {
    console.error("Transaction creation error:", err);
    res.status(500).json({ message: "Failed to create transaction" });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({
      date: -1,
    });
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve transactions" });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, date } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    transaction.title = title;
    transaction.amount = amount;
    transaction.type = type;
    transaction.category = category;
    transaction.date = date || transaction.date;

    const updatedTransaction = await transaction.save();
    res.status(200).json(updatedTransaction);
  } catch (err) {
    res.status(500).json({ message: "Failed to update transaction" });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await transaction.deleteOne();
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete transaction" });
  }
};
