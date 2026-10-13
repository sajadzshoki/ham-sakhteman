<script setup lang="ts">
/**
 * مرحله‌ی دوم ورود/ثبت‌نام: وارد کردن کد ۴ رقمی پیامکی.
 * در محیط توسعه (بدون کلید کاوه‌نگار) سرور `devCode` برمی‌گرداند و اینجا نمایش داده می‌شود.
 */
const props = withDefaults(
  defineProps<{
    phone: string
    devCode?: string | null
    busy?: boolean
    resending?: boolean
    error?: string
    submitLabel?: string
  }>(),
  {
    devCode: null,
    busy: false,
    resending: false,
    error: '',
    submitLabel: 'تأیید و ادامه',
  },
)

const emit = defineEmits<{
  verify: [code: string]
  resend: []
  back: []
}>()

const RESEND_SECONDS = 60

const code = ref('')
const codeError = ref('')
const cooldown = ref(RESEND_SECONDS)
let timer: ReturnType<typeof setInterval> | undefined

function startCooldown() {
  cooldown.value = RESEND_SECONDS
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    cooldown.value = Math.max(0, cooldown.value - 1)
    if (cooldown.value === 0 && timer) clearInterval(timer)
  }, 1000)
}

onMounted(startCooldown)
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

function submit() {
  const normalized = toLatinDigits(code.value).replace(/\D/g, '')
  if (normalized.length !== 4) {
    codeError.value = 'کد تأیید ۴ رقمی است.'
    return
  }
  codeError.value = ''
  emit('verify', normalized)
}

function resend() {
  if (cooldown.value > 0 || props.resending) return
  code.value = ''
  codeError.value = ''
  emit('resend')
}

defineExpose({ restartCooldown: startCooldown })
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="submit">
    <p class="text-xs leading-6 text-slate-500 dark:text-slate-400">
      کد تأیید به شماره
      <span dir="ltr" class="font-bold text-slate-700 dark:text-slate-200">{{ formatPhone(phone) }}</span>
      ارسال شد.
      <button type="button" class="font-bold text-teal-600 dark:text-teal-300" @click="emit('back')">ویرایش شماره</button>
    </p>

    <div
      v-if="devCode"
      class="flex items-start gap-2.5 rounded-xl bg-sky-50 p-3.5 dark:bg-sky-400/10"
    >
      <Icon name="i-lucide-info" class="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-300" />
      <p class="text-xs leading-5 text-slate-600 dark:text-slate-300">
        کد توسعه: <span dir="ltr" class="font-mono font-extrabold tracking-widest">{{ toPersianDigits(devCode) }}</span>
        — پیامک واقعی ارسال نشده است.
        <button type="button" class="font-bold text-teal-600 dark:text-teal-300" @click="code = devCode ?? ''">پر کردن خودکار</button>
      </p>
    </div>

    <BaseTextField
      v-model="code"
      label="کد تأیید"
      required
      dir="ltr"
      inputmode="numeric"
      icon="i-lucide-shield-check"
      placeholder="1111"
      :error="codeError"
      @update:model-value="codeError = ''"
    />

    <p v-if="error" class="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-400/10 dark:text-red-400">
      {{ error }}
    </p>

    <UButton type="submit" color="primary" variant="solid" size="lg" block :loading="busy" :label="submitLabel" />

    <p class="text-center text-xs text-slate-500 dark:text-slate-400">
      <template v-if="cooldown > 0">
        ارسال دوباره کد تا {{ toPersianDigits(cooldown) }} ثانیه دیگر
      </template>
      <button
        v-else
        type="button"
        class="font-bold text-teal-600 disabled:opacity-60 dark:text-teal-300"
        :disabled="resending"
        @click="resend"
      >
        ارسال دوباره کد
      </button>
    </p>
  </form>
</template>
