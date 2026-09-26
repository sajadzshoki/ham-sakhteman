import { loadEnvFile } from '../server/utils/env'

loadEnvFile()
process.env.SESSION_SECRET ||= 'test-session-secret'
process.env.APP_BASE_URL ||= 'http://localhost:3000'
process.env.SESSION_TTL_DAYS ||= '14'
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL

const url = process.env.DATABASE_URL || ''
if (!url) {
  throw new Error('Set DATABASE_URL or TEST_DATABASE_URL before running tests')
}
if (!/localhost|127\.0\.0\.1/.test(url)) {
  throw new Error('Refusing to run tests against a non-local database')
}
