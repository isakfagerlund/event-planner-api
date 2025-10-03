import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';

import { users } from '../../drizzle/schema';
import { errorSchema } from './schemas/common';
import type { AppEnv } from '../env';
import { userSchema } from './schemas/users';
import { hashPassword, passwordStrengthHint } from '../auth/password';
import { createId } from '../utils/id';

const createUserSchema = z
  .object({
    email: z.string().email().openapi({ example: 'new.user@example.com' }),
    displayName: z
      .string()
      .min(1)
      .optional()
      .openapi({ example: 'New User' }),
    password: z.string().min(8, passwordStrengthHint).openapi({ example: 'correct horse battery staple' }),
  })
  .openapi('CreateUserPayload');

const updateUserSchema = z
  .object({
    email: z.string().email().optional().openapi({ example: 'updated.user@example.com' }),
    displayName: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'Updated User' }),
    password: z.string().min(8, passwordStrengthHint).optional().openapi({ example: 'correct horse battery staple' }),
  })
  .openapi('UpdateUserPayload');

const userIdParamSchema = z
  .object({
    id: z.string().min(1).openapi({ example: 'usr_alice' }),
  })
  .openapi('UserIdParams');

export const userRoutes = new OpenAPIHono<AppEnv>();

userRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Users'],
    summary: 'List users',
    security: [{ bearerAuth: [] }],
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
    const allUsers = await c.var.db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);
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
    security: [{ bearerAuth: [] }],
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
    const [user] = await c.var.db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId));

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
    security: [{ bearerAuth: [] }],
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

    const [createdUser] = await c.var.db
      .insert(users)
      .values({
        id: createId('usr'),
        email: body.email.toLowerCase(),
        displayName: body.displayName ?? null,
        passwordHash: await hashPassword(body.password),
      })
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

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
    security: [{ bearerAuth: [] }],
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

    if (body.email === undefined && body.displayName === undefined && body.password === undefined) {
      return c.json({ message: 'No fields to update' }, 400);
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.email !== undefined) {
      updateData.email = body.email.toLowerCase();
    }

    if (body.displayName !== undefined) {
      updateData.displayName = body.displayName;
    }

    if (body.password !== undefined) {
      updateData.passwordHash = await hashPassword(body.password);
    }

    const [updatedUser] = await c.var.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

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
    security: [{ bearerAuth: [] }],
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

    const [deletedUser] = await c.var.db
      .delete(users)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    if (!deletedUser) {
      return c.json({ message: 'User not found' }, 404);
    }

    return c.json(deletedUser, 200);
  }
);
