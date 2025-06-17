import { db } from "@/db/drizzle";
import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

export async function healthCheckRoutes(app: FastifyInstance) {
  app.get("/health", async (_, res) => {
    const healthStatus = {
      http: true,
      db: true,
      redis: true,
    };

    try {
      try {
        await db.run(sql`SELECT 1`);
      } catch (dbError) {
        console.log(dbError);
        healthStatus.db = false;
      }

      try {
        await redis.ping();
      } catch {
        healthStatus.redis = false;
      }

      // If all services are okay
      if (healthStatus.db && healthStatus.redis) {
        return res.send({
          message: "ok",
          services: healthStatus,
        });
      }

      return res.status(503).send({
        message: "Service Unavailable",
        services: healthStatus,
      });
    } catch {
      // In case any unhandled error happens
      return res.status(503).send({
        message: "Service Unavailable",
        services: healthStatus,
      });
    }
  });
}
