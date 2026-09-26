import { z } from 'zod'

export const problemCategories = ['water', 'electricity', 'elevator', 'gas', 'common', 'cleaning', 'other'] as const
export const expenseCategories = ['water', 'gas', 'electricity', 'elevator', 'cleaning', 'repair', 'other'] as const
export const providerCategories = ['plumbing', 'electricity', 'elevator', 'cleaning', 'painting', 'ac', 'boiler', 'installations', 'glass', 'lock', 'other'] as const
export const unitStatuses = ['occupied', 'vacant', 'maintenance'] as const
export const memberRoles = ['manager', 'resident'] as const
export const chargeStatuses = ['unpaid', 'paid', 'late'] as const
export const problemStatuses = ['new', 'in-progress', 'resolved'] as const
export const importances = ['normal', 'important'] as const

export const optionalUrl = z.string().trim().max(2000).nullable().optional()

export const emailSchema = z.string().trim().toLowerCase().email('ایمیل نامعتبر است').max(200)
export const uuidSchema = z.string().uuid('شناسه نامعتبر است')

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'نام الزامی است').max(120),
  email: emailSchema,
  password: z.string().min(4, 'رمز حداقل ۴ کاراکتر').max(200),
  confirmPassword: z.string().max(200).optional(),
}).refine((value) => value.confirmPassword === undefined || value.confirmPassword === value.password, {
  message: 'رمزها یکسان نیستند',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'رمز عبور الزامی است').max(200),
})

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'نام الزامی است').max(120).optional(),
  email: emailSchema.optional(),
  phone: z.string().trim().max(30).nullable().optional(),
})

export const buildingCreateSchema = z.object({
  name: z.string().trim().min(1, 'نام ساختمان الزامی است').max(200),
  address: z.string().trim().max(500).optional().default(''),
  description: z.string().trim().max(5000).optional().default(''),
  unitCount: z.coerce.number().int().nonnegative().optional(),
  residentCount: z.coerce.number().int().nonnegative().optional(),
})

export const buildingUpdateSchema = z.object({
  name: z.string().trim().min(1, 'نام ساختمان الزامی است').max(200).optional(),
  address: z.string().trim().max(500).optional(),
  description: z.string().trim().max(5000).optional(),
})

export const unitCreateSchema = z.object({
  number: z.string().trim().min(1, 'شماره واحد الزامی است').max(20),
  floor: z.string().trim().min(1, 'طبقه الزامی است').max(20),
  status: z.enum(unitStatuses).optional().default('vacant'),
  residentName: z.string().trim().max(120).optional(),
  residentId: uuidSchema.optional(),
})

export const unitUpdateSchema = unitCreateSchema.partial()

export const memberCreateSchema = z.object({
  userId: uuidSchema.optional(),
  email: emailSchema.optional(),
  role: z.enum(memberRoles),
  unitId: uuidSchema.nullable().optional(),
}).refine((value) => Boolean(value.userId || value.email), {
  message: 'کاربر الزامی است',
  path: ['userId'],
})

export const memberUpdateSchema = z.object({
  role: z.enum(memberRoles).optional(),
  unitId: uuidSchema.nullable().optional(),
})

export const announcementSchema = z.object({
  title: z.string().trim().min(1, 'عنوان الزامی است').max(200),
  description: z.string().trim().max(5000).optional().default(''),
  importance: z.enum(importances).optional().default('normal'),
  imageUrl: optionalUrl,
})

export const announcementUpdateSchema = z.object({
  title: z.string().trim().min(1, 'عنوان الزامی است').max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  importance: z.enum(importances).optional(),
  imageUrl: optionalUrl,
})

export const problemCreateSchema = z.object({
  category: z.enum(problemCategories),
  title: z.string().trim().min(1, 'عنوان الزامی است').max(200),
  description: z.string().trim().max(5000).optional().default(''),
  imageUrl: optionalUrl,
})

export const problemUpdateSchema = z.object({
  status: z.enum(problemStatuses),
})

export const categoryQuerySchema = z.object({
  category: z.string().trim().optional(),
})

export const chargeCreateSchema = z.object({
  title: z.string().trim().min(1, 'عنوان الزامی است').max(200),
  amount: z.coerce.number().int('مبلغ باید عدد صحیح باشد').positive('مبلغ باید بیشتر از صفر باشد').max(1_000_000_000_000),
  period: z.string().trim().max(100).optional().default(''),
  dueDate: z.string().trim().max(50).optional().default(''),
  description: z.string().trim().max(5000).optional().default(''),
})

export const chargeUpdateSchema = z.object({
  status: z.enum(chargeStatuses).optional(),
  paidAt: z.string().trim().max(50).nullable().optional(),
  paidBy: uuidSchema.nullable().optional(),
  note: z.string().trim().max(2000).nullable().optional(),
})

export const expenseCreateSchema = z.object({
  title: z.string().trim().min(1, 'عنوان الزامی است').max(200),
  amount: z.coerce.number().int('مبلغ باید عدد صحیح باشد').positive('مبلغ باید بیشتر از صفر باشد').max(1_000_000_000_000),
  category: z.enum(expenseCategories),
  date: z.string().trim().max(50).optional().default(''),
  description: z.string().trim().max(5000).optional().default(''),
  receiptUrl: optionalUrl,
})

export const providerQuerySchema = z.object({
  q: z.string().trim().max(200).optional().default(''),
  category: z.string().trim().optional(),
})

export const trustedSchema = z.object({
  trusted: z.boolean(),
})

export const joinSchema = z.object({
  code: z.string().trim().min(1, 'کد دعوت الزامی است').max(32),
})

export const notificationReadSchema = z.object({
  unread: z.boolean().refine((value) => value === false, 'فقط علامت خوانده‌شده پذیرفته می‌شود'),
})
