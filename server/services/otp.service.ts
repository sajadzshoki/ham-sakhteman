import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import type { OtpRequestResult, User } from '../../shared/types'
import { otpRequestSchema, otpVerifySchema } from '../../shared/schemas'
import { getDb } from '../database/client'
import { otpCodes, users } from '../database/schema'
import { findUserByPhone } from '../repositories/lookup.repo'
import { ApiError, isUniqueViolation } from '../utils/errors'
import { kavenegarApiKey, otpDevCode, otpTtlSeconds, requireSessionSecret } from '../utils/env'
import { consumeRateLimit } from '../utils/rate-limit'
import { presentUser } from '../utils/present'
import { insertSession } from '../utils/session'
import { initials } from '../utils/text'
import { parseSchema } from '../utils/validate'
import { isKavenegarConfigured, sendKavenegarSms } from './sms/kavenegar'

export const OTP_MAX_ATTEMPTS = 5

function hashCode(phone: string, code: string) {
  return createHmac('sha256', requireSessionSecret()).update(`otp:${phone}:${code}`).digest('hex')
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function generateCode() {
  return String(randomInt(1000, 10000))
}

/** وقتی کلید Kavenegar تنظیم نشده، همیشه کد ثابت توسعه معتبر است. */
function devBypass(code: string) {
  return !kavenegarApiKey() && code === otpDevCode()
}

export async function requestOtp(input: unknown): Promise<OtpRequestResult> {
  const data = parseSchema(otpRequestSchema, input)
  // محدودیت ملایم: ۵ درخواست برای هر شماره در ۱۰ دقیقه
  consumeRateLimit(`otp:request:${data.phone}`, 5, 10 * 60_000)

  const existing = await findUserByPhone(data.phone)
  if (data.purpose === 'login' && !existing) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'حسابی با این شماره پیدا نشد. ابتدا ثبت‌نام کنید.')
  }
  if (data.purpose === 'register' && existing) {
    throw new ApiError(409, 'CONFLICT', 'این شماره قبلاً ثبت‌نام کرده است. وارد شوید.')
  }

  const live = isKavenegarConfigured()
  const code = live ? generateCode() : otpDevCode()
  const ttl = otpTtlSeconds()
  const id = randomUUID()

  await getDb().transaction(async (tx) => {
    await tx.delete(otpCodes).where(eq(otpCodes.phone, data.phone))
    await tx.insert(otpCodes).values({
      id,
      phone: data.phone,
      codeHash: hashCode(data.phone, code),
      expiresAt: new Date(Date.now() + ttl * 1000),
    })
  })

  if (live) {
    try {
      await sendKavenegarSms(data.phone, `کد ورود هم‌ساختمان: ${code}`)
    } catch (error) {
      await getDb().delete(otpCodes).where(eq(otpCodes.id, id))
      throw error
    }
  }

  return { phone: data.phone, expiresIn: ttl, ...(live ? {} : { devCode: code }) }
}

export async function verifyOtp(input: unknown): Promise<{ user: User, token: string }> {
  const data = parseSchema(otpVerifySchema, input)
  consumeRateLimit(`otp:verify:${data.phone}`, 15, 10 * 60_000)
  const db = getDb()

  const bypass = devBypass(data.code)
  if (!bypass) {
    const [otp] = await db.select().from(otpCodes).where(and(
      eq(otpCodes.phone, data.phone),
      gt(otpCodes.expiresAt, new Date()),
    )).limit(1)
    if (!otp) throw new ApiError(400, 'OTP_INVALID', 'کد تأیید نامعتبر یا منقضی شده است')
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      await db.delete(otpCodes).where(eq(otpCodes.id, otp.id))
      throw new ApiError(429, 'OTP_LOCKED', 'تعداد تلاش‌ها بیش از حد مجاز است. کد جدید دریافت کنید.')
    }
    if (!safeEqual(otp.codeHash, hashCode(data.phone, data.code))) {
      await db.update(otpCodes).set({ attempts: otp.attempts + 1 }).where(eq(otpCodes.id, otp.id))
      throw new ApiError(400, 'OTP_INVALID', 'کد تأیید نادرست است')
    }
  }

  await db.delete(otpCodes).where(eq(otpCodes.phone, data.phone))

  let row = await findUserByPhone(data.phone)
  if (!row) {
    if (!data.name) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'حسابی با این شماره پیدا نشد. ابتدا ثبت‌نام کنید.')
    }
    try {
      const [created] = await db.insert(users).values({
        id: randomUUID(),
        name: data.name,
        phone: data.phone,
        // نقش سوپرادمین هرگز از کلاینت پذیرفته نمی‌شود
        role: data.role ?? 'manager',
        avatarInitials: initials(data.name),
      }).returning()
      row = created ?? null
    } catch (error) {
      if (isUniqueViolation(error)) throw new ApiError(409, 'CONFLICT', 'این شماره قبلاً ثبت‌نام کرده است')
      throw error
    }
    if (!row) throw new ApiError(500, 'INTERNAL', 'خطای داخلی سرور')
  }

  const token = await insertSession(row.id)
  return { user: presentUser(row), token }
}
