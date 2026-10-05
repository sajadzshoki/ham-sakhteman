<script setup lang="ts">
import type { AuthMethod } from '~/types'
import { AUTH_METHODS } from '~/composables/useAuth'
import { DEMO_ACCOUNTS } from '~/data/seed'

definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const router = useRouter()
const { login, redirectAfterAuth } = useAuth()

useSeoMeta({ title: 'ورود', ogTitle: 'ورود' })

const method = ref<AuthMethod>('password')
const phone = ref('')
const password = ref('')
const phoneError = ref('')
const passwordError = ref('')
const formError = ref('')
const submitting = ref(false)

function selectMethod(next: AuthMethod) {
  method.value = next
  formError.value = ''
}

function submit() {
  if (submitting.value) return
  submitting.value = true
  phoneError.value = ''
  passwordError.value = ''
  formError.value = ''

  if (!isValidPhone(phone.value)) {
    phoneError.value = 'شماره موبایل معتبر نیست. (مثال: ۰۹۱۲۳۴۵۶۷۸۹)'
    submitting.value = false
    return
  }
  if (!password.value) {
    passwordError.value = t('common.required')
    submitting.value = false
    return
  }

  const result = login(phone.value, password.value)
  submitting.value = false

  if (!result.ok) {
    formError.value = 'شماره موبایل یا رمز عبور اشتباه است.'
    return
  }
  router.push(redirectAfterAuth())
}

function fillDemo(index: number) {
  const account = DEMO_ACCOUNTS[index]
  if (!account) return
  phone.value = account.phone
  password.value = account.password
  formError.value = ''
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1 text-center">
      <h1 class="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">ورود به حساب</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        مدیریت شارژ، اطلاعیه‌ها و خدمات ساختمان شما
      </p>
    </div>

    <AppCard as="section">
      <!-- انتخاب روش ورود -->
      <div class="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60">
        <button
          v-for="item in AUTH_METHODS"
          :key="item.id"
          type="button"
          class="rounded-lg py-2 text-xs font-bold transition-colors"
          :class="
            method === item.id
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 dark:text-slate-400'
          "
          @click="selectMethod(item.id)"
        >
          {{ item.label }}
        </button>
      </div>

      <form v-if="method === 'password'" class="space-y-4" @submit.prevent="submit">
        <BaseTextField
          v-model="phone"
          label="شماره موبایل"
          required
          type="tel"
          dir="ltr"
          icon="i-lucide-smartphone"
          placeholder="09123456789"
          :error="phoneError"
          @update:model-value="phoneError = ''"
        />
        <BaseTextField
          v-model="password"
          label="رمز عبور"
          required
          type="password"
          icon="i-lucide-lock"
          placeholder="••••"
          :error="passwordError"
          @update:model-value="passwordError = ''"
        />

        <p v-if="formError" class="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-400/10 dark:text-red-400">
          {{ formError }}
        </p>

        <UButton type="submit" color="primary" variant="solid" size="lg" block :loading="submitting" label="ورود" />
      </form>

      <div v-else class="flex items-start gap-2.5 rounded-xl bg-sky-50 p-3.5 dark:bg-sky-400/10">
        <Icon name="i-lucide-info" class="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-300" />
        <p class="text-xs leading-5 text-slate-600 dark:text-slate-300">
          ورود با کد یک‌بارمصرف به‌زودی فعال می‌شود. در نسخه نمایشی لطفاً از روش
          <button type="button" class="font-bold text-teal-600 dark:text-teal-300" @click="selectMethod('password')">رمز عبور</button>
          استفاده کنید.
        </p>
      </div>
    </AppCard>

    <!-- حساب‌های دمو -->
    <AppCard>
      <p class="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
        <Icon name="i-lucide-badge-check" class="size-3.5" />
        ورود سریع با حساب‌های نمایشی (رمز: ۱۲۳۴)
      </p>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="(account, index) in DEMO_ACCOUNTS"
          :key="account.phone"
          type="button"
          class="rounded-xl bg-slate-50 px-2 py-2.5 text-[11px] leading-4 font-bold text-slate-600 ring-1 ring-slate-950/5 transition-colors hover:bg-teal-50 hover:text-teal-700 active:scale-[0.98] dark:bg-slate-800/50 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-teal-400/10 dark:hover:text-teal-300"
          :class="index === DEMO_ACCOUNTS.length - 1 && DEMO_ACCOUNTS.length % 2 === 1 && 'col-span-2'"
          @click="fillDemo(index)"
        >
          {{ account.label }}
        </button>
      </div>
    </AppCard>

    <p class="text-center text-xs text-slate-500 dark:text-slate-400">
      حساب کاربری ندارید؟
      <NuxtLink to="/auth/register" class="font-bold text-teal-600 dark:text-teal-300">ثبت‌نام کنید</NuxtLink>
    </p>
  </div>
</template>
