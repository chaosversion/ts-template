import { env } from "@/env";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

import { drizzle } from "drizzle-orm/libsql";
const client = createClient({
  url: env.DATABASE_URL,
});

// import pg from 'pg';
// import { drizzle } from 'drizzle-orm/node-postgres';
// const client = new pg.Pool({
//   connectionString: env.DATABASE_URL
// });

export const db = drizzle(client, {
  schema,
  logger: true,
});
