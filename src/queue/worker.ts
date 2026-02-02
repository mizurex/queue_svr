import 'dotenv/config';
import { Job, Worker } from 'bullmq';
import ioredis from 'ioredis';

const connection = new ioredis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
});

const worker = new Worker(
    "queue",
    async (job: Job) => {
      console.log("Processing job:", job.id, job.data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { message: "email sent successfully" };
    },
    { connection }
  );
  
  worker.on("completed", (job) => {
    console.log("Job completed:", job.id);
  });
  
  worker.on("failed", (job, err) => {
    console.log("Job failed:", err);
  });
  
  worker.on("error", (err) => {
    console.log("Worker error:", err);
  });
  