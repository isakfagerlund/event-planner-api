import { z } from '@hono/zod-openapi';

export const timestampExample = '2024-07-01T12:00:00.000Z';

export const errorSchema = z
  .object({
    message: z.string().openapi({ example: 'Resource not found' }),
  })
  .openapi('ErrorResponse');
