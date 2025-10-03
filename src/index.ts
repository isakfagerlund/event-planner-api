import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';

import { getDb, type AppEnv } from './env';
import { eventRoutes } from './routes/events';
import { userRoutes } from './routes/users';
import { eventUserRoutes } from './routes/event-users';
import { shoppingListRoutes } from './routes/shopping-lists';
import { shoppingListItemRoutes } from './routes/shopping-list-items';
import { scheduleRoutes } from './routes/event-schedules';
import { scheduleSlotRoutes } from './routes/event-schedule-slots';

const app = new OpenAPIHono<AppEnv>();

app.use('*', cors());

app.use('*', async (c, next) => {
  c.set('db', getDb(c.env));
  await next();
});

app.get('/', (c) => c.text('You just performed a GET request! 🎉'));

app.route('/events', eventRoutes);
app.route('/users', userRoutes);
app.route('/event-users', eventUserRoutes);
app.route('/shopping-lists', shoppingListRoutes);
app.route('/shopping-list-items', shoppingListItemRoutes);
app.route('/event-schedules', scheduleRoutes);
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
