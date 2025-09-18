import { drizzle } from 'drizzle-orm/neon-http';
import { events } from '../../drizzle/schema';

// Initialize database connection
export const db = drizzle(process.env.DATABASE_URL!);

// Export database instance and schema for use in services
export { events };
export * from '../../drizzle/schema';