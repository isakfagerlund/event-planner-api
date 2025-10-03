import 'dotenv/config';

import { drizzle } from 'drizzle-orm/neon-http';

import {
  eventScheduleSlots,
  eventSchedules,
  eventUsers,
  events,
  shoppingListItems,
  shoppingLists,
  userRefreshTokens,
  users,
} from '../drizzle/schema';
import { hashPassword } from '../src/auth/password';

const db = drizzle(process.env.DATABASE_URL!);

const iso = (value: string) => new Date(value).toISOString();

const main = async () => {
  console.log('🌱 Seeding database...');

  // clean tables in FK order
  await db.delete(eventScheduleSlots);
  await db.delete(eventSchedules);
  await db.delete(shoppingListItems);
  await db.delete(shoppingLists);
  await db.delete(eventUsers);
  await db.delete(events);
  await db.delete(userRefreshTokens);
  await db.delete(users);

  const [alicePassword, bobPassword, chrisPassword] = await Promise.all([
    hashPassword('Password123!'),
    hashPassword('Password123!'),
    hashPassword('Password123!'),
  ]);

  const userData = [
    {
      id: 'usr_alice',
      email: 'alice@example.com',
      displayName: 'Alice Organizer',
      passwordHash: alicePassword,
      createdAt: iso('2024-07-01T09:00:00Z'),
      updatedAt: iso('2024-07-01T09:00:00Z'),
    },
    {
      id: 'usr_bob',
      email: 'bob@example.com',
      displayName: 'Bob Coordinator',
      passwordHash: bobPassword,
      createdAt: iso('2024-07-01T09:30:00Z'),
      updatedAt: iso('2024-07-01T09:30:00Z'),
    },
    {
      id: 'usr_chris',
      email: 'chris@example.com',
      displayName: 'Chris Volunteer',
      passwordHash: chrisPassword,
      createdAt: iso('2024-07-01T10:00:00Z'),
      updatedAt: iso('2024-07-01T10:00:00Z'),
    },
  ];

  await db.insert(users).values(userData);

  const eventData = [
    {
      id: 'evt_launch',
      name: 'Product Launch Party',
      description: 'Kickoff celebration for the new product release.',
      startsAt: iso('2024-08-15T18:00:00Z'),
      endsAt: iso('2024-08-15T22:00:00Z'),
      createdAt: iso('2024-07-10T11:00:00Z'),
      updatedAt: iso('2024-07-10T11:00:00Z'),
    },
    {
      id: 'evt_retreat',
      name: 'Team Retreat',
      description: 'Weekend planning session in the mountains.',
      startsAt: iso('2024-09-20T16:00:00Z'),
      endsAt: iso('2024-09-22T20:00:00Z'),
      createdAt: iso('2024-07-15T08:00:00Z'),
      updatedAt: iso('2024-07-15T08:00:00Z'),
    },
  ];

  await db.insert(events).values(eventData);

  const eventUsersData = [
    {
      eventId: 'evt_launch',
      userId: 'usr_alice',
      role: 'owner',
      createdAt: iso('2024-07-10T11:05:00Z'),
      updatedAt: iso('2024-07-10T11:05:00Z'),
    },
    {
      eventId: 'evt_launch',
      userId: 'usr_bob',
      role: 'editor',
      createdAt: iso('2024-07-10T11:10:00Z'),
      updatedAt: iso('2024-07-10T11:10:00Z'),
    },
    {
      eventId: 'evt_retreat',
      userId: 'usr_bob',
      role: 'owner',
      createdAt: iso('2024-07-15T08:05:00Z'),
      updatedAt: iso('2024-07-15T08:05:00Z'),
    },
    {
      eventId: 'evt_retreat',
      userId: 'usr_chris',
      role: 'editor',
      createdAt: iso('2024-07-15T08:06:00Z'),
      updatedAt: iso('2024-07-15T08:06:00Z'),
    },
  ];

  await db.insert(eventUsers).values(eventUsersData);

  const shoppingListsData = [
    {
      id: 'slist_launch_catering',
      eventId: 'evt_launch',
      title: 'Catering Supplies',
      notes: 'Confirm dietary requirements with attendees.',
      createdAt: iso('2024-07-20T12:00:00Z'),
      updatedAt: iso('2024-07-20T12:00:00Z'),
    },
    {
      id: 'slist_retreat_packing',
      eventId: 'evt_retreat',
      title: 'Retreat Packing List',
      notes: 'Shared list for the retreat weekend essentials.',
      createdAt: iso('2024-07-22T12:00:00Z'),
      updatedAt: iso('2024-07-22T12:00:00Z'),
    },
  ];

  await db.insert(shoppingLists).values(shoppingListsData);

  const shoppingListItemsData = [
    {
      id: 'sitem_catering_appetizers',
      listId: 'slist_launch_catering',
      name: 'Appetizers Platter',
      quantity: 3,
      status: 'pending',
      neededBy: iso('2024-08-14T16:00:00Z'),
      createdAt: iso('2024-07-20T12:10:00Z'),
      updatedAt: iso('2024-07-20T12:10:00Z'),
    },
    {
      id: 'sitem_catering_drinks',
      listId: 'slist_launch_catering',
      name: 'Beverage Selection',
      quantity: 5,
      status: 'in-progress',
      neededBy: iso('2024-08-15T12:00:00Z'),
      createdAt: iso('2024-07-20T12:15:00Z'),
      updatedAt: iso('2024-07-20T12:15:00Z'),
    },
    {
      id: 'sitem_retreat_first_aid',
      listId: 'slist_retreat_packing',
      name: 'First Aid Kit',
      quantity: 2,
      status: 'completed',
      neededBy: iso('2024-09-18T10:00:00Z'),
      createdAt: iso('2024-07-22T12:05:00Z'),
      updatedAt: iso('2024-07-22T12:05:00Z'),
    },
  ];

  await db.insert(shoppingListItems).values(shoppingListItemsData);

  const schedulesData = [
    {
      id: 'sched_launch_dayof',
      eventId: 'evt_launch',
      title: 'Event Day Run Sheet',
      notes: 'Detailed plan for the launch day.',
      day: '2024-08-15',
      createdAt: iso('2024-07-25T08:00:00Z'),
      updatedAt: iso('2024-07-25T08:00:00Z'),
    },
    {
      id: 'sched_retreat_day1',
      eventId: 'evt_retreat',
      title: 'Retreat Day 1 Agenda',
      notes: 'Arrival and opening activities.',
      day: '2024-09-20',
      createdAt: iso('2024-07-26T09:00:00Z'),
      updatedAt: iso('2024-07-26T09:00:00Z'),
    },
  ];

  await db.insert(eventSchedules).values(schedulesData);

  const scheduleSlotsData = [
    {
      id: 'slot_launch_setup',
      scheduleId: 'sched_launch_dayof',
      label: 'Venue Setup',
      startsAt: iso('2024-08-15T15:00:00Z'),
      endsAt: iso('2024-08-15T17:00:00Z'),
      ownerUserId: 'usr_alice',
      location: 'Main Hall',
      notes: 'Coordinate with AV team for sound check.',
      createdAt: iso('2024-07-25T08:10:00Z'),
      updatedAt: iso('2024-07-25T08:10:00Z'),
    },
    {
      id: 'slot_launch_presentation',
      scheduleId: 'sched_launch_dayof',
      label: 'Product Presentation',
      startsAt: iso('2024-08-15T19:00:00Z'),
      endsAt: iso('2024-08-15T20:00:00Z'),
      ownerUserId: 'usr_bob',
      location: 'Auditorium Stage',
      notes: 'Introduce the keynote speaker.',
      createdAt: iso('2024-07-25T08:20:00Z'),
      updatedAt: iso('2024-07-25T08:20:00Z'),
    },
    {
      id: 'slot_retreat_arrival',
      scheduleId: 'sched_retreat_day1',
      label: 'Arrival & Check-in',
      startsAt: iso('2024-09-20T16:00:00Z'),
      endsAt: iso('2024-09-20T17:00:00Z'),
      ownerUserId: 'usr_bob',
      location: 'Lodge Reception',
      notes: 'Distribute welcome packets.',
      createdAt: iso('2024-07-26T09:10:00Z'),
      updatedAt: iso('2024-07-26T09:10:00Z'),
    },
    {
      id: 'slot_retreat_dinner',
      scheduleId: 'sched_retreat_day1',
      label: 'Team Dinner',
      startsAt: iso('2024-09-20T19:00:00Z'),
      endsAt: iso('2024-09-20T21:00:00Z'),
      ownerUserId: 'usr_chris',
      location: 'Lodge Dining Hall',
      notes: 'Buffet style, confirm vegetarian options.',
      createdAt: iso('2024-07-26T09:20:00Z'),
      updatedAt: iso('2024-07-26T09:20:00Z'),
    },
  ];

  await db.insert(eventScheduleSlots).values(scheduleSlotsData);

  console.log('✅ Seed complete');
};

main().catch((error) => {
  console.error('❌ Seed failed');
  console.error(error);
  process.exit(1);
});
