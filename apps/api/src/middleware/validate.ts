import { z } from 'zod';
import { createMiddleware } from 'hono/factory';

type ValidationTarget = 'json' | 'query' | 'param';

export function validate(schema: z.ZodSchema, target: ValidationTarget = 'json') {
  return createMiddleware(async (c, next) => {
    let data: unknown;
    if (target === 'json') {
      try {
        data = await c.req.json();
      } catch {
        return c.json({ success: false, error: 'Invalid JSON body' }, 400);
      }
    }
    else if (target === 'query') data = c.req.query();
    else data = c.req.param();

    const result = schema.safeParse(data);
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Validation failed',
        details: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      }, 400);
    }

    c.set('validated', result.data);
    await next();
  });
}

declare module 'hono' {
  interface ContextVariableMap {
    validated: unknown;
  }
}