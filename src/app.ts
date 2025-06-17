import { fastifyCookie } from '@fastify/cookie';
import { fastifyHelmet } from '@fastify/helmet';
import { fastifyRateLimit } from '@fastify/rate-limit';
import { fastify } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './errors/app-error';
import { healthCheckRoutes } from './routes/health_check.routes';
import { transactionsRoutes } from './routes/transactions.routes';
import { env } from './env';

export const app = fastify({
  logger: true
});

// Register plugins and routes
app.register(fastifyCookie, {
  secret: env.COOKIE_SECRET
});

app.register(fastifyHelmet, {
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
  frameguard: { action: 'deny' }
});

app.register(fastifyRateLimit, {
  global: true,
  max: env.NODE_ENV === 'development' ? 1000 : env.RATE_LIMIT_MAX,
  timeWindow: '1 minute',
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true
  }
});

// Register routes
app.register(transactionsRoutes, { prefix: 'transactions' });
app.register(healthCheckRoutes);

// Error handler
app.setErrorHandler((error, _, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      type: 'validation_error',
      issues: error.errors
    });
  }

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      type: 'application_error',
      message: error.message
    });
  }

  app.log.error(error, 'Unhandled error');
  return reply.status(500).send({
    type: 'internal_error',
    message: 'Internal server error'
  });
});
