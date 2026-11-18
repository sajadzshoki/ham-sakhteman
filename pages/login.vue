<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t, locale } = useI18n()
const auth = useAuth()
const theme = useTheme()
const route = useRoute()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const dir = computed(() => (locale.value === 'fa' ? 'rtl' : 'ltr'))

const submit = async () => {
  error.value = ''
  loading.value = true
  const res = await auth.login(email.value, password.value)
  loading.value = false
  if (res.ok) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/buildings'
    await navigateTo(redirect)
  } else {
    error.value = res.message || t('auth.loginFailed')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 to-teal-50/30 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-6 py-12" :dir="dir">
    <AppCard padding="lg" class="w-full max-w-md shadow-soft-lg">
      <div class="text-center mb-6">
        <span class="w-14 h-14 rounded-3xl bg-gradient-to-br from-primary-500 to-teal-600 text-white flex items-center justify-center shadow-soft-lg mx-auto mb-3">
          <Icon name="i-lucide-building-2" class="w-7 h-7" />
        </span>
        <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{{ t('auth.login') }}</h1>
        <p class="text-sm text-slate-400 font-medium mt-1">{{ t('auth.subtitle') }}</p>
      </div>

      <form class="flex flex-col gap-3" @submit.prevent="submit">
        <AppInput v-model="email" :label="t('auth.email')" placeholder="name@example.com" type="email" autocomplete="email" />
        <AppInput v-model="password" :label="t('auth.password')" type="password" placeholder="••••••••" autocomplete="current-password" />
        <p v-if="error" class="text-xs text-rose-500 font-bold" role="alert">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="h-12 rounded-xl bg-gradient-to-br from-primary-500 to-teal-600 text-white font-extrabold shadow-soft hover:shadow-soft-lg transition-all text-base disabled:opacity-60"
        >
          {{ loading ? t('auth.loggingIn') : t('auth.login') }}
        </button>
      </form>

      <div class="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <NuxtLink to="/register" class="text-sm font-extrabold text-primary-600 hover:text-primary-700">{{ t('auth.register') }}</NuxtLink>
        <button type="button" class="text-xs text-slate-400 font-medium inline-flex items-center gap-1.5" @click="theme.toggle()">
          <Icon :name="theme.isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="w-3.5 h-3.5" />
          {{ t('common.toggleTheme') }}
        </button>
      </div>
    </AppCard>
  </div>
</template>
