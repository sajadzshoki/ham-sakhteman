import { sql } from 'drizzle-orm'
import { getDb } from './client'

export async function resetDatabase() {
  await getDb().execute(sql`
    TRUNCATE TABLE
      notifications,
      building_trusted_providers,
      charge_payments,
      expenses,
      charges,
      problem_reports,
      announcements,
      invitations,
      building_members,
      building_units,
      buildings,
      otp_codes,
      sessions,
      service_providers,
      users
    RESTART IDENTITY CASCADE
  `)
}
