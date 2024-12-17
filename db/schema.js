import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const jobOrders = sqliteTable('job_orders', {
  id: integer('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  projectDetails: text('project_details').notNull(),
  status: text('status').notNull().default('received'), // received, printing, packaging, completed
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
