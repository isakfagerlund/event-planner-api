import { Hono } from 'hono';

import { validator } from 'hono/validator';
import { drizzle } from 'drizzle-orm/neon-http';
import { events, eventsSelectSchema } from '../drizzle/schema';
const db = drizzle(process.env.DATABASE_URL!);
import { cors } from 'hono/cors';

const app = new Hono();

app.use(cors());
app.get('/', (c) => c.text('You just performed a GET request! 🎉'));
app.post(
  '/',
  validator('json', async (_, c) => {
    const data = await c.req.json();
    const parsed = eventsSelectSchema.safeParse(data);
    if (!parsed.success) {
      console.log('Failed', parsed.error);
      return c.text('Invalid!', 401);
    }
    return parsed.data;
  }),
  async (c) => {
    const body = c.req.valid('json');

    await db.insert(events).values(body);

    return c.text(`You added a new event succecfully ${body.name}`, 200);
  }
);
app.put('/', (c) => c.text('PUT request in action! 🔄'));
app.delete('/', (c) => c.text('DELETE request executed! 🗑️'));

app.notFound((c) => {
  return c.text('Custom 404 Message', 404);
});

export default {
  port: 1337,
  fetch: app.fetch,
};
