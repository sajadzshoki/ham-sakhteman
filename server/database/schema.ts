import {
  bigint,
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['resident', 'manager', 'superadmin'])
export const memberRoleEnum = pgEnum('member_role', ['manager', 'resident'])
export const unitStatusEnum = pgEnum('unit_status', ['owner', 'tenant'])
export const importanceEnum = pgEnum('announcement_importance', ['normal', 'important'])
export const problemCategoryEnum = pgEnum('problem_category', ['water', 'electricity', 'elevator', 'gas', 'common', 'cleaning', 'other'])
export const problemStatusEnum = pgEnum('problem_status', ['new', 'in-progress', 'resolved'])
export const paymentMethodEnum = pgEnum('payment_method', ['manual'])
export const expenseCategoryEnum = pgEnum('expense_category', ['water', 'gas', 'electricity', 'elevator', 'cleaning', 'repair', 'other'])
export const providerCategoryEnum = pgEnum('provider_category', ['plumbing', 'electrical', 'elevator', 'cleaning', 'painting', 'cooler', 'heating', 'installations', 'glazing', 'locksmith', 'other'])
export const notificationTypeEnum = pgEnum('notification_type', ['announcement', 'announcement-important', 'problem-new', 'problem-status', 'charge-new', 'payment-recorded'])

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  /** موبایل ایرانی نرمال‌شده به شکل 09xxxxxxxxx */
  phone: text('phone').notNull(),
  email: text('email'),
  role: userRoleEnum('role').notNull().default('resident'),
  avatarInitials: text('avatar_initials'),
  ...timestamps,
}, (t) => [
  uniqueIndex('users_phone_unique').on(t.phone),
  uniqueIndex('users_email_unique').on(t.email),
])

export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: text('phone').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('otp_codes_phone_idx').on(t.phone),
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
  /** آخرین کد دعوت فعال؛ منبع اصلی کدها جدول invitations است */
  invitationCode: text('invitation_code').notNull(),
  ...timestamps,
}, (t) => [
  uniqueIndex('buildings_invitation_code_unique').on(t.invitationCode),
  index('buildings_manager_id_idx').on(t.managerId),
])

export const buildingUnits = pgTable('building_units', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  number: integer('number').notNull(),
  floor: integer('floor').notNull(),
}, (t) => [
  uniqueIndex('building_units_number_unique').on(t.buildingId, t.number),
  index('building_units_building_id_idx').on(t.buildingId),
])

export const buildingMembers = pgTable('building_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  /** عضو مهمان (بدون حساب کاربری) می‌تواند userId خالی داشته باشد */
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone'),
  role: memberRoleEnum('role').notNull().default('resident'),
  unitId: uuid('unit_id').references(() => buildingUnits.id, { onDelete: 'set null' }),
  unitStatus: unitStatusEnum('unit_status'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
}, (t) => [
  uniqueIndex('building_members_user_unique').on(t.buildingId, t.userId),
  index('building_members_building_id_idx').on(t.buildingId),
  index('building_members_user_id_idx').on(t.userId),
  index('building_members_unit_id_idx').on(t.unitId),
])

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  role: memberRoleEnum('role').notNull().default('resident'),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  used: boolean('used').notNull().default(false),
  usedBy: uuid('used_by').references(() => users.id, { onDelete: 'set null' }),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('invitations_code_unique').on(t.code),
  index('invitations_building_id_idx').on(t.buildingId),
])

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  importance: importanceEnum('importance').notNull().default('normal'),
  imageUrl: text('image_url'),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  ...timestamps,
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
  /** گزارش‌دهنده */
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  ...timestamps,
}, (t) => [
  index('problem_reports_building_status_idx').on(t.buildingId, t.status),
  index('problem_reports_building_category_idx').on(t.buildingId, t.category),
])

export const charges = pgTable('charges', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  /** مبلغ سهم هر عضو به تومان */
  amount: bigint('amount', { mode: 'number' }).notNull(),
  period: text('period').notNull().default(''),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  notes: text('notes'),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('charges_building_due_idx').on(t.buildingId, t.dueAt),
])

export const chargePayments = pgTable('charge_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  chargeId: uuid('charge_id').notNull().references(() => charges.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id').notNull().references(() => buildingMembers.id, { onDelete: 'cascade' }),
  memberName: text('member_name').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
  note: text('note'),
  method: paymentMethodEnum('method').notNull().default('manual'),
  recordedBy: uuid('recorded_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
}, (t) => [
  uniqueIndex('charge_payments_charge_member_unique').on(t.chargeId, t.memberId),
  index('charge_payments_member_id_idx').on(t.memberId),
])

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  category: expenseCategoryEnum('category').notNull(),
  /** تاریخ وقوع هزینه به شکل متن ISO (مثل برنامه) */
  date: text('date').notNull(),
  notes: text('notes'),
  receiptUrl: text('receipt_url'),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
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
  serviceArea: text('service_area').notNull().default(''),
  workingHours: text('working_hours').notNull().default(''),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('service_providers_category_idx').on(t.category),
])

export const buildingTrustedProviders = pgTable('building_trusted_providers', {
  buildingId: uuid('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').notNull().references(() => serviceProviders.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.buildingId, t.providerId] }),
])

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  link: text('link'),
  /** null یعنی خوانده‌نشده */
  readAt: timestamp('read_at', { withTimezone: true }),
  sourceId: uuid('source_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('notifications_user_read_idx').on(t.userId, t.readAt),
  index('notifications_source_idx').on(t.sourceId),
  uniqueIndex('notifications_user_type_source_unique').on(t.userId, t.type, t.sourceId),
])
