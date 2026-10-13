/**
 * حساب‌های نمایشی که با `pnpm db:seed` ساخته می‌شوند؛ ورود با OTP است.
 * وقتی کلید کاوه‌نگار تنظیم نشده باشد، کد ثابت توسعه (`OTP_DEV_CODE`) همیشه ۱۱۱۱ است.
 */
export const DEMO_OTP_CODE = '1111'

export const DEMO_ACCOUNTS = [
  { label: 'مدیر ساختمان — رضا احمدی', phone: '09121112233' },
  { label: 'ساکن — سارا محمدی', phone: '09123456789' },
  { label: 'مدیریت کل — نگار توکلی', phone: '09120000000' },
] as const
