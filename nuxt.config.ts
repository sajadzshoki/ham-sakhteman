import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  ssr: false,

  app: {
    head: {
      title: 'هم‌ساختمان | مدیریت ساختمان',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover' },
        { name: 'description', content: 'اپلیکیشن مدیریت ساختمان هم‌ساختمان — ساده، امن و مدرن' },
        { name: 'theme-color', content: '#14b8a6' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap' },
      ],
      htmlAttrs: {
        lang: 'fa',
        dir: 'rtl',
      },
      bodyAttrs: {
        class: 'font-vazirmatn bg-slate-50 text-slate-900 antialiased',
      },
    },
    pageTransition: { name: 'fade', mode: 'out-in' },
  },

  modules: [
    '@nuxtjs/i18n',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
  ],

  i18n: {
    locales: [
      { code: 'fa', iso: 'fa-IR', name: 'فارسی', dir: 'rtl', file: 'fa.json' },
      { code: 'en', iso: 'en-US', name: 'English', dir: 'ltr', file: 'en.json' },
    ],
    defaultLocale: 'fa',
    strategy: 'prefix_except_default',
    lazy: true,
    langDir: 'locales/',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
  },

  tailwindcss: {
    viewer: false,
    configPath: './tailwind.config.ts',
    cssPath: '~/assets/css/main.css',
  },


  css: ['~/assets/css/main.css'],


  build: {
    transpile: ['vue-i18n'],
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },
})