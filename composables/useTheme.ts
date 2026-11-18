type ThemeMode = 'light' | 'dark'

const THEME_KEY = 'hs-theme'

export const useTheme = () => {
  const mode = useState<ThemeMode>('app-theme', () => 'light')

  const apply = (value: ThemeMode) => {
    mode.value = value
    if (!import.meta.client) return
    document.documentElement.classList.toggle('dark', value === 'dark')
    document.documentElement.dataset.theme = value
    localStorage.setItem(THEME_KEY, value)
  }

  const init = () => {
    if (!import.meta.client) return
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'dark' || stored === 'light') {
      apply(stored)
      return
    }
    apply('light')
  }

  const toggle = () => {
    apply(mode.value === 'dark' ? 'light' : 'dark')
  }

  return {
    mode,
    isDark: computed(() => mode.value === 'dark'),
    init,
    apply,
    toggle,
  }
}
