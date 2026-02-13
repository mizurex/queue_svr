import express from 'express';
import { randomUUID } from 'crypto';
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import "dotenv/config";
import {redis} from "../lib/redis";
const router = express.Router();

const s3 = new S3Client({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  

router.get('/', async (req, res) => {
    try {
        const text = (req.query.q as string) || "@Turf";
        const jobId = randomUUID();

        await redis.set(jobId,text);

        const bucketName = process.env.AWS_BUCKET_NAME!;
        const key = `uploads/${jobId}.jpg`;
    
     
  const { url, fields } = await createPresignedPost(s3, {
    Bucket: bucketName,
    Key: key,
    Conditions: [
      ["eq", "$Content-Type", "image/jpeg"], 
      ["eq", "$x-amz-meta-user-id", jobId], 
      ["content-length-range", 0, 5* 1024 * 1024],
    ],
    Expires: 60 
  }); 

  res.json({
    jobId,
    url,
    fields
  });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to generate upload URL" });
      }
});

export default router;
