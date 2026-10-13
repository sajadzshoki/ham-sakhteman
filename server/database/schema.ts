import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['resident', 'manager', 'admin'])
export const memberRoleEnum = pgEnum('member_role', ['manager', 'resident'])
export const unitStatusEnum = pgEnum('unit_status', ['occupied', 'vacant', 'maintenance'])
export const importanceEnum = pgEnum('announcement_importance', ['normal', 'important'])
export const problemCategoryEnum = pgEnum('problem_category', ['water', 'electricity', 'elevator', 'gas', 'common', 'cleaning', 'other'])
export const problemStatusEnum = pgEnum('problem_status', ['new', 'in-progress', 'resolved'])
export const chargeStatusEnum = pgEnum('charge_status', ['unpaid', 'paid', 'late'])
export const expenseCategoryEnum = pgEnum('expense_category', ['water', 'gas', 'electricity', 'elevator', 'cleaning', 'repair', 'other'])
export const providerCategoryEnum = pgEnum('provider_category', ['plumbing', 'electricity', 'elevator', 'cleaning', 'painting', 'ac', 'boiler', 'installations', 'glass', 'lock', 'other'])
export const notificationTypeEnum = pgEnum('notification_type', ['announcement', 'problem', 'charge', 'service'])

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('resident'),
  avatarInitials: text('avatar_initials'),
  ...timestamps,
}, (t) => [
  uniqueIndex('users_email_unique').on(t.email),
])

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('sessions_token_hash_unique').on(t.tokenHash),
  index('sessions_user_id_idx').on(t.userId),
])

export const buildings = pgTable('buildings', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address').notNull().default(''),
  description: text('description'),
  managerId: uuid('manager_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  invitationCode: text('invitation_code').notNull(),
  ...timestamps,
}, (t) => [
  uniqueIndex('buildings_invitation_code_unique').on(t.invitationCode),
  index('buildings_manager_id_idx').on(t.managerId),
])

export const buildingUnits = pgTable('building_units', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  number: text('number').notNull(),
  floor: text('floor').notNull(),
  status: unitStatusEnum('status').notNull().default('vacant'),
  residentName: text('resident_name'),
  residentUserId: uuid('resident_user_id').references(() => users.id, { onDelete: 'set null' }),
}, (t) => [
  uniqueIndex('building_units_number_unique').on(t.buildingId, t.number),
  index('building_units_building_id_idx').on(t.buildingId),
])

export const buildingMembers = pgTable('building_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  unitId: uuid('unit_id').references(() => buildingUnits.id, { onDelete: 'set null' }),
  role: memberRoleEnum('role').notNull().default('resident'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
}, (t) => [
  uniqueIndex('building_members_user_unique').on(t.buildingId, t.userId),
  index('building_members_building_id_idx').on(t.buildingId),
  index('building_members_user_id_idx').on(t.userId),
])

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  used: boolean('used').notNull().default(false),
  usedBy: uuid('used_by').references(() => users.id, { onDelete: 'set null' }),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('invitations_building_id_idx').on(t.buildingId),
])

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  importance: importanceEnum('importance').notNull().default('normal'),
  imageUrl: text('image_url'),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('announcements_building_created_idx').on(t.buildingId, t.createdAt),
])

export const problemReports = pgTable('problem_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  category: problemCategoryEnum('category').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  imageUrl: text('image_url'),
  status: problemStatusEnum('status').notNull().default('new'),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('problem_reports_building_status_idx').on(t.buildingId, t.status),
  index('problem_reports_building_category_idx').on(t.buildingId, t.category),
])

export const charges = pgTable('charges', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  period: text('period').notNull().default(''),
  dueDate: text('due_date').notNull().default(''),
  description: text('description'),
  status: chargeStatusEnum('status').notNull().default('unpaid'),
  paidAt: text('paid_at'),
  paidBy: uuid('paid_by').references(() => users.id, { onDelete: 'set null' }),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
}, (t) => [
  index('charges_building_due_idx').on(t.buildingId, t.dueDate),
])

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  category: expenseCategoryEnum('category').notNull(),
  date: text('date').notNull().default(''),
  description: text('description'),
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
}, (t) => [
  index('expenses_building_date_idx').on(t.buildingId, t.date),
])

export const serviceProviders = pgTable('service_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  category: providerCategoryEnum('category').notNull(),
  description: text('description').notNull().default(''),
  rating: numeric('rating', { precision: 3, scale: 1 }).notNull().default('0'),
  phone: text('phone').notNull(),
  area: text('area').notNull().default(''),
  workingHours: text('working_hours').notNull().default(''),
  imageUrl: text('image_url'),
  trusted: boolean('trusted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
}, (t) => [
  index('service_providers_category_idx').on(t.category),
])

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull().default(''),
  link: text('link'),
  unread: boolean('unread').notNull().default(true),
  sourceId: uuid('source_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('notifications_user_unread_idx').on(t.userId, t.unread),
  uniqueIndex('notifications_user_type_source_unique').on(t.userId, t.type, t.sourceId),
])
