import { getCookie } from 'hono/cookie';
import type { MiddlewareHandler } from 'hono';

import type { AppEnv } from '../env';
import { verifyJwt } from './jwt';
import type { AuthUser } from './types';

const extractAccessToken = (c: Parameters<MiddlewareHandler<AppEnv>>[0]) => {
  const authorization = c.req.header('authorization');
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim();
  }

  const cookieToken = getCookie(c, 'access_token');
  return cookieToken ?? null;
};

const resolveAuthUser = async (c: Parameters<MiddlewareHandler<AppEnv>>[0]): Promise<AuthUser | null> => {
  if (c.var.authUser) {
    return c.var.authUser;
  }

  const token = extractAccessToken(c);
  if (!token) {
    return null;
  }

  try {
    const payload = await verifyJwt(token, c.var.authConfig.accessTokenSecret);
    const user: AuthUser = {
      id: payload.sub,
      email: payload.email,
      displayName: payload.displayName,
    };

    c.set('authUser', user);
    return user;
  } catch (error) {
    console.warn('Failed to verify access token', error);
    return null;
  }
};

export const optionalAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  await resolveAuthUser(c);
  await next();
};

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = await resolveAuthUser(c);
  if (!user) {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  await next();
};
