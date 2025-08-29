import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-north-1", // Ensure AWS_REGION is set in your environment
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  requestHandler: {
    // Increase timeout for large files
    timeoutInMillis: 900000, // 15 minutes
  },
  maxAttempts: 3,
});

export default s3Client;
