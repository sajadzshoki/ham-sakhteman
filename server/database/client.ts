import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type Database = ReturnType<typeof drizzle<typeof schema>>

const globalForDb = globalThis as unknown as { hsSql?: ReturnType<typeof postgres>; hsDb?: Database }

export function getDb() {
  if (!globalForDb.hsDb) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error('DATABASE_URL is not set')
    }
    const sql = postgres(url, { max: 10 })
    globalForDb.hsSql = sql
    globalForDb.hsDb = drizzle(sql, { schema })
  }
  return globalForDb.hsDb
}

export async function closeDb() {
  await globalForDb.hsSql?.end({ timeout: 5 })
  globalForDb.hsSql = undefined
  globalForDb.hsDb = undefined
}

export type AppDatabase = Database
