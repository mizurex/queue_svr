import express from 'express';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
        const jobId = randomUUID();
    
        const bucketName = "your-uploads-bucket";
        const key = `uploads/${jobId}.jpg`;
    
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          ContentType: "image/jpeg",
        });
    
        const uploadUrl = await getSignedUrl(s3, command, {
          expiresIn: 60, 
        });
    
        return res.json({
          jobId,
          uploadUrl,
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to generate upload URL" });
      }
});

export default router;
