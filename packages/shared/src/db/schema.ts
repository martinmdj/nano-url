import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const urls = pgTable('urls', {
  id: serial('id').primaryKey(),
  shortCode: varchar('short_code', { length: 10 }).unique().notNull(),
  longUrl: text('long_url').notNull(),
  userId: integer('user_id').references(() => users.id),
  clicks: integer('clicks').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const clicks = pgTable('clicks', {
  id: serial('id').primaryKey(),
  urlId: integer('url_id')
    .references(() => urls.id)
    .notNull(),
  ip: varchar('ip', { length: 45 }),
  userAgent: text('user_agent'),
  referer: text('referer'),
  country: varchar('country', { length: 100 }),
  clickedAt: timestamp('clicked_at', { withTimezone: true }).defaultNow(),
});