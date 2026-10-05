/** تولید شناسه ساده برای آیتم‌های ماک/محلی */
export function createId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** تاریخ در گذشته نسبت به امروز (برای دیتای دمو) */
export function daysAgo(days: number, hour = 9, minute = 0): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return date
}

/** تاریخ در آینده نسبت به امروز (برای دیتای دمو) */
export function daysAhead(days: number, hour = 9, minute = 0): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, minute, 0, 0)
  return date
}

/** ارقام فارسی و عربی را به لاتین تبدیل می‌کند تا ورودی کاربر قابل پردازش باشد */
function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
}

/** شماره موبایل را به ۱۱ رقم لاتین تبدیل می‌کند */
export function normalizePhone(phone: string): string {
  return toLatinDigits(phone).replace(/\D/g, '')
}

/** اعتبار شماره موبایل ایران؛ ارقام فارسی و عربی هم پذیرفته می‌شوند */
export function isValidPhone(phone: string): boolean {
  return /^09\d{9}$/.test(normalizePhone(phone))
}

/** کد دعوت را برای مقایسه یکدست می‌کند (ارقام فارسی، فاصله و حروف کوچک) */
export function normalizeInviteCode(code: string): string {
  return toLatinDigits(code).replace(/[^0-9a-z]/gi, '').toUpperCase()
}

const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** تولید کد دعوت ۶ کاراکتری بدون کاراکترهای مبهم */
export function generateInviteCode(): string {
  let code = ''
  for (let index = 0; index < 6; index += 1) {
    code += INVITE_ALPHABET.charAt(Math.floor(Math.random() * INVITE_ALPHABET.length))
  }
  return code
}
