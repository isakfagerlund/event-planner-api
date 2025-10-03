import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';

import { getAuthConfig, getDb, type AppEnv } from './env';
import { eventRoutes } from './routes/events';
import { userRoutes } from './routes/users';
import { eventUserRoutes } from './routes/event-users';
import { shoppingListRoutes } from './routes/shopping-lists';
import { shoppingListItemRoutes } from './routes/shopping-list-items';
import { scheduleRoutes } from './routes/event-schedules';
import { scheduleSlotRoutes } from './routes/event-schedule-slots';
import { authRoutes } from './routes/auth';
import { optionalAuth, requireAuth } from './auth/middleware';

const app = new OpenAPIHono<AppEnv>();

app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

app.use('*', cors());

app.use('*', async (c, next) => {
  c.set('db', getDb(c.env));
  c.set('authConfig', getAuthConfig(c.env));
  await next();
});

app.use('*', optionalAuth);

app.get('/', (c) => c.text('You just performed a GET request! 🎉'));

app.route('/auth', authRoutes);

app.use('/events', requireAuth);
app.use('/events/*', requireAuth);
app.route('/events', eventRoutes);
app.use('/users', requireAuth);
app.use('/users/*', requireAuth);
app.route('/users', userRoutes);
app.use('/event-users', requireAuth);
app.use('/event-users/*', requireAuth);
app.route('/event-users', eventUserRoutes);
app.use('/shopping-lists', requireAuth);
app.use('/shopping-lists/*', requireAuth);
app.route('/shopping-lists', shoppingListRoutes);
app.use('/shopping-list-items', requireAuth);
app.use('/shopping-list-items/*', requireAuth);
app.route('/shopping-list-items', shoppingListItemRoutes);
app.use('/event-schedules', requireAuth);
app.use('/event-schedules/*', requireAuth);
app.route('/event-schedules', scheduleRoutes);
app.use('/event-schedule-slots', requireAuth);
app.use('/event-schedule-slots/*', requireAuth);
app.route('/event-schedule-slots', scheduleSlotRoutes);

app.get(
  '/ui',
  swaggerUI({
    url: '/doc',
  })
);

app.doc('/doc', {
  openapi: '3.1.0',
  info: {
    title: 'Event Planner API',
    version: '1.0.0',
    description: 'Interactive documentation for the Event Planner API',
  },
});

app.notFound((c) => {
  return c.text('Custom 404 Message', 404);
});

export default {
  port: 1337,
  fetch: app.fetch,
};
