import { app } from './src/app';

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

console.log(response.statusCode);
console.log(response.body);
console.log(response.headers['set-cookie']);
