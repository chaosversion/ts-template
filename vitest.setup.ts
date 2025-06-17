import { execSync } from 'node:child_process';
import { afterAll, beforeAll } from 'vitest';
import { app } from './src/app';

beforeAll(async () => {
  execSync('pnpm run db:migrate');
  await app.ready();
});

afterAll(async () => {
  await app.close();
});
