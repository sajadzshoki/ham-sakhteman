import type { ChargeStatus } from '../types'

/**
 * وضعیت شارژ برای یک عضو: پرداخت‌شده، در انتظار، یا معوق (سررسید گذشته و پرداخت‌نشده).
 */
export function deriveChargeStatus(input: { dueAt: string | Date, paid: boolean, now?: Date }): ChargeStatus {
  if (input.paid) return 'paid'
  const due = input.dueAt instanceof Date ? input.dueAt : new Date(input.dueAt)
  const now = input.now ?? new Date()
  return due.getTime() < now.getTime() ? 'overdue' : 'unpaid'
}
