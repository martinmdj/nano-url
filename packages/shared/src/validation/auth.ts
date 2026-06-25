import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(100, 'Username must be at most 100 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(255, 'Password must be at most 255 characters'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(100, 'Username must be at most 100 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(255, 'Password must be at most 255 characters'),
  confirmPassword: z.string().min(6).max(255),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});