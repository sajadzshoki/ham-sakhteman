<script setup lang="ts">
import type { BuildingRole } from '~/types'

definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const router = useRouter()
const { requestOtp, verifyOtp, redirectAfterAuth } = useAuth()

useSeoMeta({ title: 'ثبت‌نام', ogTitle: 'ثبت‌نام' })

const roleOptions: { id: BuildingRole, title: string, description: string, icon: string }[] = [
  {
    id: 'manager',
    title: 'مدیر ساختمان',
    description: 'ساختمان می‌سازم و واحدها و ساکنین را مدیریت می‌کنم',
    icon: 'i-lucide-shield',
  },
  {
    id: 'resident',
    title: 'ساکن',
    description: 'در ساختمانی زندگی می‌کنم و می‌خواهم به آن بپیوندم',
    icon: 'i-lucide-home',
  },
]

const step = ref<'details' | 'code'>('details')
const name = ref('')
const phone = ref('')
const role = ref<BuildingRole>('resident')

const nameError = ref('')
const phoneError = ref('')
const formError = ref('')
const alreadyRegistered = ref(false)
const devCode = ref<string | null>(null)

const sending = ref(false)
const verifying = ref(false)
const otpStep = ref<{ restartCooldown: () => void } | null>(null)

async function sendCode() {
  if (sending.value) return
  nameError.value = ''
  phoneError.value = ''
  formError.value = ''
  alreadyRegistered.value = false

  if (!name.value.trim()) {
    nameError.value = t('common.required')
    return
  }
  if (!isValidPhone(phone.value)) {
    phoneError.value = 'شماره موبایل معتبر نیست. (مثال: ۰۹۱۲۳۴۵۶۷۸۹)'
    return
  }

  sending.value = true
  try {
    const result = await requestOtp(phone.value, 'register')
    devCode.value = result.devCode ?? null
    phone.value = result.phone
    step.value = 'code'
    otpStep.value?.restartCooldown()
  }
  catch (error) {
    alreadyRegistered.value = error instanceof ApiRequestError && error.status === 409
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
    await verifyOtp({ phone: phone.value, code, name: name.value.trim(), role: role.value })
    await router.push(redirectAfterAuth())
  }
  catch (error) {
    formError.value = apiErrorMessage(error, 'تأیید کد انجام نشد. دوباره تلاش کنید.')
  }
  finally {
    verifying.value = false
  }
}

function backToDetails() {
  step.value = 'details'
  formError.value = ''
  devCode.value = null
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1 text-center">
      <h1 class="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">ایجاد حساب</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        {{ step === 'details' ? 'نقش خود را انتخاب کنید و در چند ثانیه شروع کنید' : 'کد تأیید پیامک‌شده را وارد کنید' }}
      </p>
    </div>

    <AppCard as="section">
      <form v-if="step === 'details'" class="space-y-4" novalidate @submit.prevent="sendCode">
        <!-- انتخاب نقش -->
        <fieldset>
          <legend class="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            نقش شما <span class="text-red-500">*</span>
          </legend>
          <div class="space-y-2">
            <label
              v-for="option in roleOptions"
              :key="option.id"
              class="flex cursor-pointer items-start gap-3 rounded-xl p-3.5 ring-1 transition-all"
              :class="
                role === option.id
                  ? 'bg-teal-50 ring-2 ring-teal-500 dark:bg-teal-400/10 dark:ring-teal-400'
                  : 'bg-white ring-slate-950/5 hover:bg-slate-50 dark:bg-slate-900 dark:ring-white/10 dark:hover:bg-slate-800/60'
              "
            >
              <input v-model="role" type="radio" name="role" :value="option.id" class="sr-only">
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-xl"
                :class="
                  role === option.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                "
              >
                <Icon :name="option.icon" class="size-4.5" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-bold text-slate-800 dark:text-slate-100">{{ option.title }}</span>
                <span class="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{{ option.description }}</span>
              </span>
              <Icon
                v-if="role === option.id"
                name="i-lucide-circle-check"
                class="ms-auto size-5 shrink-0 text-teal-600 dark:text-teal-300"
              />
            </label>
          </div>
        </fieldset>

        <BaseTextField
          v-model="name"
          label="نام و نام خانوادگی"
          required
          icon="i-lucide-user-round"
          placeholder="مثلاً: سارا محمدی"
          :error="nameError"
          @update:model-value="nameError = ''"
        />
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
          <NuxtLink v-if="alreadyRegistered" to="/auth/login" class="font-bold underline">ورود</NuxtLink>
        </p>

        <UButton type="submit" color="primary" variant="solid" size="lg" block :loading="sending" label="دریافت کد تأیید" />
      </form>

      <OtpStep
        v-else
        ref="otpStep"
        :phone="phone"
        :dev-code="devCode"
        :busy="verifying"
        :resending="sending"
        :error="formError"
        submit-label="ایجاد حساب"
        @verify="verify"
        @resend="sendCode"
        @back="backToDetails"
      />
    </AppCard>

    <p class="text-center text-xs text-slate-500 dark:text-slate-400">
      قبلاً ثبت‌نام کرده‌اید؟
      <NuxtLink to="/auth/login" class="font-bold text-teal-600 dark:text-teal-300">وارد شوید</NuxtLink>
    </p>
  </div>
</template>
