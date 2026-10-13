import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    // تست‌های دیتابیسی روی یک پایگاه داده‌ی مشترک اجرا می‌شوند
    fileParallelism: false,
  },
})
