// const { PredictionServiceClient } = require("@google-cloud/aiplatform").v1;
// const endpoint = `projects/${process.env.GOOGLE_PROJECT_ID}/locations/us-central1/publishers/google/models/text-bison@001`;
// const client = new PredictionServiceClient({
//   apiEndpoint: "us-central1-aiplatform.googleapis.com",
// });

// // Real AI Service
// exports.generateBudgetWarning = async (category, spentPercent) => {
//   try {
//     const [response] = await client.predict({
//       endpoint: `projects/${process.env.GOOGLE_PROJECT_ID}/locations/us-central1/publishers/google/models/text-bison@001`,
//       instances: [
//         {
//           content: `Generate a concise budget warning for ${category} category where ${spentPercent}% was spent. Max 15 words. Tone: concerned but helpful.`,
//         },
//       ],
//     });
//     return response.predictions[0].content;
//   } catch (err) {
//     console.error("AI Service Error:", err);
//     return null; // Fail silently
//   }
// };

// // Mock for development
// if (process.env.NODE_ENV === "development") {
//   exports.generateBudgetWarning = async (category, percent) =>
//     `[Mock] Warning! You've spent ${percent}% of your ${category} budget`;
// }
