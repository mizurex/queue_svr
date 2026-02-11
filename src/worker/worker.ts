import "dotenv/config";
import { redis } from "../lib/redis";
import 'dotenv/config';
import sharp from "sharp";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function processJob(jobData: any) {
  const { jobId, bucket, key } = jobData;

  console.log("Processing:", jobId);

  await redis.set(
    `job:${jobId}`,
    JSON.stringify({ status: "processing" })
  );

  try {
    // 1️⃣ Download image from S3
    const object = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const chunks: Buffer[] = [];
    for await (const chunk of object.Body as any) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    console.log("Download successful");


    // 2️⃣ Process image
    const processed = await sharp(buffer)
      .resize(800)
      .webp({ quality: 70 })
      .toBuffer();

    const outputKey = `processed/${jobId}.webp`;

    console.log("Uploading to:", bucket, outputKey);

    // 3️⃣ Upload processed image
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: outputKey,
        Body: processed,
        ContentType: "image/webp",
      })
    );

    // 4️⃣ Update status
    await redis.set(
      `job:${jobId}`,
      JSON.stringify({
        status: "completed",
        outputKey,
      })
    );

    console.log("Completed:", jobId);
  } catch (err) {
    console.error("Failed:", err);
    console.error("Error details:", JSON.stringify(err, null, 2));
    

    await redis.set(
      `job:${jobId}`,
      JSON.stringify({
        status: "failed",
      })
    );
  }
}

async function startWorker() {
  console.log("Worker started...");

  while (true) {
    // Upstash REST client does not support blocking commands like BRPOP,
    // so we poll the list with RPOP and sleep briefly when it's empty.
    const result = await redis.rpop("imageQueue");

    if (!result) {
      // No job available, wait a bit before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    let jobData: any;
    // Support both JSON strings and plain JS objects coming from Redis.
    if (typeof result === "string") {
      try {
        jobData = JSON.parse(result);
      } catch (err) {
        console.error("Failed to parse job payload as JSON:", result, err);
        continue;
      }
    } else if (result && typeof result === "object") {
      jobData = result;
    } else {
      console.error("Unexpected job payload from Redis:", result);
      continue;
    }

    await processJob(jobData);
  }
}

startWorker();
