/**
 * ابزارهای فرمت‌دهی اعداد و تاریخ برای زبان فارسی.
 * همه خروجی‌ها با ارقام و تقویم فارسی (جلالی) تولید می‌شوند.
 */

const NUMBER_FORMATTER = new Intl.NumberFormat('fa-IR')

const DATE_FORMATTERS = {
  /** مثال: ۱۴ مهر */
  short: new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' }),
  /** مثال: سه‌شنبه ۱۴ مهر */
  weekday: new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' }),
  /** مثال: ۱۴ مهر ۱۴۰۴ */
  full: new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' }),
  /** مثال: ۱۴ مهر ۱۴۰۴، ساعت ۱۸:۳۰ */
  withTime: new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }),
} as const

export type DateFormat = keyof typeof DATE_FORMATTERS

/** تبدیل ارقام لاتین به ارقام فارسی */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(digit)))
}

/** فرمت مبلغ با جداکننده هزارگان فارسی؛ مثال: ۸۵۰٬۰۰۰ */
export function formatAmount(amount: number): string {
  return NUMBER_FORMATTER.format(amount)
}

/** فرمت مبلغ به همراه واحد تومان؛ مثال: ۸۵۰٬۰۰۰ تومان */
export function formatPrice(amount: number): string {
  return `${formatAmount(amount)} تومان`
}

/** فرمت تاریخ با تقویم جلالی */
export function formatDate(date: Date | string, format: DateFormat = 'full'): string {
  const value = typeof date === 'string' ? new Date(date) : date
  return DATE_FORMATTERS[format].format(value)
}

/** نمایش زمان نسبی؛ مثال: دیروز، ۳ روز پیش */
export function formatRelative(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date
  const diffMs = value.getTime() - Date.now()
  const diffDays = Math.round(diffMs / 86_400_000)

  if (Math.abs(diffDays) <= 30) {
    const formatter = new Intl.RelativeTimeFormat('fa', { numeric: 'auto' })
    return formatter.format(diffDays, 'day')
  }

  return formatDate(value, 'full')
}

/** فرمت شماره موبایل برای نمایش؛ مثال: ۰۹۱۲ ۳۴۵ ۶۷۸۹ */
export function formatPhone(phone: string): string {
  const digits = toLatinDigits(phone).replace(/\D/g, '')
  const parts = [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7)]
  return toPersianDigits(parts.filter(Boolean).join(' '))
}

/** لینک تماس (`tel:`) از روی شماره؛ ارقام فارسی به لاتین تبدیل می‌شوند */
export function telHref(phone: string): string {
  return `tel:${toLatinDigits(phone).replace(/[^\d+]/g, '')}`
}

/** فرمت امتیاز با یک رقم اعشار و ممیز فارسی؛ مثال: ۴٫۸ */
export function formatRating(rating: number): string {
  return toPersianDigits(rating.toFixed(1)).replace('.', '٫')
}

/** تبدیل ارقام فارسی/عربی به لاتین برای پردازش ورودی عددی */
function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
}

/**
 * تبدیل ورودی متنی مبلغ به عدد؛ جداکننده‌ها، فاصله و ارقام فارسی را تحمل می‌کند.
 * برای ورودی نامعتبر یا غیرمثبت `null` برمی‌گرداند.
 */
export function parseAmount(value: string): number | null {
  const normalized = toLatinDigits(value).replace(/[^\d]/g, '')
  if (!normalized) return null
  const amount = Number(normalized)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return amount
}

/**
 * تبدیل ورودی متنی به عدد صحیح؛ ارقام فارسی/عربی و جداکننده‌ها را تحمل می‌کند.
 * خارج از بازه یا ورودی خالی `null` برمی‌گرداند.
 */
export function parseInteger(value: string, bounds?: { min?: number, max?: number }): number | null {
  const normalized = toLatinDigits(value).replace(/[^\d]/g, '')
  if (!normalized) return null
  const amount = Number(normalized)
  if (!Number.isInteger(amount)) return null
  if (bounds?.min !== undefined && amount < bounds.min) return null
  if (bounds?.max !== undefined && amount > bounds.max) return null
  return amount
}

/** تبدیل مقدار `2026-09-30` اینپوت تاریخ به رشته ISO با زمان محلی */
export function isoFromDateString(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

/** مقدار مناسب اینپوت تاریخ (`2026-09-30`) از روی رشته ISO با زمان محلی */
export function dateInputValue(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
