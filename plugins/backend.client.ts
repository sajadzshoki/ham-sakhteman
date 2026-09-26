import { useAppData } from '../composables/useAppData'

export default defineNuxtPlugin(async () => {
  await useAppData().boot()
})
