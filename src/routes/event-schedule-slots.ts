import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

import { eventScheduleSlots } from '../../drizzle/schema';
import { errorSchema, timestampExample } from './schemas/common';
import type { AppEnv } from '../env';

const scheduleSlotSchema = z
  .object({
    id: z.string().openapi({ example: 'slot_launch_setup' }),
    scheduleId: z.string().openapi({ example: 'sched_launch_dayof' }),
    label: z.string().openapi({ example: 'Venue Setup' }),
    startsAt: z.string().datetime().openapi({ example: '2024-08-15T15:00:00.000Z' }),
    endsAt: z
      .string()
      .datetime()
      .nullable()
      .openapi({ example: '2024-08-15T17:00:00.000Z' }),
    ownerUserId: z
      .string()
      .nullable()
      .openapi({ example: 'usr_alice' }),
    location: z
      .string()
      .nullable()
      .openapi({ example: 'Main Hall' }),
    notes: z
      .string()
      .nullable()
      .openapi({ example: 'Coordinate with AV team.' }),
    createdAt: z.string().datetime().openapi({ example: timestampExample }),
    updatedAt: z.string().datetime().openapi({ example: timestampExample }),
  })
  .openapi('EventScheduleSlot');

const createScheduleSlotSchema = z
  .object({
    id: z.string().min(1).openapi({ example: 'slot_launch_setup' }),
    scheduleId: z.string().openapi({ example: 'sched_launch_dayof' }),
    label: z.string().min(1).openapi({ example: 'Venue Setup' }),
    startsAt: z.string().datetime().openapi({ example: '2024-08-15T15:00:00.000Z' }),
    endsAt: z
      .string()
      .datetime()
      .optional()
      .openapi({ example: '2024-08-15T17:00:00.000Z' }),
    ownerUserId: z
      .string()
      .optional()
      .openapi({ example: 'usr_alice' }),
    location: z
      .string()
      .optional()
      .openapi({ example: 'Main Hall' }),
    notes: z
      .string()
      .optional()
      .openapi({ example: 'Coordinate with AV team.' }),
  })
  .openapi('CreateEventScheduleSlotPayload');

const updateScheduleSlotSchema = z
  .object({
    label: z.string().min(1).optional().openapi({ example: 'Revised Setup' }),
    startsAt: z
      .string()
      .datetime()
      .optional()
      .openapi({ example: '2024-08-15T16:00:00.000Z' }),
    endsAt: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .openapi({ example: '2024-08-15T18:00:00.000Z' }),
    ownerUserId: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'usr_bob' }),
    location: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'Auditorium Stage' }),
    notes: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'Updated note' }),
  })
  .openapi('UpdateEventScheduleSlotPayload');

const scheduleSlotIdParamSchema = z
  .object({
    id: z.string().min(1).openapi({ example: 'slot_launch_setup' }),
  })
  .openapi('EventScheduleSlotIdParams');

export const scheduleSlotRoutes = new OpenAPIHono<AppEnv>();

scheduleSlotRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Event Schedule Slots'],
    summary: 'List schedule slots',
    responses: {
      200: {
        description: 'A list of schedule slots',
        content: {
          'application/json': {
            schema: z.array(scheduleSlotSchema).openapi('EventScheduleSlotCollection'),
          },
        },
      },
    },
  }),
  async (c) => {
    const slots = await c.var.db.select().from(eventScheduleSlots);
    return c.json(slots, 200);
  }
);

scheduleSlotRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/:id',
    tags: ['Event Schedule Slots'],
    summary: 'Get a schedule slot',
    request: {
      params: scheduleSlotIdParamSchema,
    },
    responses: {
      200: {
        description: 'The requested slot',
        content: {
          'application/json': {
            schema: scheduleSlotSchema,
          },
        },
      },
      404: {
        description: 'Slot not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: slotId } = c.req.valid('param');
    const [slot] = await c.var.db
      .select()
      .from(eventScheduleSlots)
      .where(eq(eventScheduleSlots.id, slotId));

    if (!slot) {
      return c.json({ message: 'Slot not found' }, 404);
    }

    return c.json(slot, 200);
  }
);

scheduleSlotRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Event Schedule Slots'],
    summary: 'Create a schedule slot',
    request: {
      body: {
        content: {
          'application/json': {
            schema: createScheduleSlotSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: 'Slot created',
        content: {
          'application/json': {
            schema: scheduleSlotSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid('json');

    const [createdSlot] = await c.var.db
      .insert(eventScheduleSlots)
      .values({
        ...body,
        endsAt: body.endsAt ?? null,
        ownerUserId: body.ownerUserId ?? null,
        location: body.location ?? null,
        notes: body.notes ?? null,
      })
      .returning();

    return c.json(createdSlot, 201);
  }
);

scheduleSlotRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/:id',
    tags: ['Event Schedule Slots'],
    summary: 'Update a schedule slot',
    request: {
      params: scheduleSlotIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: updateScheduleSlotSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Updated slot',
        content: {
          'application/json': {
            schema: scheduleSlotSchema,
          },
        },
      },
      400: {
        description: 'Invalid payload',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
      404: {
        description: 'Slot not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: slotId } = c.req.valid('param');
    const body = c.req.valid('json');

    if (
      body.label === undefined &&
      body.startsAt === undefined &&
      body.endsAt === undefined &&
      body.ownerUserId === undefined &&
      body.location === undefined &&
      body.notes === undefined
    ) {
      return c.json({ message: 'No fields to update' }, 400);
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.label !== undefined) {
      updateData.label = body.label;
    }

    if (body.startsAt !== undefined) {
      updateData.startsAt = body.startsAt;
    }

    if (body.endsAt !== undefined) {
      updateData.endsAt = body.endsAt;
    }

    if (body.ownerUserId !== undefined) {
      updateData.ownerUserId = body.ownerUserId;
    }

    if (body.location !== undefined) {
      updateData.location = body.location;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    const [updatedSlot] = await c.var.db
      .update(eventScheduleSlots)
      .set(updateData)
      .where(eq(eventScheduleSlots.id, slotId))
      .returning();

    if (!updatedSlot) {
      return c.json({ message: 'Slot not found' }, 404);
    }

    return c.json(updatedSlot, 200);
  }
);

scheduleSlotRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/:id',
    tags: ['Event Schedule Slots'],
    summary: 'Delete a schedule slot',
    request: {
      params: scheduleSlotIdParamSchema,
    },
    responses: {
      200: {
        description: 'Deleted slot',
        content: {
          'application/json': {
            schema: scheduleSlotSchema,
          },
        },
      },
      404: {
        description: 'Slot not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: slotId } = c.req.valid('param');

    const [deletedSlot] = await c.var.db
      .delete(eventScheduleSlots)
      .where(eq(eventScheduleSlots.id, slotId))
      .returning();

    if (!deletedSlot) {
      return c.json({ message: 'Slot not found' }, 404);
    }

    return c.json(deletedSlot, 200);
  }
);
