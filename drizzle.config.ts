import { defineConfig } from 'drizzle-kit'
import { loadEnvFile } from './server/utils/env'

loadEnvFile()

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ham_sakhteman',
  },
})
