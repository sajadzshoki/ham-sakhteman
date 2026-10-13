import type { ApiOptions } from '~/utils/api'

/**
 * `api()` با fetch درخواست جاری. در SSR باید کوکی نشست کاربر به درخواست‌های داخلی
 * `/api/*` منتقل شود؛ `useRequestFetch()` همین کار را می‌کند. در کلاینت $fetch ساده است.
 * باید هم‌زمان با ساخت composable (در context نوکست) صدا زده شود.
 */
export function useApi() {
  const fetcher = import.meta.server ? useRequestFetch() as typeof $fetch : undefined
  return <T>(url: string, options: Omit<ApiOptions, 'fetcher'> = {}) => api<T>(url, { ...options, fetcher })
}
