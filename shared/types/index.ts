/**
 * قرارداد داده‌ی API — همان نام فیلدهای `app/types` برنامه، به‌علاوه‌ی فیلدهای
 * اضافه‌ی سرور (همگی اختیاری یا صریحاً مستند).
 * همه‌ی تاریخ‌ها رشته ISO هستند.
 */

// ——— احراز هویت ———

/** نقش پلتفرمی کاربر؛ سوپرادمین سطح پلتفرم است و عضو ساختمان نیست */
export type MemberRole = 'manager' | 'resident' | 'superadmin'

/** نقش درون ساختمان */
export type BuildingRole = 'manager' | 'resident'

export interface User {
  id: string
  name: string
  /** موبایل نرمال‌شده 09xxxxxxxxx */
  phone: string
  email?: string
  role: MemberRole
  avatarInitials?: string
  createdAt: string
}

// ——— ساختمان، واحد، عضو ———

export interface Building {
  id: string
  name: string
  address: string
  /** تعداد واحدهای تعریف‌شده */
  unitsCount: number
  /** تعداد اعضا (افزونه‌ی سرور) */
  memberCount: number
  description?: string
  managerId: string
  createdAt: string
  /** فقط برای مدیر ساختمان و سوپرادمین */
  invitationCode?: string
  invitationLink?: string
}

export interface BuildingUnit {
  id: string
  buildingId: string
  number: number
  floor: number
}

export type UnitStatus = 'owner' | 'tenant'

export interface BuildingMember {
  id: string
  buildingId: string
  userId?: string
  name: string
  phone?: string
  role: BuildingRole
  unitId?: string
  unitStatus?: UnitStatus
  joinedAt: string
  invitedBy?: string
}

// ——— دعوت‌نامه ———

export type InvitationStatus = 'active' | 'used' | 'expired'

export interface Invitation {
  id: string
  buildingId: string
  code: string
  role: BuildingRole
  createdBy: string
  createdAt: string
  expiresAt: string
  status: InvitationStatus
  /** لینک پیوستن: `/join?code=` */
  link: string
  usedBy?: string
  usedAt?: string
}

// ——— اطلاعیه، مشکل ———

export type AnnouncementImportance = 'normal' | 'important'

export interface Announcement {
  id: string
  buildingId: string
  title: string
  body: string
  importance: AnnouncementImportance
  image?: string
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt?: string
}

export type ProblemCategory = 'water' | 'electricity' | 'elevator' | 'gas' | 'common' | 'cleaning' | 'other'
export type ProblemStatus = 'new' | 'in-progress' | 'resolved'

export interface ProblemReport {
  id: string
  buildingId: string
  category: ProblemCategory
  title: string
  description: string
  image?: string
  status: ProblemStatus
  reportedBy: string
  reportedByName: string
  createdAt: string
  updatedAt?: string
}

// ——— شارژ و هزینه ———

/** وضعیت شارژ برای یک عضو — از روی پرداخت و سررسید محاسبه می‌شود */
export type ChargeStatus = 'unpaid' | 'paid' | 'overdue'

export interface BuildingCharge {
  id: string
  buildingId: string
  title: string
  period: string
  /** مبلغ سهم هر عضو به تومان */
  amount: number
  dueAt: string
  notes?: string
  createdBy: string
  createdByName: string
  createdAt: string
}

export interface ChargePayment {
  id: string
  chargeId: string
  memberId: string
  memberName: string
  amount: number
  paidAt: string
  note?: string
  method: 'manual'
  recordedBy: string
}

/** شارژ همراه با پرداخت‌ها و خلاصه‌ی وصول (برای لیست و جزئیات) */
export interface ChargeWithPayments extends BuildingCharge {
  payments: ChargePayment[]
  /** تعداد اعضایی که پرداخت کرده‌اند */
  paidCount: number
  /** تعداد کل اعضای ساختمان */
  memberCount: number
  /** مجموع مبلغ وصول‌شده */
  collectedAmount: number
  /** وضعیت شارژ برای عضوِ کاربر جاری؛ اگر کاربر عضو نباشد وجود ندارد */
  status?: ChargeStatus
}

export type ExpenseCategory = 'water' | 'gas' | 'electricity' | 'elevator' | 'cleaning' | 'repair' | 'other'

export interface Expense {
  id: string
  buildingId: string
  title: string
  amount: number
  category: ExpenseCategory
  date: string
  notes?: string
  receipt?: string
  createdBy: string
  createdByName: string
  createdAt: string
}

// ——— دایره خدمات ———

export type ProviderCategory =
  | 'plumbing'
  | 'electrical'
  | 'elevator'
  | 'cleaning'
  | 'painting'
  | 'cooler'
  | 'heating'
  | 'installations'
  | 'glazing'
  | 'locksmith'
  | 'other'

export interface ServiceProvider {
  id: string
  name: string
  category: ProviderCategory
  description: string
  rating: number
  phone: string
  serviceArea: string
  workingHours: string
  image?: string
  /** فقط وقتی `buildingId` در درخواست باشد: مورد اعتماد آن ساختمان است؟ */
  trusted?: boolean
}

// ——— اعلان ———

export type NotificationType =
  | 'announcement'
  | 'announcement-important'
  | 'problem-new'
  | 'problem-status'
  | 'charge-new'
  | 'payment-recorded'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body?: string
  link?: string
  createdAt: string
  /** خالی یعنی خوانده‌نشده */
  readAt?: string
}

// ——— پاسخ‌های احراز هویت ———

export interface OtpRequestResult {
  phone: string
  /** مدت اعتبار کد به ثانیه */
  expiresIn: number
  /** فقط وقتی کلید Kavenegar تنظیم نشده (محیط توسعه) */
  devCode?: string
}
