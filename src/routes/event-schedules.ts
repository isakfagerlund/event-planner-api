import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

import { eventSchedules } from '../../drizzle/schema';
import { errorSchema, timestampExample } from './schemas/common';
import type { AppEnv } from '../env';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const scheduleSchema = z
  .object({
    id: z.string().openapi({ example: 'sched_launch_dayof' }),
    eventId: z.string().openapi({ example: 'evt_launch' }),
    title: z.string().openapi({ example: 'Event Day Run Sheet' }),
    notes: z
      .string()
      .nullable()
      .openapi({ example: 'Detailed plan for the launch day.' }),
    day: z
      .string()
      .regex(dateRegex)
      .nullable()
      .openapi({ example: '2024-08-15' }),
    createdAt: z.string().datetime().openapi({ example: timestampExample }),
    updatedAt: z.string().datetime().openapi({ example: timestampExample }),
  })
  .openapi('EventSchedule');

const createScheduleSchema = z
  .object({
    id: z.string().min(1).openapi({ example: 'sched_launch_dayof' }),
    eventId: z.string().openapi({ example: 'evt_launch' }),
    title: z.string().min(1).openapi({ example: 'Event Day Run Sheet' }),
    notes: z
      .string()
      .optional()
      .openapi({ example: 'Detailed plan for the launch day.' }),
    day: z
      .string()
      .regex(dateRegex)
      .optional()
      .openapi({ example: '2024-08-15' }),
  })
  .openapi('CreateEventSchedulePayload');

const updateScheduleSchema = z
  .object({
    title: z.string().min(1).optional().openapi({ example: 'Updated Run Sheet' }),
    notes: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'Updated notes' }),
    day: z
      .string()
      .regex(dateRegex)
      .nullable()
      .optional()
      .openapi({ example: '2024-08-16' }),
  })
  .openapi('UpdateEventSchedulePayload');

const scheduleIdParamSchema = z
  .object({
    id: z.string().min(1).openapi({ example: 'sched_launch_dayof' }),
  })
  .openapi('EventScheduleIdParams');

export const scheduleRoutes = new OpenAPIHono<AppEnv>();

scheduleRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Event Schedules'],
    summary: 'List event schedules',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'A list of event schedules',
        content: {
          'application/json': {
            schema: z.array(scheduleSchema).openapi('EventScheduleCollection'),
          },
        },
      },
    },
  }),
  async (c) => {
    const schedules = await c.var.db.select().from(eventSchedules);
    return c.json(schedules, 200);
  }
);

scheduleRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/:id',
    tags: ['Event Schedules'],
    summary: 'Get an event schedule',
    request: {
      params: scheduleIdParamSchema,
    },
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'The requested schedule',
        content: {
          'application/json': {
            schema: scheduleSchema,
          },
        },
      },
      404: {
        description: 'Schedule not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: scheduleId } = c.req.valid('param');
    const [schedule] = await c.var.db
      .select()
      .from(eventSchedules)
      .where(eq(eventSchedules.id, scheduleId));

    if (!schedule) {
      return c.json({ message: 'Schedule not found' }, 404);
    }

    return c.json(schedule, 200);
  }
);

scheduleRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Event Schedules'],
    summary: 'Create an event schedule',
    request: {
      body: {
        content: {
          'application/json': {
            schema: createScheduleSchema,
          },
        },
        required: true,
      },
    },
    security: [{ bearerAuth: [] }],
    responses: {
      201: {
        description: 'Schedule created',
        content: {
          'application/json': {
            schema: scheduleSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid('json');

    const [createdSchedule] = await c.var.db
      .insert(eventSchedules)
      .values({
        ...body,
        notes: body.notes ?? null,
        day: body.day ?? null,
      })
      .returning();

    return c.json(createdSchedule, 201);
  }
);

scheduleRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/:id',
    tags: ['Event Schedules'],
    summary: 'Update an event schedule',
    request: {
      params: scheduleIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: updateScheduleSchema,
          },
        },
        required: true,
      },
    },
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Updated schedule',
        content: {
          'application/json': {
            schema: scheduleSchema,
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
        description: 'Schedule not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: scheduleId } = c.req.valid('param');
    const body = c.req.valid('json');

    if (body.title === undefined && body.notes === undefined && body.day === undefined) {
      return c.json({ message: 'No fields to update' }, 400);
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.title !== undefined) {
      updateData.title = body.title;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (body.day !== undefined) {
      updateData.day = body.day;
    }

    const [updatedSchedule] = await c.var.db
      .update(eventSchedules)
      .set(updateData)
      .where(eq(eventSchedules.id, scheduleId))
      .returning();

    if (!updatedSchedule) {
      return c.json({ message: 'Schedule not found' }, 404);
    }

    return c.json(updatedSchedule, 200);
  }
);

scheduleRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/:id',
    tags: ['Event Schedules'],
    summary: 'Delete an event schedule',
    request: {
      params: scheduleIdParamSchema,
    },
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Deleted schedule',
        content: {
          'application/json': {
            schema: scheduleSchema,
          },
        },
      },
      404: {
        description: 'Schedule not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: scheduleId } = c.req.valid('param');

    const [deletedSchedule] = await c.var.db
      .delete(eventSchedules)
      .where(eq(eventSchedules.id, scheduleId))
      .returning();

    if (!deletedSchedule) {
      return c.json({ message: 'Schedule not found' }, 404);
    }

    return c.json(deletedSchedule, 200);
  }
);
