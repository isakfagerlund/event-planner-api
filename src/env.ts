import { drizzle } from 'drizzle-orm/neon-http';

import type { AuthUser } from './auth/types';

const createDb = (connectionString: string) => drizzle(connectionString);

const dbCache = new Map<string, ReturnType<typeof createDb>>();

export type EnvBindings = {
  DATABASE_URL: string;
  ACCESS_TOKEN_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
  ACCESS_TOKEN_TTL_SECONDS?: string;
  REFRESH_TOKEN_TTL_SECONDS?: string;
};

export type AuthConfig = {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
};

export type EnvVariables = {
  db: ReturnType<typeof createDb>;
  authConfig: AuthConfig;
  authUser?: AuthUser;
};

export type AppEnv = {
  Bindings: EnvBindings;
  Variables: EnvVariables;
};

export const getDb = (env: EnvBindings) => {
  const cached = dbCache.get(env.DATABASE_URL);
  if (cached) {
    return cached;
  }

  const db = createDb(env.DATABASE_URL);
  dbCache.set(env.DATABASE_URL, db);
  return db;
};

const authConfigCache = new Map<string, AuthConfig>();

const parseTtl = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const ttl = Number.parseInt(value, 10);
  if (Number.isNaN(ttl) || ttl <= 0) {
    return fallback;
  }

  return ttl;
};

export const getAuthConfig = (env: EnvBindings): AuthConfig => {
  const cacheKey = [
    env.ACCESS_TOKEN_SECRET,
    env.REFRESH_TOKEN_SECRET,
    env.ACCESS_TOKEN_TTL_SECONDS ?? '',
    env.REFRESH_TOKEN_TTL_SECONDS ?? '',
  ].join(':');

  const cached = authConfigCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const config: AuthConfig = {
    accessTokenSecret: env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: env.REFRESH_TOKEN_SECRET,
    accessTokenTtlSeconds: parseTtl(env.ACCESS_TOKEN_TTL_SECONDS, 60 * 15),
    refreshTokenTtlSeconds: parseTtl(env.REFRESH_TOKEN_TTL_SECONDS, 60 * 60 * 24 * 30),
  };

  authConfigCache.set(cacheKey, config);
  return config;
};
