import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { validator } from 'hono/validator';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { events, eventsSelectSchema } from '../drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

const app = new Hono();

const createEventSchema = eventsSelectSchema.pick({ id: true, name: true });
const updateEventSchema = eventsSelectSchema.pick({ name: true });

app.use(cors());

app.get('/', (c) => c.text('You just performed a GET request! 🎉'));

app.get('/events', async (c) => {
  const allEvents = await db.select().from(events);
  return c.json(allEvents);
});

app.get('/events/:id', async (c) => {
  const eventId = c.req.param('id');
  const [event] = await db.select().from(events).where(eq(events.id, eventId));

  if (!event) {
    return c.json({ message: 'Event not found' }, 404);
  }

  return c.json(event);
});

app.post(
  '/events',
  validator('json', (value, c) => {
    const parsed = createEventSchema.safeParse(value);
    if (!parsed.success) {
      return c.json({ message: 'Invalid event payload' }, 422);
    }
    return parsed.data;
  }),
  async (c) => {
    const body = c.req.valid('json');

    const [createdEvent] = await db.insert(events).values(body).returning();

    if (!createdEvent) {
      return c.json({ message: 'Unable to create event' }, 500);
    }

    return c.json(createdEvent, 201);
  }
);

app.put(
  '/events/:id',
  validator('json', (value, c) => {
    const parsed = updateEventSchema.safeParse(value);
    if (!parsed.success) {
      return c.json({ message: 'Invalid event payload' }, 422);
    }
    return parsed.data;
  }),
  async (c) => {
    const eventId = c.req.param('id');
    const body = c.req.valid('json');

    const [updatedEvent] = await db
      .update(events)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(eq(events.id, eventId))
      .returning();

    if (!updatedEvent) {
      return c.json({ message: 'Event not found' }, 404);
    }

    return c.json(updatedEvent);
  }
);

app.delete('/events/:id', async (c) => {
  const eventId = c.req.param('id');

  const [deletedEvent] = await db
    .delete(events)
    .where(eq(events.id, eventId))
    .returning();

  if (!deletedEvent) {
    return c.json({ message: 'Event not found' }, 404);
  }

  return c.json(deletedEvent);
});

app.notFound((c) => {
  return c.text('Custom 404 Message', 404);
});

export default {
  port: 1337,
  fetch: app.fetch,
};
