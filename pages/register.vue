<script setup lang="ts">
const { t } = useI18n()
const auth = useAuth()
const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')

const submit = async () => {
  error.value = ''
  if (password.value !== confirm.value) { error.value = 'رمزها یکسان نیستند'; return }
  if (password.value.length < 4) { error.value = 'رمز حداقل ۴ کاراکتر'; return }
  loading.value = true
  const res = await auth.register(name.value, email.value, password.value)
  loading.value = false
  if (res.ok) {
    navigateTo('/buildings')
  } else {
    error.value = res.message || 'تأیید ثبت‌نام ناموفق'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 to-teal-50/30 flex items-center justify-center px-6 py-12" dir="rtl">
    <AppCard padding="lg" class="w-full max-w-md shadow-soft-lg">
      <div class="text-center mb-6">
        <span class="w-14 h-14 rounded-3xl bg-gradient-to-br from-primary-500 to-teal-600 text-white flex items-center justify-center shadow-soft-lg mx-auto mb-3">
          <Icon name="i-lucide-user-plus" class="w-7 h-7" />
        </span>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">{{ t('auth.register') }}</h1>
        <p class="text-sm text-slate-400 font-medium mt-1">ایجاد حساب مدیر ساختمان</p>
      </div>

      <form @submit.prevent="submit" class="flex flex-col gap-3">
        <AppInput v-model="name" label="نام" placeholder="نام کامل" />
        <AppInput v-model="email" label="ایمیل" placeholder="name@example.com" type="email" />
        <AppInput v-model="password" label="رمز عبور" type="password" placeholder="••••••••" />
        <AppInput v-model="confirm" label="تأیید رمز عبور" type="password" placeholder="••••••••" />
        <p v-if="error" class="text-xs text-rose-500 font-bold">{{ error }}</p>
        <button type="submit" :disabled="loading" class="h-12 rounded-xl bg-gradient-to-br from-primary-500 to-teal-600 text-white font-extrabold shadow-soft hover:shadow-soft-lg transition-all text-base disabled:opacity-60">{{ loading ? 'در حال ثبت...' : 'ثبت‌نام' }}</button>
      </form>

      <div class="mt-5 pt-5 border-t border-slate-100 text-center">
        <NuxtLink to="/login" class="text-sm font-extrabold text-primary-600 hover:text-primary-700">{{ t('auth.login') }}</NuxtLink>
      </div>
    </AppCard>
  </div>
</template>
