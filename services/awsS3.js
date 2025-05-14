// s3.js
const path = require("path");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const {
  getSignedUrl: s3GetSignedUrl,
} = require("@aws-sdk/s3-request-presigner");

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

exports.uploadToS3 = async (fileContent, fileName, contentType) => {
  if (!fileName) {
    throw new Error("File name is required for S3 upload");
  }

  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME environment variable is not set");
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: fileContent,
      ContentType: contentType,
      ACL: "public-read", // Make the file publicly accessible
    });

    await s3Client.send(command);

    // Return the public URL
    return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

exports.getSignedUrl = async (fileName, expirySeconds = 3600) => {
  if (!fileName) {
    throw new Error("File name (key) is required for generating a signed URL");
  }

  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME environment variable is not set");
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });

    // Generate the signed URL
    return await s3GetSignedUrl(s3Client, command, {
      expiresIn: expirySeconds,
    });
  } catch (error) {
    console.error("S3 signed URL error:", error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

exports.deleteFromS3 = async (fileName) => {
  if (!fileName) {
    throw new Error("File name (key) is required for S3 deletion");
  }

  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME environment variable is not set");
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};
