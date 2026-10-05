<script setup lang="ts">
import type { Building, Invitation } from '~/types'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const store = useAppStore()

useSeoMeta({ title: 'پیوستن به ساختمان', ogTitle: 'پیوستن به ساختمان' })

const code = ref(typeof route.query.code === 'string' ? route.query.code.toUpperCase() : '')
const codeError = ref('')
const joinError = ref('')

/** دعوت‌نامه پیدا شده برای پیش‌نمایش ساختمان */
const previewInvitation = ref<Invitation | null>(null)
const joinedBuilding = ref<Building | null>(null)

const existingMembership = computed(() => store.membershipOfUser(user.value))
const existingBuilding = computed(() => store.buildingOfUser(user.value))

const previewBuilding = computed(() =>
  previewInvitation.value ? store.buildingById(previewInvitation.value.buildingId) : null,
)

function checkCode() {
  codeError.value = ''
  joinError.value = ''
  previewInvitation.value = null

  if (normalizeInviteCode(code.value).length !== 6) {
    codeError.value = 'کد دعوت ۶ کاراکتری را وارد کنید.'
    return
  }

  const invitation = store.findInvitation(code.value)
  if (!invitation) {
    codeError.value = 'کد دعوت معتبر نیست. از مدیر ساختمان کد جدید بگیرید.'
    return
  }
  const status = store.invitationDisplayStatus(invitation)
  if (status === 'used') {
    codeError.value = 'این کد دعوت قبلاً استفاده شده است.'
    return
  }
  if (status === 'expired') {
    codeError.value = 'مهلت این کد دعوت تمام شده است. از مدیر ساختمان کد جدید بگیرید.'
    return
  }
  if (status !== 'active') {
    codeError.value = 'کد دعوت معتبر نیست. از مدیر ساختمان کد جدید بگیرید.'
    return
  }
  code.value = invitation.code
  previewInvitation.value = invitation
}

const joining = ref(false)

function join() {
  joinError.value = ''
  if (joining.value || !user.value || !previewInvitation.value) return
  joining.value = true

  const result = store.joinWithInvitation(previewInvitation.value.code, user.value)
  if (!result.ok) {
    joining.value = false
    const messages = {
      invalid: 'کد دعوت معتبر نیست.',
      used: 'این کد دعوت قبلاً استفاده شده است.',
      expired: 'مهلت این کد دعوت تمام شده است.',
      duplicate: 'شما در حال حاضر عضو یک ساختمان هستید.',
    } as const
    joinError.value = messages[result.error]
    return
  }

  joinedBuilding.value = result.building
  previewInvitation.value = null
}

// اگر از لینک دعوت آمده باشد، خودکار جستجو کن
if (normalizeInviteCode(code.value).length === 6 && !existingMembership.value) {
  checkCode()
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
    <AppCard v-else-if="existingBuilding && !previewInvitation" as="section">
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

    <template v-if="!joinedBuilding">
      <!-- ورود کد -->
      <AppCard as="section">
        <form class="space-y-4" @submit.prevent="checkCode">
          <BaseTextField
            v-model="code"
            label="کد دعوت"
            required
            dir="ltr"
            icon="i-lucide-ticket"
            placeholder="K7X2M9"
            :error="codeError"
            hint="کد ۶ کاراکتری از مدیر ساختمان"
            @update:model-value="codeError = ''"
          />
          <UButton type="submit" color="primary" variant="solid" size="lg" block label="بررسی کد" icon="i-lucide-search" />
        </form>
      </AppCard>

      <!-- پیش‌نمایش ساختمان -->
      <AppCard v-if="previewInvitation && previewBuilding" as="section">
        <div class="flex items-start gap-3">
          <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300">
            <Icon name="i-lucide-building-2" class="size-5.5" />
          </span>
          <div class="min-w-0 flex-1">
            <h2 class="text-sm font-extrabold text-slate-900 dark:text-white">{{ previewBuilding.name }}</h2>
            <p class="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{{ previewBuilding.address }}</p>
            <div class="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span class="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800/60">
                <Icon name="i-lucide-door-open" class="size-3" />
                {{ toPersianDigits(previewBuilding.unitsCount) }} واحد
              </span>
              <span class="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800/60">
                <Icon :name="previewInvitation.role === 'manager' ? 'i-lucide-shield' : 'i-lucide-user-round'" class="size-3" />
                پیوستن به‌عنوان {{ previewInvitation.role === 'manager' ? 'مدیر' : 'ساکن' }}
              </span>
            </div>
          </div>
        </div>

        <p v-if="joinError" class="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-400/10 dark:text-red-400">
          {{ joinError }}
        </p>

        <UButton color="primary" variant="solid" size="lg" block class="mt-3" label="پیوستن به این ساختمان" icon="i-lucide-log-in" :loading="joining" @click="join" />
      </AppCard>
    </template>
  </div>
</template>
