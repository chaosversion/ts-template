import { randomUUID } from "node:crypto";
import { DrizzleTransactionRepository } from "@/repositories/drizzle/transaction.repository";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../env";
import { hasValidSessionCookie } from "../middleware/has-valid-session-cookie";

export async function transactionsRoutes(app: FastifyInstance) {
  const repository = new DrizzleTransactionRepository();

  app.addHook("preHandler", (request, reply, done) => {
    const allowedMethods = ["POST", "PUT"];

    if (allowedMethods.includes(request.method)) {
      const contentType = request.headers["content-type"];
      if (!contentType || !contentType.includes("application/json")) {
        return reply.status(415).send({
          error: "Unsupported Media Type",
          message: "Content-Type must be application/json",
        });
      }
    }
    done();
  });

  // LIST ALL
  app.get("/", { preHandler: [hasValidSessionCookie] }, async (request) => {
    const { sessionId } = request.cookies;
    if (sessionId == null) {
      return { error: "Session ID is missing" };
    }
    return repository.findBySession(sessionId);
  });

  // GET BY ID
  app.get("/:id", { preHandler: [hasValidSessionCookie] }, async (request) => {
    const getTransacionsParamsSchema = z.object({
      id: z.string().uuid(),
    });
    const { sessionId } = request.cookies;
    if (sessionId == null) {
      return { error: "Session ID is missing" };
    }
    const { id } = getTransacionsParamsSchema.parse(request.params);
    const transactions = await repository.findByID(id, sessionId);
    return transactions;
  });

  // GET SUMMARY
  app.get("/summary", { preHandler: [hasValidSessionCookie] }, async (request) => {
    const { sessionId } = request.cookies;
    if (sessionId == null) {
      return { error: "Session ID is missing" };
    }
    const amount = await repository.getSummary(sessionId);
    return { amount };
  });

  // POST
  app.post("/", async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = createTransactionBodySchema.parse(request.body);

    let { sessionId } = request.cookies;

    if (!sessionId) {
      sessionId = randomUUID();
      reply.cookie("sessionId", sessionId, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    await repository.create({
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId,
    });

    return reply.status(201).send();
  });
}
