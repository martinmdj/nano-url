import type { z } from 'zod';
import type { createUrlSchema, updateUrlSchema, urlResponseSchema, urlListResponseSchema } from '../validation/url';

export type CreateUrlRequest = z.infer<typeof createUrlSchema>;
export type UpdateUrlRequest = z.infer<typeof updateUrlSchema>;
export type UrlResponse = z.infer<typeof urlResponseSchema>;
export type UrlListResponse = z.infer<typeof urlListResponseSchema>;