import { execSync } from 'node:child_process';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    execSync('pnpm run db:migrate');
  });

  it('should be able to create a new transaction', async () => {
    const response = await request(app.server).post('/transactions').send({
      title: 'New transaction',
      amount: 5000,
      type: 'credit'
    });

    expect(response.statusCode).toEqual(201);
    expect(response.get('Set-Cookie')).toBeDefined();
  });

  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit'
      });

    const cookies = createTransactionResponse.get('Set-Cookie') ?? [];

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies);

    expect(listTransactionsResponse.statusCode).toEqual(200);
    expect(listTransactionsResponse.body).toEqual([
      expect.objectContaining({
        title: 'New transaction',
        amount: 5000
      })
    ]);
  });

  it('should be able to get a specific transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit'
      });

    const cookies = createTransactionResponse.get('Set-Cookie') ?? [];

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies);

    const transactionId = listTransactionsResponse.body.id;

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies);

    expect(getTransactionResponse.statusCode).toEqual(200);
    expect(getTransactionResponse.body).toEqual(
      expect.objectContaining({
        title: 'New transaction',
        amount: 5000
      })
    );
  });

  it('should be able to get the summary', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit transaction',
        amount: 5000,
        type: 'credit'
      });

    const cookies = createTransactionResponse.get('Set-Cookie') ?? [];

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit transaction',
        amount: 2000,
        type: 'debit'
      });

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies);

    expect(summaryResponse.statusCode).toEqual(200);
    expect(summaryResponse.body).toEqual({
      amount: 3000
    });
  });

  it('should not be able to list transactions without session cookie', async () => {
    const response = await request(app.server).get('/transactions');

    expect(response.statusCode).toEqual(401);
  });
});
