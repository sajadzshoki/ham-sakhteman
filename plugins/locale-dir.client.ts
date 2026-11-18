export default defineNuxtPlugin(() => {
  const { locale } = useI18n()

  const apply = (code: string) => {
    const dir = code === 'fa' ? 'rtl' : 'ltr'
    const lang = code === 'fa' ? 'fa' : 'en'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', lang)
    document.body.setAttribute('dir', dir)
    document.body.style.direction = dir
  }

  apply(locale.value)
  watch(locale, (value) => apply(value))
})
