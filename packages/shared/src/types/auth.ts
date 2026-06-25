import type { z } from 'zod';
import type { loginSchema, registerSchema } from '../validation/auth';

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;

export type AuthResponse = {
  token: string;
  user: {
    id: number;
    username: string;
  };
};