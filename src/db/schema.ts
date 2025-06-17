import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id", { length: 36 }).notNull().primaryKey().default(randomUUID()),
    title: text("title", { length: 255 }).notNull(),
    amount: real("amount").notNull(), // THIS WILL HAVE ROUNDING ERRORS, USE DECIMAL(10, 2) IN ANOTHER SQL DB
    session_id: text("session_id", { length: 36 }).notNull(),
    created_at: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    sessionIdIdx: index("idx_session_id").on(table.session_id),
  }),
);
