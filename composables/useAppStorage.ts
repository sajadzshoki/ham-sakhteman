export const useAppStorage = () => {
  const get = <T = any>(key: string, defaultValue?: T): T | undefined => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const val = localStorage.getItem(key)
      return val ? JSON.parse(val) : defaultValue
    } catch { return defaultValue }
  }
  const set = (key: string, value: any) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, JSON.stringify(value))
  }
  return { get, set }
}
