import 'dotenv/config';
import { Queue } from 'bullmq';
import ioredis from 'ioredis';

const connection = new ioredis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
});

const queue = new Queue('queue', { connection });

export { queue , connection};
