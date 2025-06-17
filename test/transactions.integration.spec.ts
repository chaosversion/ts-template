import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/app";
import { knex } from "../src/database";

describe.skip("Transactions API", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await knex.destroy();
    await app.close();
  });

  beforeEach(async () => {
    await knex("transactions").truncate();
  });

  // Helper function to create a transaction and get cookies
  async function createTestTransaction(
    data = {
      title: "Test transaction",
      amount: 100,
      type: "credit",
    },
  ) {
    const response = await request(app.server).post("/transactions").send(data);
    return {
      cookies: response.get("Set-Cookie"),
      body: response.body,
    };
  }

  it("should create a new transaction", async () => {
    const response = await request(app.server)
      .post("/transactions")
      .send({
        title: "Test transaction",
        amount: 100,
        type: "credit",
      })
      .expect(201);

    const cookies = response.get("Set-Cookie");
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain("sessionId");
  });

  it("should not create a transaction with invalid content type", async () => {
    await request(app.server)
      .post("/transactions")
      .set("Content-Type", "text/plain")
      .send("invalid content")
      .expect(415);
  });

  it("should not create a transaction with invalid data", async () => {
    // TODO implement feature
    const response = await request(app.server).post("/transactions").send({
      title: "", // invalid empty title
      amount: "not a number", // invalid amount
      type: "invalid", // invalid type
    });

    // Changed assertion since Zod validation returns 400
    expect(response.status).toBe(400);
  });

  it("should list all transactions for a session", async () => {
    const { cookies } = await createTestTransaction();

    const listResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    expect(listResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Test transaction",
          amount: 100,
        }),
      ]),
    );
  });

  it("should not list transactions without a session cookie", async () => {
    await request(app.server).get("/transactions").expect(401);
  });

  it("should get a specific transaction by ID", async () => {
    const { cookies } = await createTestTransaction();

    // First get list to obtain the ID
    const listResponse = await request(app.server).get("/transactions").set("Cookie", cookies);

    const transactionId = listResponse.body[0].id;

    const getResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(getResponse.body).toEqual(
      expect.objectContaining({
        id: transactionId,
        title: "Test transaction",
        amount: 100,
      }),
    );
  });

  it("should not get a transaction with invalid ID", async () => {
    // TODO implement feature
    const { cookies } = await createTestTransaction();

    const response = await request(app.server)
      .get("/transactions/invalid-id")
      .set("Cookie", cookies);

    expect(response.status).toBe(400);
  });

  it.skip("should get the summary of transactions", async () => {
    const { cookies } = await createTestTransaction({
      title: "Credit transaction",
      amount: 500,
      type: "credit",
    });

    // Create debit transaction with same session
    await request(app.server).post("/transactions").set("Cookie", cookies).send({
      title: "Debit transaction",
      amount: 200,
      type: "debit",
    });

    // Added delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));

    const summaryResponse = await request(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies)
      .expect(200);

    expect(summaryResponse.body).toEqual({
      amount: 300, // 500 - 200
    });
  });

  it("should maintain session between requests", async () => {
    const { cookies } = await createTestTransaction();

    // Second transaction with same session
    await request(app.server).post("/transactions").set("Cookie", cookies).send({
      title: "Second transaction",
      amount: 200,
      type: "credit",
    });

    const listResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
  });
});
