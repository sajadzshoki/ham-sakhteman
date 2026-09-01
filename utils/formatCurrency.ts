export const fmtToman = (n: number): string => {
  const s = Math.round(n).toLocaleString('fa-IR')
  return s + ' تومان'
}
