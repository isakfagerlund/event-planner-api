import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';

export const events = pgTable('events', {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

export const eventsSelectSchema = createSelectSchema(events);
