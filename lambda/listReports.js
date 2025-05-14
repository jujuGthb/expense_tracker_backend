const AWS = require("aws-sdk");

// Configure AWS SDK
const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    console.log("Event received:", JSON.stringify(event, null, 2));

    const { userId } = event;

    if (!userId) {
      throw new Error("User ID is required");
    }

    // List objects in the user's reports folder
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: `reports/${userId}/`,
    };

    console.log(
      "Listing objects with params:",
      JSON.stringify(params, null, 2)
    );

    const response = await s3.listObjectsV2(params).promise();

    console.log(
      "S3 listObjectsV2 response:",
      JSON.stringify(response, null, 2)
    );

    // Check if Contents exists and is not empty
    if (!response.Contents || response.Contents.length === 0) {
      console.log("No reports found for user:", userId);
      return {
        reports: [],
      };
    }

    // Format the response
    const reports = response.Contents.map((item) => {
      // Extract report details from the key
      const key = item.Key;
      const filename = key.split("/").pop();

      // Parse filename to extract metadata
      // Example: transactions_2023-01-01_to_2023-01-31_2023-01-31T12-00-00-000Z.pdf
      let type = "report";
      let startDate = "";
      let endDate = "";
      let format = "";

      try {
        const parts = filename.split("_");
        type = parts[0] || "report";
        startDate = parts[1] || "";
        // Handle case where endDate might not be in expected position
        endDate = parts[3] ? parts[3].split(".")[0] : "";
        format = filename.split(".").pop() || "";
      } catch (parseError) {
        console.warn("Error parsing filename:", filename, parseError);
      }

      return {
        key,
        filename,
        type,
        startDate,
        endDate,
        format,
        size: item.Size,
        lastModified: item.LastModified,
      };
    });

    console.log("Returning reports:", JSON.stringify({ reports }, null, 2));

    return {
      reports,
    };
  } catch (error) {
    console.error("Error listing reports:", error);
    return {
      error: error.message,
      reports: [],
    };
  }
};
