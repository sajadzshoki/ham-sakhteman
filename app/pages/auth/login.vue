<script setup lang="ts">
import { DEMO_ACCOUNTS, DEMO_OTP_CODE } from '~/data/demo'

definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const router = useRouter()
const { requestOtp, verifyOtp, redirectAfterAuth } = useAuth()

useSeoMeta({ title: 'ورود', ogTitle: 'ورود' })

const step = ref<'phone' | 'code'>('phone')
const phone = ref('')
const phoneError = ref('')
const formError = ref('')
const notFound = ref(false)
const devCode = ref<string | null>(null)

const sending = ref(false)
const verifying = ref(false)
const otpStep = ref<{ restartCooldown: () => void } | null>(null)

async function sendCode() {
  if (sending.value) return
  phoneError.value = ''
  formError.value = ''
  notFound.value = false

  if (!phone.value.trim()) {
    phoneError.value = t('common.required')
    return
  }
  if (!isValidPhone(phone.value)) {
    phoneError.value = 'شماره موبایل معتبر نیست. (مثال: ۰۹۱۲۳۴۵۶۷۸۹)'
    return
  }

  sending.value = true
  try {
    const result = await requestOtp(phone.value, 'login')
    devCode.value = result.devCode ?? null
    phone.value = result.phone
    step.value = 'code'
    otpStep.value?.restartCooldown()
  }
  catch (error) {
    notFound.value = error instanceof ApiRequestError && error.code === 'USER_NOT_FOUND'
    formError.value = apiErrorMessage(error, 'ارسال کد انجام نشد. دوباره تلاش کنید.')
  }
  finally {
    sending.value = false
  }
}

async function verify(code: string) {
  if (verifying.value) return
  verifying.value = true
  formError.value = ''
  try {
    await verifyOtp({ phone: phone.value, code })
    await router.push(redirectAfterAuth())
  }
  catch (error) {
    formError.value = apiErrorMessage(error, 'تأیید کد انجام نشد. دوباره تلاش کنید.')
  }
  finally {
    verifying.value = false
  }
}

function backToPhone() {
  step.value = 'phone'
  formError.value = ''
  devCode.value = null
}

function fillDemo(index: number) {
  const account = DEMO_ACCOUNTS[index]
  if (!account) return
  backToPhone()
  phone.value = account.phone
  phoneError.value = ''
  notFound.value = false
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
      <!-- مرحله ۱: شماره موبایل -->
      <form v-if="step === 'phone'" class="space-y-4" novalidate @submit.prevent="sendCode">
        <BaseTextField
          v-model="phone"
          label="شماره موبایل"
          required
          type="tel"
          dir="ltr"
          icon="i-lucide-smartphone"
          placeholder="09123456789"
          hint="کد تأیید برای شما پیامک می‌شود"
          :error="phoneError"
          @update:model-value="phoneError = ''"
        />

        <p v-if="formError" class="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-400/10 dark:text-red-400">
          {{ formError }}
          <NuxtLink v-if="notFound" to="/auth/register" class="font-bold underline">ثبت‌نام</NuxtLink>
        </p>

        <UButton type="submit" color="primary" variant="solid" size="lg" block :loading="sending" label="دریافت کد تأیید" />
      </form>

      <!-- مرحله ۲: کد تأیید -->
      <OtpStep
        v-else
        ref="otpStep"
        :phone="phone"
        :dev-code="devCode"
        :busy="verifying"
        :resending="sending"
        :error="formError"
        submit-label="ورود"
        @verify="verify"
        @resend="sendCode"
        @back="backToPhone"
      />
    </AppCard>

    <!-- حساب‌های دمو -->
    <AppCard v-if="step === 'phone'">
      <p class="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
        <Icon name="i-lucide-badge-check" class="size-3.5" />
        شماره‌های نمایشی — بدون کلید پیامک، کد ورود {{ toPersianDigits(DEMO_OTP_CODE) }} است
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
