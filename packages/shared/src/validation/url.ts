import { z } from 'zod';

export const createUrlSchema = z.object({
  longUrl: z.string().url('Invalid URL').min(1, 'URL is required'),
  shortCode: z.string().regex(/^[a-zA-Z0-9]+$/).min(6).max(10).optional(),
});

export const updateUrlSchema = z.object({
  longUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export const urlResponseSchema = z.object({
  id: z.number(),
  shortCode: z.string(),
  longUrl: z.string(),
  userId: z.number().nullable(),
  clicks: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const urlListResponseSchema = z.object({
  data: z.array(urlResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});