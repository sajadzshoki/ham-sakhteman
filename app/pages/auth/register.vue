<script setup lang="ts">
import type { BuildingRole } from '~/types'

definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const router = useRouter()
const { register, redirectAfterAuth } = useAuth()

useSeoMeta({ title: 'ثبت‌نام', ogTitle: 'ثبت‌نام' })

const roleOptions: { id: BuildingRole; title: string; description: string; icon: string }[] = [
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

const name = ref('')
const phone = ref('')
const password = ref('')
const role = ref<BuildingRole>('resident')

const nameError = ref('')
const phoneError = ref('')
const passwordError = ref('')
const formError = ref('')
const submitting = ref(false)

function submit() {
  if (submitting.value) return
  submitting.value = true
  nameError.value = ''
  phoneError.value = ''
  passwordError.value = ''
  formError.value = ''

  if (!name.value.trim()) {
    nameError.value = t('common.required')
    submitting.value = false
    return
  }
  if (!isValidPhone(phone.value)) {
    phoneError.value = 'شماره موبایل معتبر نیست. (مثال: ۰۹۱۲۳۴۵۶۷۸۹)'
    submitting.value = false
    return
  }
  if (password.value.length < 4) {
    passwordError.value = 'رمز عبور باید حداقل ۴ کاراکتر باشد.'
    submitting.value = false
    return
  }

  const result = register({
    name: name.value,
    phone: phone.value,
    password: password.value,
    role: role.value,
  })
  submitting.value = false

  if (!result.ok) {
    formError.value = 'این شماره موبایل قبلاً ثبت شده است. وارد شوید.'
    return
  }
  router.push(redirectAfterAuth())
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1 text-center">
      <h1 class="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">ایجاد حساب</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        نقش خود را انتخاب کنید و در چند ثانیه شروع کنید
      </p>
    </div>

    <AppCard as="section">
      <form class="space-y-4" @submit.prevent="submit">
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
          :error="phoneError"
          @update:model-value="phoneError = ''"
        />
        <BaseTextField
          v-model="password"
          label="رمز عبور"
          required
          type="password"
          icon="i-lucide-lock"
          hint="حداقل ۴ کاراکتر"
          :error="passwordError"
          @update:model-value="passwordError = ''"
        />

        <p v-if="formError" class="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-400/10 dark:text-red-400">
          {{ formError }}
          <NuxtLink to="/auth/login" class="font-bold underline">ورود</NuxtLink>
        </p>

        <UButton type="submit" color="primary" variant="solid" size="lg" block :loading="submitting" label="ایجاد حساب" />
      </form>
    </AppCard>

    <p class="text-center text-xs text-slate-500 dark:text-slate-400">
      قبلاً ثبت‌نام کرده‌اید؟
      <NuxtLink to="/auth/login" class="font-bold text-teal-600 dark:text-teal-300">وارد شوید</NuxtLink>
    </p>
  </div>
</template>
