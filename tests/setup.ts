import { loadEnvFile } from '../server/utils/env'

loadEnvFile()

// تست‌ها هرگز با DATABASE_URL اصلی کار نمی‌کنند؛ فقط TEST_DATABASE_URL (و آن هم محلی)
const testUrl = process.env.TEST_DATABASE_URL
if (testUrl) {
  const host = new URL(testUrl).hostname
  if (!['localhost', '127.0.0.1', '::1', 'postgres'].includes(host)) {
    throw new Error(`TEST_DATABASE_URL must point to a local database (got host "${host}")`)
  }
  process.env.DATABASE_URL = testUrl
} else {
  delete process.env.DATABASE_URL
}

process.env.SESSION_SECRET ||= 'test-session-secret'
// تست‌ها باید در حالت توسعه (بدون ارسال پیامک واقعی) اجرا شوند
delete process.env.KAVENEGAR_API_KEY
delete process.env.OTP_DEV_CODE
