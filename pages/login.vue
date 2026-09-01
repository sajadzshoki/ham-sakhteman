<script setup lang="ts">
const { t } = useI18n()
const auth = useAuth()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const submit = async () => {
  error.value = ''
  loading.value = true
  const res = await auth.login(email.value, password.value)
  loading.value = false
  if (res.ok) {
    navigateTo('/buildings')
  } else {
    error.value = res.message || 'ورود ناموفق بود'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 to-teal-50/30 flex items-center justify-center px-6 py-12" dir="rtl">
    <AppCard padding="lg" class="w-full max-w-md shadow-soft-lg">
      <div class="text-center mb-6">
        <span class="w-14 h-14 rounded-3xl bg-gradient-to-br from-primary-500 to-teal-600 text-white flex items-center justify-center shadow-soft-lg mx-auto mb-3">
          <Icon name="i-lucide-building-2" class="w-7 h-7" />
        </span>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">{{ t('auth.login') }}</h1>
        <p class="text-sm text-slate-400 font-medium mt-1">هم‌ساختمان — مدیریت ساختمان</p>
      </div>

      <form @submit.prevent="submit" class="flex flex-col gap-3">
        <AppInput v-model="email" label="ایمیل" placeholder="name@example.com" type="email" />
        <AppInput v-model="password" label="رمز عبور" type="password" placeholder="••••••••" />
        <p v-if="error" class="text-xs text-rose-500 font-bold">{{ error }}</p>
        <button type="submit" :disabled="loading" class="h-12 rounded-xl bg-gradient-to-br from-primary-500 to-teal-600 text-white font-extrabold shadow-soft hover:shadow-soft-lg transition-all text-base disabled:opacity-60">{{ loading ? 'در حال ورود...' : 'ورود' }}</button>
      </form>

      <div class="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between">
        <NuxtLink to="/register" class="text-sm font-extrabold text-primary-600 hover:text-primary-700">{{ t('auth.register') }}</NuxtLink>
        <button onclick="document.documentElement.classList.toggle('dark')" class="text-xs text-slate-400 font-medium">تغییر تم</button>
      </div>
    </AppCard>
  </div>
</template>
