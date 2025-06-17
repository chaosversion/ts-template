import { env } from '@/env';
import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';

declare global {
  var redis: Redis;
}

// biome-ignore lint/suspicious/noRedeclare: singleton
export const redis =
  global.redis ||
  (env.NODE_ENV === 'test' ? new RedisMock() : new Redis(env.REDIS_URL));

if (env.NODE_ENV !== 'production') {
  global.redis = redis;
}
