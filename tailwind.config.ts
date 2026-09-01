import type { Config } from 'tailwindcss'

export default <Config>{
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './nuxt.config.{js,ts}',
    './node_modules/@nuxt/ui/dist/**/*.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        vazirmatn: ['Vazirmatn', 'system-ui', 'sans-serif'],
        sans: ['Vazirmatn', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        teal: {
          450: '#2db6a8',
        },
        slate: {
          850: '#1e293b',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -4px rgba(13,148,136,0.12), 0 1px 3px rgba(0,0,0,0.06)',
        'soft-lg': '0 10px 40px -10px rgba(13,148,136,0.18), 0 4px 8px rgba(0,0,0,0.04)',
        'inner-soft': 'inset 0 2px 6px rgba(13,148,136,0.06)',
      },
    },
  },
  plugins: [],
}
