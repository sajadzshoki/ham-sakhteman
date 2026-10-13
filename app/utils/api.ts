/**
 * کلاینت API — پاسخ‌های سرور با پوشش `{ success, data }` یا `{ success: false, error }` می‌آیند.
 * `api<T>()` داده را باز می‌کند و در خطا یک `ApiRequestError` با پیام فارسی می‌اندازد.
 * کوکی نشست (`hs_session`) HttpOnly و هم‌مبدأ است؛ مرورگر خودش آن را می‌فرستد.
 */

interface ApiEnvelopeError {
  code?: string
  message?: string
  details?: { fieldErrors?: Record<string, string[]> } & Record<string, unknown>
}

interface ApiEnvelope<T> {
  success?: boolean
  data?: T
  error?: ApiEnvelopeError
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: Record<string, unknown> | unknown[] | null
  query?: Record<string, string | number | boolean | undefined | null>
  /** در SSR باید fetch درخواست جاری (با کوکی‌ها) داده شود؛ `useApi()` این را پر می‌کند */
  fetcher?: typeof $fetch
}

/** خطای API با کد، وضعیت HTTP و پیام آماده‌ی نمایش به کاربر */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public fieldErrors: Record<string, string[]> = {},
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

const NETWORK_MESSAGE = 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.'
const GENERIC_MESSAGE = 'خطایی رخ داد. دوباره تلاش کنید.'

const STATUS_MESSAGES: Record<number, string> = {
  401: 'برای ادامه وارد شوید.',
  403: 'به این بخش دسترسی ندارید.',
  404: 'مورد درخواستی پیدا نشد.',
  409: 'این مورد قبلاً ثبت شده است.',
  429: 'تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.',
  500: 'خطای داخلی سرور. کمی بعد دوباره تلاش کنید.',
}

function toError(status: number, payload: unknown): ApiRequestError {
  const error = (payload as ApiEnvelope<unknown> | null | undefined)?.error
  const message = error?.message || STATUS_MESSAGES[status] || GENERIC_MESSAGE
  return new ApiRequestError(message, status, error?.code ?? 'UNKNOWN', error?.details?.fieldErrors ?? {})
}

/** پیام قابل‌نمایش از هر خطایی (برای toast و فرم‌ها) */
export function apiErrorMessage(error: unknown, fallback = GENERIC_MESSAGE): string {
  if (error instanceof ApiRequestError) return error.message
  return fallback
}

export async function api<T>(url: string, options: ApiOptions = {}): Promise<T> {
  const { fetcher = $fetch, ...rest } = options
  // نوع‌های مسیر‌محور $fetch برای URLهای پویا مزاحم‌اند؛ یک امضای ساده‌تر استفاده می‌کنیم
  const request = fetcher as unknown as (path: string, init: Record<string, unknown>) => Promise<ApiEnvelope<T>>
  let response: ApiEnvelope<T>
  try {
    response = await request(url, {
      method: rest.method ?? 'GET',
      body: rest.body ?? undefined,
      query: rest.query,
      credentials: 'same-origin',
    })
  }
  catch (caught) {
    const fetchError = caught as { status?: number, statusCode?: number, data?: unknown, response?: { status?: number, _data?: unknown } }
    const status = fetchError.status ?? fetchError.statusCode ?? fetchError.response?.status
    if (!status) throw new ApiRequestError(NETWORK_MESSAGE, 0, 'NETWORK')
    throw toError(status, fetchError.data ?? fetchError.response?._data)
  }

  // سرور برای خطا کد ۴xx/۵xx می‌دهد؛ اینجا فقط برای پوشش‌های `success: false` با ۲۰۰ محافظ می‌گذاریم
  if (!response || response.success === false) throw toError(200, response)
  return response.data as T
}
