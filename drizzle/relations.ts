import { relations } from 'drizzle-orm';

import {
  eventScheduleSlots,
  eventSchedules,
  eventUsers,
  events,
  shoppingListItems,
  shoppingLists,
  userRefreshTokens,
  users,
} from './schema';

export const eventsRelations = relations(events, ({ many }) => ({
  members: many(eventUsers),
  shoppingLists: many(shoppingLists),
  schedules: many(eventSchedules),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(eventUsers),
  ownedScheduleSlots: many(eventScheduleSlots),
  refreshTokens: many(userRefreshTokens),
}));

export const userRefreshTokensRelations = relations(userRefreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [userRefreshTokens.userId],
    references: [users.id],
  }),
}));

export const eventUsersRelations = relations(eventUsers, ({ one }) => ({
  event: one(events, {
    fields: [eventUsers.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventUsers.userId],
    references: [users.id],
  }),
}));

export const shoppingListsRelations = relations(shoppingLists, ({ one, many }) => ({
  event: one(events, {
    fields: [shoppingLists.eventId],
    references: [events.id],
  }),
  items: many(shoppingListItems),
}));

export const shoppingListItemsRelations = relations(shoppingListItems, ({ one }) => ({
  list: one(shoppingLists, {
    fields: [shoppingListItems.listId],
    references: [shoppingLists.id],
  }),
}));

export const eventSchedulesRelations = relations(eventSchedules, ({ one, many }) => ({
  event: one(events, {
    fields: [eventSchedules.eventId],
    references: [events.id],
  }),
  slots: many(eventScheduleSlots),
}));

export const eventScheduleSlotsRelations = relations(eventScheduleSlots, ({ one }) => ({
  schedule: one(eventSchedules, {
    fields: [eventScheduleSlots.scheduleId],
    references: [eventSchedules.id],
  }),
  owner: one(users, {
    fields: [eventScheduleSlots.ownerUserId],
    references: [users.id],
  }),
}));
