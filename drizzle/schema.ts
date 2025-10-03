import { pgTable, text, timestamp, integer, date, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  description: text(),
  startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' }),
  endsAt: timestamp('ends_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

export const users = pgTable('users', {
  id: text().primaryKey().notNull(),
  email: text().notNull(),
  displayName: text('display_name'),
  passwordHash: text('password_hash')
    .notNull()
    .default('pbkdf2$100000$legacy$legacy'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
}, (table) => ({
  emailUnique: uniqueIndex('users_email_unique').on(table.email),
}));

export const userRefreshTokens = pgTable('user_refresh_tokens', {
  id: text().primaryKey().notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'string' }),
  revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
}, (table) => ({
  tokenHashUnique: uniqueIndex('user_refresh_tokens_token_hash_unique').on(table.tokenHash),
}));

export const eventUsers = pgTable(
  'event_users',
  {
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text().default('editor').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.eventId, table.userId] }),
  })
);

export const shoppingLists = pgTable('shopping_lists', {
  id: text().primaryKey().notNull(),
  eventId: text('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  notes: text(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

export const shoppingListItems = pgTable('shopping_list_items', {
  id: text().primaryKey().notNull(),
  listId: text('list_id')
    .notNull()
    .references(() => shoppingLists.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  quantity: integer().default(1).notNull(),
  status: text().default('pending').notNull(),
  neededBy: timestamp('needed_by', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

export const eventSchedules = pgTable('event_schedules', {
  id: text().primaryKey().notNull(),
  eventId: text('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  notes: text(),
  day: date(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

export const eventScheduleSlots = pgTable('event_schedule_slots', {
  id: text().primaryKey().notNull(),
  scheduleId: text('schedule_id')
    .notNull()
    .references(() => eventSchedules.id, { onDelete: 'cascade' }),
  label: text().notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true, mode: 'string' }),
  ownerUserId: text('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
  location: text(),
  notes: text(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});
