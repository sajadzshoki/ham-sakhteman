/** تولید شناسه ساده برای کلیدهای محلی (مثلاً تصاویر ذخیره‌شده در مرورگر) */
export function createId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** اعتبار شماره موبایل ایران؛ ارقام فارسی و عربی هم پذیرفته می‌شوند (منطق مشترک با سرور: `shared/utils/phone`) */
export function isValidPhone(phone: string): boolean {
  return normalizePhone(phone) !== null
}

/** کد دعوت را برای مقایسه یکدست می‌کند (ارقام فارسی، فاصله و حروف کوچک) */
export function normalizeInviteCode(code: string): string {
  return toLatinDigits(code).replace(/[^0-9a-z]/gi, '').toUpperCase()
}
