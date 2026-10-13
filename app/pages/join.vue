<script setup lang="ts">
import type { Building } from '~/types'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const store = useAppStore()

useSeoMeta({ title: 'پیوستن به ساختمان', ogTitle: 'پیوستن به ساختمان' })

const code = ref(typeof route.query.code === 'string' ? route.query.code.toUpperCase() : '')
const codeError = ref('')
const joinError = ref('')
const joinedBuilding = ref<Building | null>(null)

const existingBuilding = computed(() => store.buildingOfUser(user.value))

const joining = ref(false)

/** کد دعوت در همین مرحله سمت سرور بررسی و مصرف می‌شود (پیش‌نمایش جدا وجود ندارد) */
async function join() {
  if (joining.value) return
  codeError.value = ''
  joinError.value = ''

  const normalized = normalizeInviteCode(code.value)
  if (normalized.length !== 6) {
    codeError.value = 'کد دعوت ۶ کاراکتری را وارد کنید.'
    return
  }

  joining.value = true
  try {
    joinedBuilding.value = await store.joinWithInvitation(normalized)
  }
  catch (error) {
    joinError.value = apiErrorMessage(error, 'پیوستن انجام نشد. دوباره تلاش کنید.')
  }
  finally {
    joining.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-4">
    <PageHeader
      title="پیوستن به ساختمان"
      description="کد دعوتی را که مدیر ساختمان برای شما فرستاده وارد کنید"
    />

    <!-- حالت موفقیت -->
    <AppCard v-if="joinedBuilding" as="section">
      <div class="flex flex-col items-center gap-2 py-4 text-center">
        <span class="flex size-14 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300">
          <Icon name="i-lucide-circle-check" class="size-7" />
        </span>
        <h2 class="text-base font-extrabold text-slate-900 dark:text-white">
          به «{{ joinedBuilding.name }}» پیوستید 🎉
        </h2>
        <p class="text-xs leading-5 text-slate-500 dark:text-slate-400">
          از این پس اطلاعیه‌ها، شارژ و خدمات این ساختمان را در اپ می‌بینید.
        </p>
        <UButton color="primary" variant="solid" size="lg" block class="mt-2" label="ورود به ساختمان" icon="i-lucide-arrow-left" @click="router.push('/building')" />
      </div>
    </AppCard>

    <!-- کاربر از قبل عضو ساختمانی است -->
    <AppCard v-else-if="existingBuilding" as="section">
      <div class="flex items-center gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300">
          <Icon name="i-lucide-building-2" class="size-5" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold text-slate-800 dark:text-slate-100">شما عضو «{{ existingBuilding.name }}» هستید</p>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">برای پیوستن به ساختمان دیگر، کد دعوت را وارد کنید.</p>
        </div>
        <UButton color="neutral" variant="soft" size="sm" label="ساختمان من" @click="router.push('/building')" />
      </div>
    </AppCard>

    <!-- ورود کد -->
    <AppCard v-if="!joinedBuilding" as="section">
      <form class="space-y-4" novalidate @submit.prevent="join">
        <BaseTextField
          v-model="code"
          label="کد دعوت"
          required
          dir="ltr"
          icon="i-lucide-ticket"
          placeholder="K7X2M9"
          :error="codeError"
          hint="کد ۶ کاراکتری از مدیر ساختمان"
          @update:model-value="codeError = ''; joinError = ''"
        />

        <p v-if="joinError" class="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-400/10 dark:text-red-400">
          {{ joinError }}
        </p>

        <UButton type="submit" color="primary" variant="solid" size="lg" block label="پیوستن به ساختمان" icon="i-lucide-log-in" :loading="joining" />
      </form>
    </AppCard>
  </div>
</template>
