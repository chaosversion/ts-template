import { config } from 'dotenv';
import { z } from 'zod';

// Load appropriate .env file
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: envFile });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  PORT: z.coerce.number().default(3333),
  COOKIE_SECRET: z.string().min(32),
  RATE_LIMIT_MAX: z.coerce.number().default(10)
});

const _env = envSchema.safeParse({
  ...process.env,
  // For Render.com PostgreSQL
  DATABASE_URL: process.env.DATABASE_URL || process.env.POSTGRES_EXTERNAL_URL,
  // For Render.com Redis
  REDIS_URL: process.env.REDIS_URL || process.env.REDIS_EXTERNAL_URL
});

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;

// Log loaded environment (except sensitive data)
console.log(`✅ Environment loaded (NODE_ENV=${env.NODE_ENV})`);
