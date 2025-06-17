import { db } from "@/db/drizzle";
import { redis } from "@/db/redis";
import { transactions } from "@/db/schema";
import { and, eq, sum } from "drizzle-orm";
import type Redis from "ioredis";
import type { Transaction, TransactionRepository } from "../interfaces/transaction.repository";

declare module "fastify" {
  interface FastifyInstance {
    repository: TransactionRepository;
  }
}

export class DrizzleTransactionRepository implements TransactionRepository {
  private db: typeof db;
  private cache: Redis;

  constructor() {
    this.db = db;
    this.cache = redis;
  }

  async create(transaction: Omit<Transaction, "id" | "created_at">): Promise<void> {
    await this.db.insert(transactions).values(transaction);
  }

  async findBySession(sessionId: string): Promise<Transaction[]> {
    return this.db.select().from(transactions).where(eq(transactions.session_id, sessionId));
  }

  async getSummary(sessionId: string): Promise<number> {
    const cacheKey = `summary:${sessionId}`;

    // Try to get cache

    const cacheSummary = await redis.get(cacheKey);
    if (cacheSummary) {
      return Number(cacheSummary);
    }

    // Metrics of Cache

    // If no cache, retrieve on transacion table
    const result = (
      await this.db
        .select({
          amount: sum(transactions.amount),
        })
        .from(transactions)
        .where(eq(transactions.session_id, sessionId))
        .groupBy(transactions.session_id)
    )[0];

    const summary = Number(result?.amount || 0);

    // Set cache with TTL of 60s
    await this.cache.set(cacheKey, summary.toString(), "EX", 60);

    return summary;
  }

  async findByID(id: string, sessionId: string): Promise<Transaction> {
    const result = await this.db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.session_id, sessionId)))
      .limit(1);

    return result[0] || null;
  }
}
