import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

import { shoppingLists } from '../../drizzle/schema';
import { errorSchema, timestampExample } from './schemas/common';
import type { AppEnv } from '../env';

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

export const shoppingListRoutes = new OpenAPIHono<AppEnv>();

shoppingListRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Shopping Lists'],
    summary: 'List shopping lists',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'A list of shopping lists',
        content: {
          'application/json': {
            schema: z.array(shoppingListSchema).openapi('ShoppingListCollection'),
          },
        },
      },
    },
  }),
  async (c) => {
    const lists = await c.var.db.select().from(shoppingLists);
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
    security: [{ bearerAuth: [] }],
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
    const [list] = await c.var.db.select().from(shoppingLists).where(eq(shoppingLists.id, listId));

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
    security: [{ bearerAuth: [] }],
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

    const [createdList] = await c.var.db
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
    security: [{ bearerAuth: [] }],
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

    const [updatedList] = await c.var.db
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
    security: [{ bearerAuth: [] }],
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

    const [deletedList] = await c.var.db
      .delete(shoppingLists)
      .where(eq(shoppingLists.id, listId))
      .returning();

    if (!deletedList) {
      return c.json({ message: 'Shopping list not found' }, 404);
    }

    return c.json(deletedList, 200);
  }
);
