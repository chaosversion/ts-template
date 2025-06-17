import { execSync } from "node:child_process";
import { afterAll, beforeAll } from "vitest";
import { app } from "../src/app";

beforeAll(async () => {
  execSync("npm run knex migrate:rollback --all");
  execSync("npm run knex migrate:latest");
  await app.ready();
});

afterAll(async () => {
  await app.close();
});
