import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

import { events } from '../../drizzle/schema';
import { errorSchema, timestampExample } from './schemas/common';
import type { AppEnv } from '../env';

const eventSchema = z
  .object({
    id: z.string().openapi({ example: 'evt_123' }),
    name: z.string().min(1).openapi({ example: 'Launch Party' }),
    description: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'A fun get-together' }),
    startsAt: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .openapi({ example: '2024-08-01T18:00:00.000Z' }),
    endsAt: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .openapi({ example: '2024-08-01T22:00:00.000Z' }),
    createdAt: z
      .string()
      .datetime()
      .openapi({ example: timestampExample }),
    updatedAt: z
      .string()
      .datetime()
      .openapi({ example: '2024-07-15T09:30:00.000Z' }),
  })
  .openapi('Event');

const createEventSchema = z
  .object({
    id: z.string().min(1).openapi({ example: 'evt_123' }),
    name: z.string().min(1).openapi({ example: 'Launch Party' }),
    description: z
      .string()
      .optional()
      .openapi({ example: 'A fun get-together' }),
    startsAt: z
      .string()
      .datetime()
      .optional()
      .openapi({ example: '2024-08-01T18:00:00.000Z' }),
    endsAt: z
      .string()
      .datetime()
      .optional()
      .openapi({ example: '2024-08-01T22:00:00.000Z' }),
  })
  .openapi('CreateEventPayload');

const updateEventSchema = z
  .object({
    name: z.string().min(1).openapi({ example: 'Launch Party (Updated)' }),
  })
  .openapi('UpdateEventPayload');

const eventIdParamSchema = z
  .object({
    id: z.string().min(1).openapi({ example: 'evt_123' }),
  })
  .openapi('EventIdParams');

export const eventRoutes = new OpenAPIHono<AppEnv>();

eventRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Events'],
    summary: 'List events',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'A list of events',
        content: {
          'application/json': {
            schema: z.array(eventSchema).openapi('EventList'),
          },
        },
      },
    },
  }),
  async (c) => {
    const allEvents = await c.var.db.select().from(events);
    return c.json(allEvents, 200);
  }
);

eventRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/:id',
    tags: ['Events'],
    summary: 'Get a single event',
    request: {
      params: eventIdParamSchema,
    },
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'The requested event',
        content: {
          'application/json': {
            schema: eventSchema,
          },
        },
      },
      404: {
        description: 'Event not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: eventId } = c.req.valid('param');
    const [event] = await c.var.db.select().from(events).where(eq(events.id, eventId));

    if (!event) {
      return c.json({ message: 'Event not found' }, 404);
    }

    return c.json(event, 200);
  }
);

eventRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Events'],
    summary: 'Create a new event',
    request: {
      body: {
        content: {
          'application/json': {
            schema: createEventSchema,
          },
        },
        required: true,
      },
    },
    security: [{ bearerAuth: [] }],
    responses: {
      201: {
        description: 'Event created',
        content: {
          'application/json': {
            schema: eventSchema,
          },
        },
      },
      500: {
        description: 'Creation failed',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid('json');

    const [createdEvent] = await c.var.db.insert(events).values(body).returning();

    if (!createdEvent) {
      return c.json({ message: 'Unable to create event' }, 500);
    }

    return c.json(createdEvent, 201);
  }
);

eventRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/:id',
    tags: ['Events'],
    summary: 'Update an event',
    request: {
      params: eventIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: updateEventSchema,
          },
        },
        required: true,
      },
    },
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Updated event',
        content: {
          'application/json': {
            schema: eventSchema,
          },
        },
      },
      404: {
        description: 'Event not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: eventId } = c.req.valid('param');
    const body = c.req.valid('json');

    const [updatedEvent] = await c.var.db
      .update(events)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(eq(events.id, eventId))
      .returning();

    if (!updatedEvent) {
      return c.json({ message: 'Event not found' }, 404);
    }

    return c.json(updatedEvent, 200);
  }
);

eventRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/:id',
    tags: ['Events'],
    summary: 'Delete an event',
    request: {
      params: eventIdParamSchema,
    },
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Deleted event',
        content: {
          'application/json': {
            schema: eventSchema,
          },
        },
      },
      404: {
        description: 'Event not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: eventId } = c.req.valid('param');

    const [deletedEvent] = await c.var.db
      .delete(events)
      .where(eq(events.id, eventId))
      .returning();

    if (!deletedEvent) {
      return c.json({ message: 'Event not found' }, 404);
    }

    return c.json(deletedEvent, 200);
  }
);
