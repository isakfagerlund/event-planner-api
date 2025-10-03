import { z } from '@hono/zod-openapi';

import { timestampExample } from './common';

export const userSchema = z
  .object({
    id: z.string().openapi({ example: 'usr_alice' }),
    email: z.string().email().openapi({ example: 'alice@example.com' }),
    displayName: z.string().nullable().openapi({ example: 'Alice Organizer' }),
    createdAt: z.string().datetime().openapi({ example: timestampExample }),
    updatedAt: z.string().datetime().openapi({ example: timestampExample }),
  })
  .openapi('User');

export const sanitizedUserSchema = userSchema.omit({}).openapi('SanitizedUser');
