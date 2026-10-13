/**
 * قرارداد داده‌ی UI همان قرارداد API است (`shared/types`)؛
 * اینجا فقط بازصادرکردن و چند نوع مخصوص اپ نگهداری می‌شود.
 */
import type { User } from '#shared/types'

export type * from '#shared/types'

// ——— احراز هویت ———

/** ورود فقط با کد یک‌بارمصرف پیامکی (OTP) انجام می‌شود */
export type AuthMethod = 'otp'

/** کاربر وارد‌شده؛ رمز عبوری وجود ندارد و نشست در کوکی HttpOnly سمت سرور است */
export type AuthUser = User

// ——— ناوبری ———

export interface NavItem {
  /** کلید ترجمه برای عنوان */
  labelKey: string
  to: string
  icon: string
}
