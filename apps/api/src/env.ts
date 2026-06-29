import 'dotenv/config';
import { z } from 'zod';

/**
 * Centralised, validated environment configuration.
 *
 * Every environment variable the application consumes is declared here and
 * validated with zod at process startup. There are intentionally NO default
 * values: a missing or malformed variable is a hard, fail-fast error rather
 * than something silently papered over with a fallback. This guarantees the
 * process never boots into a half-configured state.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test'], {
    required_error: 'NODE_ENV is required',
    invalid_type_error: 'NODE_ENV must be a string',
  }),

  PORT: z
    .string({ required_error: 'PORT is required' })
    .regex(/^\d+$/, 'PORT must be a positive integer')
    .transform((value) => parseInt(value, 10))
    .pipe(
      z
        .number()
        .int('PORT must be an integer')
        .gt(0, 'PORT must be greater than 0')
        .lt(65536, 'PORT must be a valid TCP port (1-65535)'),
    ),

  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .url('DATABASE_URL must be a valid connection URL')
    .refine(
      (value) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
      'DATABASE_URL must be a postgres:// or postgresql:// connection string',
    ),

  REDIS_URL: z
    .string({ required_error: 'REDIS_URL is required' })
    .url('REDIS_URL must be a valid connection URL')
    .refine(
      (value) => value.startsWith('redis://') || value.startsWith('rediss://'),
      'REDIS_URL must be a redis:// or rediss:// connection string',
    ),

  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters long')
    .refine(
      (value) => value !== 'change-me-to-a-random-secret',
      'JWT_SECRET must not be left as the example placeholder value',
    ),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'], {
    required_error: 'LOG_LEVEL is required',
    invalid_type_error: 'LOG_LEVEL must be a valid pino log level',
  }),
});

export type Env = z.infer<typeof envSchema>;

function formatErrors(error: z.ZodError): string {
  const fieldErrors = error.flatten().fieldErrors;
  const lines = Object.entries(fieldErrors).flatMap(([key, messages]) =>
    (messages ?? []).map((message) => `  • ${key}: ${message}`),
  );
  return lines.join('\n');
}

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = formatErrors(parsed.error);
    // Use console here directly: the logger itself depends on validated env,
    // so it may not be safely constructible at this point.
    console.error(
      [
        '',
        '✖ Invalid environment configuration. The application cannot start.',
        '',
        details,
        '',
        'Set the variables above (see .env.example) and restart.',
        '',
      ].join('\n'),
    );
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
