import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const names = sqliteTable('names', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  gender: text('gender').notNull(), // 'boy', 'girl', 'neutral'
  origin: text('origin'),
  phoneticHash: text('phonetic_hash'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  createdBy: text('created_by'), // optional, if we track who added it
});

export const votes = sqliteTable('votes', {
  id: text('id').primaryKey(),
  userName: text('user_name').notNull(),
  nameId: text('name_id').notNull().references(() => names.id),
  vote: text('vote').notNull(), // 'like', 'dislike', 'superlike'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
