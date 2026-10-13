import { ApiError } from './errors'

const buckets = new Map<string, { count: number, reset: number }>()

export function resetRateLimits() {
  buckets.clear()
}

/** محدودیت ساده‌ی درون‌حافظه‌ای؛ برای چند نمونه‌ی سرور به ذخیره‌ساز مشترک نیاز است. */
export function consumeRateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now()
  const current = buckets.get(key)
  if (!current || current.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return
  }
  current.count += 1
  if (current.count > limit) {
    throw new ApiError(429, 'RATE_LIMITED', 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.')
  }
}
