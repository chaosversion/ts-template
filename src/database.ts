import { type Knex, knex as setupKnex } from "knex";
import { env } from "./env";

export const config: Knex.Config = {
  client: env.DATABASE_CLIENT,
  connection: getDatabaseConnection(),
  useNullAsDefault: true,
  migrations: {
    extension: "ts",
    directory: "./db/migrations",
  },
  pool:
    env.DATABASE_CLIENT === "pg"
      ? {
          min: 2,
          max: 10,
          idleTimeoutMillis: 30000,
          createTimeoutMillis: 30000,
          acquireTimeoutMillis: 30000,
        }
      : undefined,
};

function getDatabaseConnection() {
  if (env.DATABASE_CLIENT === "sqlite") {
    return {
      filename: env.DATABASE_URL,
    };
  }

  // For PostgreSQL (Render.com's default)
  if (env.DATABASE_URL.includes("postgres://")) {
    return {
      connectionString: env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    };
  }

  return env.DATABASE_URL;
}

export const knex = setupKnex(config);

// Add connection test
knex
  .raw("SELECT 1")
  .then(() => console.log("Database connection established"))
  .catch((err) => {
    console.error("Database connection failed", err);
    process.exit(1);
  });
