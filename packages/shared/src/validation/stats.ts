import { z } from 'zod';

export const urlStatsSchema = z.object({
  totalClicks: z.number(),
  uniqueVisitors: z.number(),
  clicksByDay: z.array(z.object({
    date: z.string(),
    count: z.number(),
  })),
  referrers: z.record(z.string(), z.number()),
  browsers: z.record(z.string(), z.number()),
});

export const timeRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});