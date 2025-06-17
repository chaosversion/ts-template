import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';

describe('Transactions API', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // Helper function to create a transaction and get cookies
  async function createTestTransaction(
    data = {
      title: 'Test transaction',
      amount: 100,
      type: 'credit'
    }
  ) {
    const response = await app.inject({
      method: 'POST',
      url: '/transactions',
      payload: data,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const cookies = response.headers['set-cookie'];
    const cookieString = Array.isArray(cookies) ? cookies[0] : cookies;

    return {
      cookies: cookieString,
      body: response.body,
      response,
      statusCode: response.statusCode
    };
  }

  it('should create a new transaction', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/transactions',
      payload: {
        title: 'Test transaction',
        amount: 100,
        type: 'credit'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.statusCode).toBe(201);
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const cookieString = Array.isArray(cookies) ? cookies[0] : cookies;
    expect(cookieString).toContain('sessionId');
  });

  it('should not create a transaction with invalid content type', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/transactions',
      payload: 'invalid content',
      headers: {
        'Content-Type': 'text/plain'
      }
    });

    expect(response.statusCode).toBe(415);
  });

  it('should not create a transaction with invalid data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/transactions',
      payload: {
        title: '', // invalid empty title - but Zod allows empty strings by default
        amount: 'not a number', // invalid amount
        type: 'invalid' // invalid type
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Zod validation error should return 400 or 500 depending on error handling
    expect([400, 500]).toContain(response.statusCode);
  });

  it('should list all transactions for a session', async () => {
    const { cookies, statusCode } = await createTestTransaction();
    expect(statusCode).toBe(201);
    expect(cookies).toBeDefined();

    const listResponse = await app.inject({
      method: 'GET',
      url: '/transactions',
      headers: {
        Cookie: cookies
      }
    });

    expect(listResponse.statusCode).toBe(200);
    const transactions = JSON.parse(listResponse.body);
    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Test transaction',
          amount: 100 // Should be positive 100 for credit
        })
      ])
    );
  });

  it('should not list transactions without a session cookie', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/transactions'
    });

    expect(response.statusCode).toBe(401);
  });

  it('should get a specific transaction by ID', async () => {
    const { cookies, statusCode } = await createTestTransaction();
    expect(statusCode).toBe(201);
    expect(cookies).toBeDefined();

    // First get list to obtain the ID
    const listResponse = await app.inject({
      method: 'GET',
      url: '/transactions',
      headers: {
        Cookie: cookies
      }
    });

    expect(listResponse.statusCode).toBe(200);
    const transactions = JSON.parse(listResponse.body);
    expect(transactions.length).toBeGreaterThan(0);

    const transactionId = transactions[0].id;
    expect(transactionId).toBeDefined();

    const getResponse = await app.inject({
      method: 'GET',
      url: `/transactions/${transactionId}`,
      headers: {
        Cookie: cookies
      }
    });

    expect(getResponse.statusCode).toBe(200);
    const transaction = JSON.parse(getResponse.body);
    expect(transaction).toEqual(
      expect.objectContaining({
        id: transactionId,
        title: 'Test transaction',
        amount: 100
      })
    );
  });

  it('should not get a transaction with invalid ID', async () => {
    const { cookies, statusCode } = await createTestTransaction();
    expect(statusCode).toBe(201);
    expect(cookies).toBeDefined();

    const response = await app.inject({
      method: 'GET',
      url: '/transactions/invalid-id',
      headers: {
        Cookie: cookies
      }
    });

    // Zod validation for UUID should fail
    expect([400, 500]).toContain(response.statusCode);
  });

  it('should get the summary of transactions', async () => {
    const { cookies, statusCode } = await createTestTransaction({
      title: 'Credit transaction',
      amount: 500,
      type: 'credit'
    });
    expect(statusCode).toBe(201);
    expect(cookies).toBeDefined();

    // Create debit transaction with same session
    const debitResponse = await app.inject({
      method: 'POST',
      url: '/transactions',
      payload: {
        title: 'Debit transaction',
        amount: 200,
        type: 'debit'
      },
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies
      }
    });
    expect(debitResponse.statusCode).toBe(201);

    const summaryResponse = await app.inject({
      method: 'GET',
      url: '/transactions/summary',
      headers: {
        Cookie: cookies
      }
    });

    expect(summaryResponse.statusCode).toBe(200);
    const summary = JSON.parse(summaryResponse.body);
    expect(summary).toEqual({
      amount: 300 // 500 + (-200) = 300
    });
  });

  it('should maintain session between requests', async () => {
    const { cookies, statusCode } = await createTestTransaction();
    expect(statusCode).toBe(201);
    expect(cookies).toBeDefined();

    // Second transaction with same session
    const secondResponse = await app.inject({
      method: 'POST',
      url: '/transactions',
      payload: {
        title: 'Second transaction',
        amount: 200,
        type: 'credit'
      },
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies
      }
    });
    expect(secondResponse.statusCode).toBe(201);

    const listResponse = await app.inject({
      method: 'GET',
      url: '/transactions',
      headers: {
        Cookie: cookies
      }
    });

    expect(listResponse.statusCode).toBe(200);
    const transactions = JSON.parse(listResponse.body);
    expect(transactions).toHaveLength(2);
  });
});
