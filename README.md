# Image Processing System

Asynchronous image processing pipeline that applies watermarks to images uploaded to S3.

## Architecture

The API server exposes an endpoint that generates presigned POST URLs for direct client-to-S3 uploads. When images are uploaded to S3, a Lambda function triggered by S3 events enqueues processing jobs to Redis. Worker processes poll the Redis queue, download images from S3, apply watermarks using Sharp, resize and convert to WebP format, then upload processed images back to S3 under the processed prefix.

## Worker

The worker process implements a continuous polling loop that retrieves jobs from Redis, downloads images, applies watermarks with configurable text and positioning, resizes to 800px maximum dimension, converts to WebP at 70% quality, and stores results in S3.

## Lambda Function

```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const handler = async (event) => {
  try {
    const record = event.Records[0];
    const key = decodeURIComponent(record.s3.object.key);

    const jobId = key.split("/").pop().split(".")[0];


    await redis.lpush(
      "imageQueue",
      JSON.stringify({
        jobId,
        key,
        retries:3
      })
    );

    return {
      statusCode: 200,
    };
  } catch () {
   
  }
};
```

