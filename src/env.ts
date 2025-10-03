import { drizzle } from 'drizzle-orm/neon-http';

const createDb = (connectionString: string) => drizzle(connectionString);

const dbCache = new Map<string, ReturnType<typeof createDb>>();

export type EnvBindings = {
  DATABASE_URL: string;
};

export type EnvVariables = {
  db: ReturnType<typeof createDb>;
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
