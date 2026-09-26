import { sql } from 'drizzle-orm'
import { getDb } from './client'

export async function resetDatabase() {
  await getDb().execute(sql`
    TRUNCATE TABLE
      notifications,
      expenses,
      charges,
      problem_reports,
      announcements,
      invitations,
      building_members,
      building_units,
      buildings,
      sessions,
      service_providers,
      users
    RESTART IDENTITY CASCADE
  `)
}
