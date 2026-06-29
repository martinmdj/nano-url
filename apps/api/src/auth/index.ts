import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../env';

const SALT_ROUNDS = 10;

function getSecret(): string {
  return env.JWT_SECRET;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, username: string): string {
  return jwt.sign({ userId, username }, getSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as { userId: number; username: string };
    return decoded;
  } catch {
    return null;
  }
}