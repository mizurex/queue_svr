import "dotenv/config";
import { redis } from "../lib/redis";
import sharp from "sharp";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand
} from "@aws-sdk/client-s3";
import { addWatermark } from "../utils/watermark";

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function processJob(jobData: any) {
  const { jobId, key , retries} = jobData;
  const bucket = process.env.AWS_BUCKET_NAME!;

  console.log("Processing:", jobId);

  try {
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

    const text = await redis.get(jobId);
    const watermarkText = text && typeof text === "string" && text.trim() 
      ? text.trim() 
      : "©potatoturf";

    const process = await addWatermark(
      buffer, 
      watermarkText
    );

    const processed = await sharp(process)
      .resize(800)
      .webp({ quality: 70 })
      .toBuffer();

    const outputKey = `processed/${jobId}.webp`; // s3 key

    console.log("Uploading to:", bucket, outputKey);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: outputKey,
        Body: processed,
        ContentType: "image/webp",
      })
    );

    console.log("Completed:", jobId);
  } catch (err) {
  if( retries > 0){
     await redis.lpush(
        "imageQueue",
        JSON.stringify({
          jobId,
          key,
          retries: retries - 1
        })
      );
  } 
    console.error("Failed:", err);
    console.error("Error details:", JSON.stringify(err, null, 2));
  }
}

async function startWorker() {
  console.log("Worker started");

  while (true) {
    const result = await redis.rpop("imageQueue");

    if (!result) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      continue;
    }

    let jobData: any;
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
