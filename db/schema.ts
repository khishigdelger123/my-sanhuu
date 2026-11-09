import { pgTable, serial, text, numeric, date, timestamp } from 'drizzle-orm/pg-core';
export const transactions = pgTable('transactions', {
 id: serial('id').primaryKey(), owner: text('owner').notNull(), title: text('title').notNull(),
 amount: numeric('amount', {precision: 16, scale: 2}).notNull(), type: text('type').notNull(), category: text('category').notNull(),
 account: text('account').notNull(), date: date('date').notNull(), note: text('note').notNull().default(''), createdAt: timestamp('created_at').defaultNow()
});
