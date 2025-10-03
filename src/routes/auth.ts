import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Context } from 'hono';

import { users, userRefreshTokens } from '../../drizzle/schema';
import { errorSchema } from './schemas/common';
import type { AppEnv } from '../env';
import { userSchema } from './schemas/users';
import { hashPassword, passwordStrengthHint, verifyPassword, upgradePasswordHashIfNeeded } from '../auth/password';
import { signJwt } from '../auth/jwt';
import { createRefreshToken, hashRefreshToken } from '../auth/refresh-token';
import { createId } from '../utils/id';

const authRoutes = new OpenAPIHono<AppEnv>();

const credentialsSchema = z
  .object({
    email: z.string().email().openapi({ example: 'user@example.com' }),
    password: z
      .string()
      .min(8, passwordStrengthHint)
      .openapi({ example: 'correct horse battery staple' }),
  })
  .openapi('CredentialsPayload');

const registerSchema = credentialsSchema
  .extend({
    displayName: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .openapi({ example: 'Pat Organizer' }),
  })
  .openapi('RegisterPayload');

const refreshSchema = z
  .object({
    refreshToken: z.string().optional().openapi({ example: 'refresh-token-value' }),
  })
  .default({})
  .openapi('RefreshPayload');

const authTokensSchema = z
  .object({
    accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
    refreshToken: z.string().openapi({ example: 'refresh-token-value' }),
    accessTokenExpiresAt: z
      .string()
      .datetime()
      .openapi({ example: '2024-08-01T12:30:00.000Z' }),
    refreshTokenExpiresAt: z
      .string()
      .datetime()
      .openapi({ example: '2024-09-01T12:30:00.000Z' }),
  })
  .openapi('AuthTokens');

const authResponseSchema = z
  .object({
    user: userSchema,
    tokens: authTokensSchema,
  })
  .openapi('AuthResponse');

const applyAuthCookies = (c: Context<AppEnv>, tokens: z.infer<typeof authTokensSchema>) => {
  const accessMaxAge = Math.max(
    0,
    Math.floor((new Date(tokens.accessTokenExpiresAt).getTime() - Date.now()) / 1000)
  );
  const refreshMaxAge = Math.max(
    0,
    Math.floor((new Date(tokens.refreshTokenExpiresAt).getTime() - Date.now()) / 1000)
  );

  setCookie(c, 'access_token', tokens.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: accessMaxAge,
  });

  setCookie(c, 'refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: refreshMaxAge,
  });
};

const revokeRefreshToken = async (c: Context<AppEnv>, tokenId: string) => {
  await c.var.db
    .update(userRefreshTokens)
    .set({
      revokedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    })
    .where(eq(userRefreshTokens.id, tokenId));
};

const buildAuthTokens = async (
  c: Context<AppEnv>,
  user: { id: string; email: string; displayName: string | null }
) => {
  const { authConfig, db } = c.var;
  const { token: accessToken, payload } = await signJwt(
    {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    },
    authConfig.accessTokenSecret,
    authConfig.accessTokenTtlSeconds
  );

  const { token: refreshToken, hashedToken, expiresAt: refreshExpiresAt } = await createRefreshToken(
    authConfig.refreshTokenTtlSeconds
  );

  const refreshTokenId = createId('urt');
  await db.insert(userRefreshTokens).values({
    id: refreshTokenId,
    userId: user.id,
    tokenHash: hashedToken,
    expiresAt: refreshExpiresAt.toISOString(),
  });

  const tokens = {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: new Date(payload.exp * 1000).toISOString(),
    refreshTokenExpiresAt: refreshExpiresAt.toISOString(),
  } as const;

  applyAuthCookies(c, tokens);
  c.set('authUser', user);

  return tokens;
};

authRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/register',
    tags: ['Auth'],
    summary: 'Register a new user',
    request: {
      body: {
        content: {
          'application/json': {
            schema: registerSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: 'User registered successfully',
        content: {
          'application/json': {
            schema: authResponseSchema,
          },
        },
      },
      409: {
        description: 'Email already in use',
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
    const email = body.email.toLowerCase();

    const existing = await c.var.db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return c.json({ message: 'Email already registered' }, 409);
    }

    const passwordHash = await hashPassword(body.password);

    const [user] = await c.var.db
      .insert(users)
      .values({
        id: createId('usr'),
        email,
        displayName: body.displayName ?? null,
        passwordHash,
      })
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    const tokens = await buildAuthTokens(c, user);

    return c.json({ user, tokens }, 201);
  }
);

authRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/login',
    tags: ['Auth'],
    summary: 'Authenticate with email and password',
    request: {
      body: {
        content: {
          'application/json': {
            schema: credentialsSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Authenticated successfully',
        content: {
          'application/json': {
            schema: authResponseSchema,
          },
        },
      },
      401: {
        description: 'Invalid credentials',
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
    const email = body.email.toLowerCase();

    const [user] = await c.var.db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        passwordHash: users.passwordHash,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.email, email));

    if (!user) {
      return c.json({ message: 'Invalid email or password' }, 401);
    }

    const isValid = await verifyPassword(body.password, user.passwordHash);
    if (!isValid) {
      return c.json({ message: 'Invalid email or password' }, 401);
    }

    const upgradedHash = await upgradePasswordHashIfNeeded(body.password, user.passwordHash);
    if (upgradedHash !== user.passwordHash) {
      await c.var.db
        .update(users)
        .set({ passwordHash: upgradedHash, updatedAt: new Date().toISOString() })
        .where(eq(users.id, user.id));
    }

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const tokens = await buildAuthTokens(c, sanitizedUser);

    return c.json({ user: sanitizedUser, tokens }, 200);
  }
);

authRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/refresh',
    tags: ['Auth'],
    summary: 'Rotate refresh token and issue a new access token',
    request: {
      body: {
        content: {
          'application/json': {
            schema: refreshSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Tokens refreshed',
        content: {
          'application/json': {
            schema: authResponseSchema,
          },
        },
      },
      401: {
        description: 'Refresh token is invalid',
        content: {
          'application/json': {
            schema: errorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    let body: z.infer<typeof refreshSchema>;
    try {
      body = c.req.valid('json');
    } catch {
      body = {};
    }
    const providedToken = body.refreshToken ?? getCookie(c, 'refresh_token');

    if (!providedToken) {
      return c.json({ message: 'Refresh token is required' }, 401);
    }

    const hashedToken = await hashRefreshToken(providedToken);

    const [storedToken] = await c.var.db
      .select({
        id: userRefreshTokens.id,
        userId: userRefreshTokens.userId,
        tokenHash: userRefreshTokens.tokenHash,
        expiresAt: userRefreshTokens.expiresAt,
        revokedAt: userRefreshTokens.revokedAt,
      })
      .from(userRefreshTokens)
      .where(eq(userRefreshTokens.tokenHash, hashedToken));

    if (!storedToken || storedToken.revokedAt) {
      return c.json({ message: 'Refresh token is invalid' }, 401);
    }

    if (new Date(storedToken.expiresAt) <= new Date()) {
      await revokeRefreshToken(c, storedToken.id);
      return c.json({ message: 'Refresh token expired' }, 401);
    }

    const [user] = await c.var.db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, storedToken.userId));

    if (!user) {
      await revokeRefreshToken(c, storedToken.id);
      return c.json({ message: 'User not found' }, 401);
    }

    await revokeRefreshToken(c, storedToken.id);

    const tokens = await buildAuthTokens(c, user);

    return c.json({ user, tokens }, 200);
  }
);

authRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/logout',
    tags: ['Auth'],
    summary: 'Revoke refresh token and clear auth cookies',
    request: {
      body: {
        content: {
          'application/json': {
            schema: refreshSchema,
          },
        },
      },
    },
    responses: {
      204: {
        description: 'Successfully logged out',
      },
    },
  }),
  async (c) => {
    let body: z.infer<typeof refreshSchema>;
    try {
      body = c.req.valid('json');
    } catch {
      body = {};
    }
    const providedToken = body.refreshToken ?? getCookie(c, 'refresh_token');

    if (providedToken) {
      const hashedToken = await hashRefreshToken(providedToken);
      const [storedToken] = await c.var.db
        .select({ id: userRefreshTokens.id })
        .from(userRefreshTokens)
        .where(eq(userRefreshTokens.tokenHash, hashedToken));

      if (storedToken) {
        await revokeRefreshToken(c, storedToken.id);
      }
    }

    deleteCookie(c, 'access_token', { path: '/', secure: true, sameSite: 'Strict' });
    deleteCookie(c, 'refresh_token', { path: '/', secure: true, sameSite: 'Strict' });

    return c.body(null, 204);
  }
);

export { authRoutes };
