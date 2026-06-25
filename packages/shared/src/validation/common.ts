import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().positive().int().default(1),
  limit: z.coerce.number().positive().int().max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.coerce.number().positive().int(),
});