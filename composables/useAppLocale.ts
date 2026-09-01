export const useAppLocale = () => {
  const { locale, t, setLocale } = useI18n()
  const isFa = computed(() => locale.value === 'fa')

  const switchLocale = async (code: 'fa' | 'en') => {
    await setLocale(code)
  }

  return { locale, isFa, switchLocale, t }
}
