import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

import {
  eventScheduleSlots,
  eventSchedules,
  eventUsers,
  events,
  shoppingListItems,
  shoppingLists,
  users,
} from '../drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

const app = new OpenAPIHono();
const eventRoutes = new OpenAPIHono();
const userRoutes = new OpenAPIHono();
const eventUserRoutes = new OpenAPIHono();
const shoppingListRoutes = new OpenAPIHono();
const shoppingListItemRoutes = new OpenAPIHono();
const scheduleRoutes = new OpenAPIHono();
const scheduleSlotRoutes = new OpenAPIHono();

const timestampExample = '2024-07-01T12:00:00.000Z';

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
    createdAt: z.string().datetime().openapi({ example: timestampExample }),
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

const errorSchema = z
  .object({
    message: z.string().openapi({ example: 'Event not found' }),
  })
  .openapi('ErrorResponse');

const userSchema = z
  .object({
    id: z.string().openapi({ example: 'usr_alice' }),
    email: z.string().email().openapi({ example: 'alice@example.com' }),
    displayName: z.string().nullable().openapi({ example: 'Alice Organizer' }),
    createdAt: z.string().datetime().openapi({ example: timestampExample }),
    updatedAt: z.string().datetime().openapi({ example: timestampExample }),
  })
  .openapi('User');

const createUserSchema = z
  .object({
    id: z.string().min(1).openapi({ example: 'usr_new' }),
    email: z.string().email().openapi({ example: 'new.user@example.com' }),
    displayName: z.string().min(1).optional().openapi({ example: 'New User' }),
  })
  .openapi('CreateUserPayload');

const updateUserSchema = z
  .object({
    email: z
      .string()
      .email()
      .optional()
      .openapi({ example: 'updated.user@example.com' }),
    displayName: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'Updated User' }),
  })
  .openapi('UpdateUserPayload');

const userIdParamSchema = z
  .object({
    id: z.string().min(1).openapi({ example: 'usr_alice' }),
  })
  .openapi('UserIdParams');

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

const shoppingListSchema = z
  .object({
    id: z.string().openapi({ example: 'slist_launch' }),
    eventId: z.string().openapi({ example: 'evt_launch' }),
    title: z.string().openapi({ example: 'Catering Supplies' }),
    notes: z
      .string()
      .nullable()
      .openapi({ example: 'Confirm dietary requirements' }),
    createdAt: z.string().datetime().openapi({ example: timestampExample }),
    updatedAt: z.string().datetime().openapi({ example: timestampExample }),
  })
  .openapi('ShoppingList');

const createShoppingListSchema = z
  .object({
    id: z.string().min(1).openapi({ example: 'slist_launch' }),
    eventId: z.string().openapi({ example: 'evt_launch' }),
    title: z.string().min(1).openapi({ example: 'Catering Supplies' }),
    notes: z
      .string()
      .optional()
      .openapi({ example: 'Confirm dietary requirements' }),
  })
  .openapi('CreateShoppingListPayload');

const updateShoppingListSchema = z
  .object({
    title: z.string().min(1).optional().openapi({ example: 'Updated Title' }),
    notes: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'Updated note' }),
  })
  .openapi('UpdateShoppingListPayload');

const shoppingListIdParamSchema = z
  .object({
    id: z.string().min(1).openapi({ example: 'slist_launch' }),
  })
  .openapi('ShoppingListIdParams');

const itemStatusEnum = z.enum(['pending', 'in-progress', 'completed']);

const shoppingListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'sitem_drinks' }),
    listId: z.string().openapi({ example: 'slist_launch' }),
    name: z.string().openapi({ example: 'Beverage Selection' }),
    quantity: z.number().openapi({ example: 5 }),
    status: z
      .string()
      .openapi({ example: 'in-progress', enum: itemStatusEnum.options })
      .describe('Current status of the item'),
    neededBy: z
      .string()
      .datetime()
      .nullable()
      .openapi({ example: '2024-08-15T12:00:00.000Z' }),
    createdAt: z.string().datetime().openapi({ example: timestampExample }),
    updatedAt: z.string().datetime().openapi({ example: timestampExample }),
  })
  .openapi('ShoppingListItem');

const createShoppingListItemSchema = z
  .object({
    id: z.string().min(1).openapi({ example: 'sitem_drinks' }),
    listId: z.string().openapi({ example: 'slist_launch' }),
    name: z.string().min(1).openapi({ example: 'Beverage Selection' }),
    quantity: z.number().int().positive().optional().openapi({ example: 5 }),
    status: itemStatusEnum.optional().openapi({ example: 'pending' }),
    neededBy: z
      .string()
      .datetime()
      .optional()
      .openapi({ example: '2024-08-15T12:00:00.000Z' }),
  })
  .openapi('CreateShoppingListItemPayload');

