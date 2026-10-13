const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
const arabicDigits = '٠١٢٣٤٥٦٧٨٩'

/** ارقام فارسی و عربی را به لاتین تبدیل می‌کند */
export function toLatinDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (char) => {
    const persian = persianDigits.indexOf(char)
    if (persian >= 0) return String(persian)
    return String(arabicDigits.indexOf(char))
  })
}

/**
 * موبایل ایرانی را به شکل 09xxxxxxxxx نرمال می‌کند؛ در صورت نامعتبر بودن null برمی‌گرداند.
 * - فقط ارقام (ارقام فارسی/عربی هم پذیرفته می‌شود)
 * - 98xxxxxxxxxx (و 0098...) ← 0xxxxxxxxxx
 * - 9xxxxxxxxx ← 09xxxxxxxxx
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null
  let digits = toLatinDigits(String(input)).replace(/\D/g, '')
  if (digits.startsWith('0098')) digits = digits.slice(2)
  if (digits.startsWith('98') && digits.length === 12) digits = `0${digits.slice(2)}`
  else if (digits.startsWith('9') && digits.length === 10) digits = `0${digits}`
  return /^09\d{9}$/.test(digits) ? digits : null
}
