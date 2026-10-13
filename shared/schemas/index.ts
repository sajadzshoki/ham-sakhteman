import { z } from 'zod'
import { normalizePhone, toLatinDigits } from '../utils/phone'

export const problemCategories = ['water', 'electricity', 'elevator', 'gas', 'common', 'cleaning', 'other'] as const
export const expenseCategories = ['water', 'gas', 'electricity', 'elevator', 'cleaning', 'repair', 'other'] as const
export const providerCategories = ['plumbing', 'electrical', 'elevator', 'cleaning', 'painting', 'cooler', 'heating', 'installations', 'glazing', 'locksmith', 'other'] as const
export const unitStatuses = ['owner', 'tenant'] as const
export const memberRoles = ['manager', 'resident'] as const
export const problemStatuses = ['new', 'in-progress', 'resolved'] as const
export const importances = ['normal', 'important'] as const
export const otpPurposes = ['login', 'register'] as const

export const optionalUrl = z.string().trim().max(2000).nullable().optional()
export const uuidSchema = z.string().uuid('شناسه نامعتبر است')

/** موبایل ایرانی؛ خروجی نرمال‌شده 09xxxxxxxxx */
export const phoneSchema = z.string({ required_error: 'شماره موبایل الزامی است' }).trim().transform((value, ctx) => {
  const phone = normalizePhone(value)
  if (!phone) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'شماره موبایل نامعتبر است' })
    return z.NEVER
  }
  return phone
})

/** تاریخ/زمان ISO (یا فقط تاریخ) که به Date تبدیل می‌شود */
export const dateTimeSchema = z.string().trim().transform((value, ctx) => {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'تاریخ نامعتبر است' })
    return z.NEVER
  }
  return date
})

const amountSchema = z.coerce.number({ invalid_type_error: 'مبلغ باید عدد باشد' })
  .int('مبلغ باید عدد صحیح باشد')
  .positive('مبلغ باید بیشتر از صفر باشد')
  .max(1_000_000_000_000, 'مبلغ بیش از حد مجاز است')

const nameSchema = z.string().trim().min(1, 'نام الزامی است').max(120)

// ——— احراز هویت ———

export const otpRequestSchema = z.object({
  phone: phoneSchema,
  purpose: z.enum(otpPurposes).optional().default('login'),
})

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.coerce.string().trim().transform((value) => toLatinDigits(value)).pipe(z.string().regex(/^\d{4}$/, 'کد تأیید ۴ رقمی است')),
  name: z.string().trim().min(1, 'نام الزامی است').max(120).optional(),
  role: z.enum(memberRoles).optional(),
})

export const profileSchema = z.object({
  name: nameSchema.optional(),
})

// ——— ساختمان، واحد، عضو ———

export const buildingCreateSchema = z.object({
  name: z.string().trim().min(1, 'نام ساختمان الزامی است').max(200),
  address: z.string().trim().max(500).optional().default(''),
  description: z.string().trim().max(5000).optional().default(''),
  unitCount: z.coerce.number().int().min(0).max(500, 'حداکثر ۵۰۰ واحد').optional(),
})

export const buildingUpdateSchema = z.object({
  name: z.string().trim().min(1, 'نام ساختمان الزامی است').max(200).optional(),
  address: z.string().trim().max(500).optional(),
  description: z.string().trim().max(5000).optional(),
})

export const unitCreateSchema = z.object({
  number: z.coerce.number().int('شماره واحد باید عدد صحیح باشد').min(1, 'شماره واحد الزامی است').max(100000),
  floor: z.coerce.number().int('طبقه باید عدد صحیح باشد').min(-10).max(300),
})

export const unitUpdateSchema = unitCreateSchema.partial()

const optionalPhone = phoneSchema.nullable().optional()

export const memberCreateSchema = z.object({
  name: nameSchema,
  phone: optionalPhone,
  userId: uuidSchema.optional(),
  role: z.enum(memberRoles).optional().default('resident'),
  unitId: uuidSchema.nullable().optional(),
  unitStatus: z.enum(unitStatuses).nullable().optional(),
})

export const memberUpdateSchema = z.object({
  name: nameSchema.optional(),
  phone: optionalPhone,
  role: z.enum(memberRoles).optional(),
  unitId: uuidSchema.nullable().optional(),
  unitStatus: z.enum(unitStatuses).nullable().optional(),
})

// ——— دعوت‌نامه ———

export const invitationCreateSchema = z.object({
  role: z.enum(memberRoles).optional().default('resident'),
  expiresAt: dateTimeSchema.optional(),
})

export const joinSchema = z.object({
  code: z.string().trim().min(1, 'کد دعوت الزامی است').max(32),
})

// ——— اطلاعیه و مشکل ———

export const announcementSchema = z.object({
  title: z.string().trim().min(1, 'عنوان الزامی است').max(200),
  body: z.string().trim().max(5000).optional().default(''),
  importance: z.enum(importances).optional().default('normal'),
  image: optionalUrl,
})

export const announcementUpdateSchema = z.object({
  title: z.string().trim().min(1, 'عنوان الزامی است').max(200).optional(),
  body: z.string().trim().max(5000).optional(),
  importance: z.enum(importances).optional(),
  image: optionalUrl,
})

export const problemCreateSchema = z.object({
  category: z.enum(problemCategories),
  title: z.string().trim().min(1, 'عنوان الزامی است').max(200),
  description: z.string().trim().max(5000).optional().default(''),
  image: optionalUrl,
})

export const problemUpdateSchema = z.object({
  status: z.enum(problemStatuses),
})

export const categoryQuerySchema = z.object({
  category: z.string().trim().optional(),
})

// ——— شارژ و هزینه ———

export const chargeCreateSchema = z.object({
  title: z.string().trim().min(1, 'عنوان الزامی است').max(200),
  amount: amountSchema,
  period: z.string().trim().max(100).optional().default(''),
  dueAt: dateTimeSchema,
  notes: z.string().trim().max(5000).optional().default(''),
})

export const chargeUpdateSchema = z.object({
  title: z.string().trim().min(1, 'عنوان الزامی است').max(200).optional(),
  period: z.string().trim().max(100).optional(),
  dueAt: dateTimeSchema.optional(),
  notes: z.string().trim().max(5000).optional(),
})

export const paymentCreateSchema = z.object({
  memberId: uuidSchema,
  amount: amountSchema.optional(),
  paidAt: dateTimeSchema.optional(),
  note: z.string().trim().max(2000).nullable().optional(),
})

export const expenseCreateSchema = z.object({
  title: z.string().trim().min(1, 'عنوان الزامی است').max(200),
  amount: amountSchema,
  category: z.enum(expenseCategories),
  date: z.string().trim().max(50).optional().refine(
    (value) => !value || !Number.isNaN(new Date(value).getTime()),
    'تاریخ نامعتبر است',
  ),
  notes: z.string().trim().max(5000).optional().default(''),
  receipt: optionalUrl,
})

// ——— دایره خدمات ———

export const providerQuerySchema = z.object({
  q: z.string().trim().max(200).optional().default(''),
  category: z.string().trim().optional(),
  buildingId: uuidSchema.optional(),
})

export const trustedSchema = z.object({
  trusted: z.boolean({ required_error: 'مقدار trusted الزامی است', invalid_type_error: 'مقدار trusted باید بولین باشد' }),
})

// ——— اعلان ———

export const notificationReadSchema = z.object({
  read: z.boolean().optional().default(true),
}).optional().transform((value) => value ?? { read: true })