const updateShoppingListItemSchema = z
  .object({
    name: z.string().min(1).optional().openapi({ example: 'Updated Item' }),
    quantity: z.number().int().positive().optional().openapi({ example: 3 }),
    status: itemStatusEnum.optional().openapi({ example: 'completed' }),
    neededBy: z
      .string()
      .datetime()
      .nullable()
      .optional()
      .openapi({ example: '2024-08-16T10:00:00.000Z' }),
  })
  .openapi('UpdateShoppingListItemPayload');

const shoppingListItemIdParamSchema = z
  .object({
    id: z.string().min(1).openapi({ example: 'sitem_drinks' }),
  })
  .openapi('ShoppingListItemIdParams');

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
    title: z
      .string()
      .min(1)
      .optional()
      .openapi({ example: 'Updated Run Sheet' }),
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

const scheduleSlotSchema = z
  .object({
    id: z.string().openapi({ example: 'slot_launch_setup' }),
    scheduleId: z.string().openapi({ example: 'sched_launch_dayof' }),
    label: z.string().openapi({ example: 'Venue Setup' }),
    startsAt: z
      .string()
      .datetime()
      .openapi({ example: '2024-08-15T15:00:00.000Z' }),
    endsAt: z
      .string()
      .datetime()
      .nullable()
      .openapi({ example: '2024-08-15T17:00:00.000Z' }),
    ownerUserId: z.string().nullable().openapi({ example: 'usr_alice' }),
    location: z.string().nullable().openapi({ example: 'Main Hall' }),
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
    startsAt: z
      .string()
      .datetime()
      .openapi({ example: '2024-08-15T15:00:00.000Z' }),
    endsAt: z
      .string()
      .datetime()
      .optional()
      .openapi({ example: '2024-08-15T17:00:00.000Z' }),
    ownerUserId: z.string().optional().openapi({ example: 'usr_alice' }),
    location: z.string().optional().openapi({ example: 'Main Hall' }),
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

app.use('*', cors());

app.get('/', (c) => c.text('You just performed a GET request! 🎉'));

eventRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Events'],
    summary: 'List events',
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
    const allEvents = await db.select().from(events);
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
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

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

    const [createdEvent] = await db.insert(events).values(body).returning();

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

    const [updatedEvent] = await db
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

    const [deletedEvent] = await db
      .delete(events)
      .where(eq(events.id, eventId))
      .returning();

    if (!deletedEvent) {
      return c.json({ message: 'Event not found' }, 404);
    }

    return c.json(deletedEvent, 200);
  }
);

userRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Users'],
    summary: 'List users',
    responses: {
      200: {
        description: 'A list of users',
        content: {
          'application/json': {
            schema: z.array(userSchema).openapi('UserList'),
          },
        },
      },
    },
  }),
  async (c) => {
    const allUsers = await db.select().from(users);
    return c.json(allUsers, 200);
  }
);

userRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/:id',
    tags: ['Users'],
    summary: 'Get a user',
    request: {
      params: userIdParamSchema,
    },
    responses: {
      200: {
        description: 'The requested user',
        content: {
          'application/json': {
            schema: userSchema,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: userId } = c.req.valid('param');
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return c.json({ message: 'User not found' }, 404);
    }

    return c.json(user, 200);
  }
);

userRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Users'],
    summary: 'Create a user',
    request: {
      body: {
        content: {
          'application/json': {
            schema: createUserSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: 'User created',
        content: {
          'application/json': {
            schema: userSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid('json');

    const [createdUser] = await db
      .insert(users)
      .values({
        ...body,
        displayName: body.displayName ?? null,
      })
      .returning();

    return c.json(createdUser, 201);
  }
);

userRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/:id',
    tags: ['Users'],
    summary: 'Update a user',
    request: {
      params: userIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: updateUserSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Updated user',
        content: {
          'application/json': {
            schema: userSchema,
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
        description: 'User not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: userId } = c.req.valid('param');
    const body = c.req.valid('json');

    if (body.email === undefined && body.displayName === undefined) {
      return c.json({ message: 'No fields to update' }, 400);
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.email !== undefined) {
      updateData.email = body.email;
    }

    if (body.displayName !== undefined) {
      updateData.displayName = body.displayName;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return c.json({ message: 'User not found' }, 404);
    }

    return c.json(updatedUser, 200);
  }
);

userRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/:id',
    tags: ['Users'],
    summary: 'Delete a user',
    request: {
      params: userIdParamSchema,
    },
    responses: {
      200: {
        description: 'Deleted user',
        content: {
          'application/json': {
            schema: userSchema,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: userId } = c.req.valid('param');

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();

    if (!deletedUser) {
      return c.json({ message: 'User not found' }, 404);
    }

    return c.json(deletedUser, 200);
  }
);

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
    const memberships = await db.select().from(eventUsers);
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
    const [membership] = await db
      .select()
      .from(eventUsers)
      .where(
        and(eq(eventUsers.eventId, eventId), eq(eventUsers.userId, userId))
      );

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

    const [createdMembership] = await db
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

    const [updatedMembership] = await db
      .update(eventUsers)
      .set({ role: body.role, updatedAt: new Date().toISOString() })
      .where(
        and(eq(eventUsers.eventId, eventId), eq(eventUsers.userId, userId))
      )
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

    const [deletedMembership] = await db
      .delete(eventUsers)
      .where(
        and(eq(eventUsers.eventId, eventId), eq(eventUsers.userId, userId))
      )
      .returning();

    if (!deletedMembership) {
      return c.json({ message: 'Membership not found' }, 404);
    }

    return c.json(deletedMembership, 200);
  }
);

shoppingListRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Shopping Lists'],
    summary: 'List shopping lists',
    responses: {
      200: {
        description: 'A list of shopping lists',
        content: {
          'application/json': {
            schema: z
              .array(shoppingListSchema)
              .openapi('ShoppingListCollection'),
          },
        },
      },
    },
  }),
  async (c) => {
    const lists = await db.select().from(shoppingLists);
    return c.json(lists, 200);
  }
);

shoppingListRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/:id',
    tags: ['Shopping Lists'],
    summary: 'Get a shopping list',
    request: {
      params: shoppingListIdParamSchema,
    },
    responses: {
      200: {
        description: 'The requested shopping list',
        content: {
          'application/json': {
            schema: shoppingListSchema,
          },
        },
      },
      404: {
        description: 'Shopping list not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: listId } = c.req.valid('param');
    const [list] = await db
      .select()
      .from(shoppingLists)
      .where(eq(shoppingLists.id, listId));

    if (!list) {
      return c.json({ message: 'Shopping list not found' }, 404);
    }

    return c.json(list, 200);
  }
);

shoppingListRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Shopping Lists'],
    summary: 'Create a shopping list',
    request: {
      body: {
        content: {
          'application/json': {
            schema: createShoppingListSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: 'Shopping list created',
        content: {
          'application/json': {
            schema: shoppingListSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid('json');

    const [createdList] = await db
      .insert(shoppingLists)
      .values({
        ...body,
        notes: body.notes ?? null,
      })
      .returning();

    return c.json(createdList, 201);
  }
);

shoppingListRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/:id',
    tags: ['Shopping Lists'],
    summary: 'Update a shopping list',
    request: {
      params: shoppingListIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: updateShoppingListSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Updated shopping list',
        content: {
          'application/json': {
            schema: shoppingListSchema,
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
        description: 'Shopping list not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: listId } = c.req.valid('param');
    const body = c.req.valid('json');

    if (body.title === undefined && body.notes === undefined) {
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

    const [updatedList] = await db
      .update(shoppingLists)
      .set(updateData)
      .where(eq(shoppingLists.id, listId))
      .returning();

    if (!updatedList) {
      return c.json({ message: 'Shopping list not found' }, 404);
    }

    return c.json(updatedList, 200);
  }
);

shoppingListRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/:id',
    tags: ['Shopping Lists'],
    summary: 'Delete a shopping list',
    request: {
      params: shoppingListIdParamSchema,
    },
    responses: {
      200: {
        description: 'Deleted shopping list',
        content: {
          'application/json': {
            schema: shoppingListSchema,
          },
        },
      },
      404: {
        description: 'Shopping list not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: listId } = c.req.valid('param');

    const [deletedList] = await db
      .delete(shoppingLists)
      .where(eq(shoppingLists.id, listId))
      .returning();

    if (!deletedList) {
      return c.json({ message: 'Shopping list not found' }, 404);
    }

    return c.json(deletedList, 200);
  }
);

shoppingListItemRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Shopping List Items'],
    summary: 'List shopping list items',
    responses: {
      200: {
        description: 'A list of shopping list items',
        content: {
          'application/json': {
            schema: z
              .array(shoppingListItemSchema)
              .openapi('ShoppingListItemCollection'),
          },
        },
      },
    },
  }),
  async (c) => {
    const items = await db.select().from(shoppingListItems);
    return c.json(items, 200);
  }
);

shoppingListItemRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/:id',
    tags: ['Shopping List Items'],
    summary: 'Get a shopping list item',
    request: {
      params: shoppingListItemIdParamSchema,
    },
    responses: {
      200: {
        description: 'The requested shopping list item',
        content: {
          'application/json': {
            schema: shoppingListItemSchema,
          },
        },
      },
      404: {
        description: 'Shopping list item not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: itemId } = c.req.valid('param');
    const [item] = await db
      .select()
      .from(shoppingListItems)
      .where(eq(shoppingListItems.id, itemId));

    if (!item) {
      return c.json({ message: 'Shopping list item not found' }, 404);
    }

    return c.json(item, 200);
  }
);

shoppingListItemRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Shopping List Items'],
    summary: 'Create a shopping list item',
    request: {
      body: {
        content: {
          'application/json': {
            schema: createShoppingListItemSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: 'Shopping list item created',
        content: {
          'application/json': {
            schema: shoppingListItemSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid('json');

    const [createdItem] = await db
      .insert(shoppingListItems)
      .values({
        ...body,
        quantity: body.quantity ?? 1,
        status: body.status ?? 'pending',
        neededBy: body.neededBy ?? null,
      })
      .returning();

    return c.json(createdItem, 201);
  }
);

shoppingListItemRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/:id',
    tags: ['Shopping List Items'],
    summary: 'Update a shopping list item',
    request: {
      params: shoppingListItemIdParamSchema,
      body: {
        content: {
          'application/json': {
            schema: updateShoppingListItemSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Updated shopping list item',
        content: {
          'application/json': {
            schema: shoppingListItemSchema,
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
        description: 'Shopping list item not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: itemId } = c.req.valid('param');
    const body = c.req.valid('json');

    if (
      body.name === undefined &&
      body.quantity === undefined &&
      body.status === undefined &&
      body.neededBy === undefined
    ) {
      return c.json({ message: 'No fields to update' }, 400);
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    if (body.quantity !== undefined) {
      updateData.quantity = body.quantity;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.neededBy !== undefined) {
      updateData.neededBy = body.neededBy;
    }

    const [updatedItem] = await db
      .update(shoppingListItems)
      .set(updateData)
      .where(eq(shoppingListItems.id, itemId))
      .returning();

    if (!updatedItem) {
      return c.json({ message: 'Shopping list item not found' }, 404);
    }

    return c.json(updatedItem, 200);
  }
);

shoppingListItemRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/:id',
    tags: ['Shopping List Items'],
    summary: 'Delete a shopping list item',
    request: {
      params: shoppingListItemIdParamSchema,
    },
    responses: {
      200: {
        description: 'Deleted shopping list item',
        content: {
          'application/json': {
            schema: shoppingListItemSchema,
          },
        },
      },
      404: {
        description: 'Shopping list item not found',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id: itemId } = c.req.valid('param');

    const [deletedItem] = await db
      .delete(shoppingListItems)
      .where(eq(shoppingListItems.id, itemId))
      .returning();

    if (!deletedItem) {
      return c.json({ message: 'Shopping list item not found' }, 404);
    }

    return c.json(deletedItem, 200);
  }
);

scheduleRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Event Schedules'],
    summary: 'List event schedules',
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
    const schedules = await db.select().from(eventSchedules);
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
    const [schedule] = await db
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

    const [createdSchedule] = await db
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

    if (
      body.title === undefined &&
      body.notes === undefined &&
      body.day === undefined
    ) {
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

    const [updatedSchedule] = await db
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

    const [deletedSchedule] = await db
      .delete(eventSchedules)
      .where(eq(eventSchedules.id, scheduleId))
      .returning();

    if (!deletedSchedule) {
      return c.json({ message: 'Schedule not found' }, 404);
    }

    return c.json(deletedSchedule, 200);
  }
);

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
            schema: z
              .array(scheduleSlotSchema)
              .openapi('EventScheduleSlotCollection'),
          },
        },
      },
    },
  }),
  async (c) => {
    const slots = await db.select().from(eventScheduleSlots);
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
    const [slot] = await db
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

    const [createdSlot] = await db
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

    const [updatedSlot] = await db
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

    const [deletedSlot] = await db
      .delete(eventScheduleSlots)
      .where(eq(eventScheduleSlots.id, slotId))
      .returning();

    if (!deletedSlot) {
      return c.json({ message: 'Slot not found' }, 404);
    }

    return c.json(deletedSlot, 200);
  }
);

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
