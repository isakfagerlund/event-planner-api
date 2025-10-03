import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

import { shoppingListItems } from '../../drizzle/schema';
import { errorSchema, timestampExample } from './schemas/common';
import type { AppEnv } from '../env';

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
    quantity: z
      .number()
      .int()
      .positive()
      .optional()
      .openapi({ example: 5 }),
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
    quantity: z
      .number()
      .int()
      .positive()
      .optional()
      .openapi({ example: 3 }),
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

export const shoppingListItemRoutes = new OpenAPIHono<AppEnv>();

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
            schema: z.array(shoppingListItemSchema).openapi('ShoppingListItemCollection'),
          },
        },
      },
    },
  }),
  async (c) => {
    const items = await c.var.db.select().from(shoppingListItems);
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
    const [item] = await c.var.db
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

    const [createdItem] = await c.var.db
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

    const [updatedItem] = await c.var.db
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

    const [deletedItem] = await c.var.db
      .delete(shoppingListItems)
      .where(eq(shoppingListItems.id, itemId))
      .returning();

    if (!deletedItem) {
      return c.json({ message: 'Shopping list item not found' }, 404);
    }

    return c.json(deletedItem, 200);
  }
);
