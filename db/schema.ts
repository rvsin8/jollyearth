import {sqliteTable,text,index} from 'drizzle-orm/sqlite-core';
export const fieldSubmissions=sqliteTable('field_submissions',{
 id:text('id').primaryKey(),kind:text('kind').notNull(),species:text('species').notNull(),park:text('park').notNull(),date:text('date').notNull(),observation:text('observation').notNull(),sourceCredit:text('source_credit').notNull(),sourceUrl:text('source_url').notNull(),origin:text('origin').notNull().default('student'),status:text('status').notNull().default('pending'),createdAt:text('created_at').notNull(),reviewedAt:text('reviewed_at')
},t=>[index('field_submissions_status_date').on(t.status,t.date)]);
