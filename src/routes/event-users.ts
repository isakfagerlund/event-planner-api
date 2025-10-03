import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { and, eq } from 'drizzle-orm';

import { eventUsers } from '../../drizzle/schema';
import { errorSchema, timestampExample } from './schemas/common';
import type { AppEnv } from '../env';

const eventUserSchema = z
  .object({
    eventId: z.string().openapi({ example: 'evt_launch' }),
    userId: z.string().openapi({ example: 'usr_alice' }),
    role: z.string().openapi({ example: 'editor' }),
    createdAt: z.string().datetime().openapi({ example: timestampExample }),
    updatedAt: z.string().datetime().openapi({ example: timestampExample }),
  })
  .openapi('EventUser');

const createEventUserSchema = z
  .object({
    eventId: z.string().openapi({ example: 'evt_launch' }),
    userId: z.string().openapi({ example: 'usr_alice' }),
    role: z.string().optional().openapi({ example: 'editor' }),
  })
  .openapi('CreateEventUserPayload');

const updateEventUserSchema = z
  .object({
    role: z.string().openapi({ example: 'viewer' }),
  })
  .openapi('UpdateEventUserPayload');

const eventUserParamSchema = z
  .object({
    eventId: z.string().openapi({ example: 'evt_launch' }),
    userId: z.string().openapi({ example: 'usr_alice' }),
  })
  .openapi('EventUserParams');

export const eventUserRoutes = new OpenAPIHono<AppEnv>();

eventUserRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Event Memberships'],
    summary: 'List event memberships',
    responses: {
      200: {
        description: 'A list of event memberships',
        content: {
          'application/json': {
            schema: z.array(eventUserSchema).openapi('EventUserList'),
          },
        },
      },
    },
  }),
  async (c) => {
    const memberships = await c.var.db.select().from(eventUsers);
    return c.json(memberships, 200);
  }
);

eventUserRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/:eventId/:userId',
    tags: ['Event Memberships'],
    summary: 'Get a specific membership',
    request: {
      params: eventUserParamSchema,
    },
    responses: {
      200: {
        description: 'The requested membership',
        content: {
          'application/json': {
            schema: eventUserSchema,
          },
        },
      },
      404: {
        description: 'Membership not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { eventId, userId } = c.req.valid('param');
    const [membership] = await c.var.db
      .select()
      .from(eventUsers)
      .where(and(eq(eventUsers.eventId, eventId), eq(eventUsers.userId, userId)));

    if (!membership) {
      return c.json({ message: 'Membership not found' }, 404);
    }

    return c.json(membership, 200);
  }
);

eventUserRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Event Memberships'],
    summary: 'Add a user to an event',
    request: {
      body: {
        content: {
          'application/json': {
            schema: createEventUserSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: 'Membership created',
        content: {
          'application/json': {
            schema: eventUserSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid('json');

    const [createdMembership] = await c.var.db
      .insert(eventUsers)
      .values({
        ...body,
        role: body.role ?? 'editor',
      })
      .returning();

    return c.json(createdMembership, 201);
  }
);

eventUserRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/:eventId/:userId',
    tags: ['Event Memberships'],
    summary: 'Update a membership role',
    request: {
      params: eventUserParamSchema,
      body: {
        content: {
          'application/json': {
            schema: updateEventUserSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Updated membership',
        content: {
          'application/json': {
            schema: eventUserSchema,
          },
        },
      },
      404: {
        description: 'Membership not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { eventId, userId } = c.req.valid('param');
    const body = c.req.valid('json');

    const [updatedMembership] = await c.var.db
      .update(eventUsers)
      .set({ role: body.role, updatedAt: new Date().toISOString() })
      .where(and(eq(eventUsers.eventId, eventId), eq(eventUsers.userId, userId)))
      .returning();

    if (!updatedMembership) {
      return c.json({ message: 'Membership not found' }, 404);
    }

    return c.json(updatedMembership, 200);
  }
);

eventUserRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/:eventId/:userId',
    tags: ['Event Memberships'],
    summary: 'Remove a user from an event',
    request: {
      params: eventUserParamSchema,
    },
    responses: {
      200: {
        description: 'Deleted membership',
        content: {
          'application/json': {
            schema: eventUserSchema,
          },
        },
      },
      404: {
        description: 'Membership not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { eventId, userId } = c.req.valid('param');

    const [deletedMembership] = await c.var.db
      .delete(eventUsers)
      .where(and(eq(eventUsers.eventId, eventId), eq(eventUsers.userId, userId)))
      .returning();

    if (!deletedMembership) {
      return c.json({ message: 'Membership not found' }, 404);
    }

    return c.json(deletedMembership, 200);
  }
);
