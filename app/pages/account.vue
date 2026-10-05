<script setup lang="ts">
const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const { user, isAuthenticated, isSuperAdmin, isManager } = useAuth()
const store = useAppStore()

useSeoMeta({
  title: t('nav.account'),
  ogTitle: t('nav.account'),
})

const building = computed(() => store.buildingOfUser(user.value))
const membership = computed(() => store.membershipOfUser(user.value))

const unitInfo = computed(() => {
  if (!membership.value?.unitId || !building.value) return null
  const unit = store.buildingUnits(building.value.id).find(item => item.id === membership.value?.unitId)
  return unit ? `واحد ${toPersianDigits(unit.number)}، طبقه ${toPersianDigits(unit.floor)}` : null
})

const clientReady = ref(false)
onMounted(() => { clientReady.value = true })

const unreadCount = computed(() => (clientReady.value && user.value ? store.unreadNotifications(user.value.id).length : 0))

// ——— ویرایش پروفایل ———
const isEditOpen = ref(false)
const editName = ref('')
const editError = ref('')

function openEdit() {
  editName.value = user.value?.name ?? ''
  editError.value = ''
  isEditOpen.value = true
}

function saveProfile() {
  if (!user.value) return
  if (!editName.value.trim()) {
    editError.value = t('common.required')
    return
  }
  store.updateProfile(user.value.id, editName.value)
  isEditOpen.value = false
  toast.add({ title: 'پروفایل به‌روزرسانی شد', color: 'success' })
}

interface AccountMenuItem {
  label: string
  icon: string
  tint: string
  to: string
  requiresManager?: boolean
  requiresBuilding?: boolean
  requiresSuperAdmin?: boolean
  badge?: number
}

const menuItems = computed<AccountMenuItem[]>(() => [
  { label: 'ساختمان من', icon: 'i-lucide-building-2', tint: 'bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300', to: '/building' },
  { label: 'اعضای ساختمان', icon: 'i-lucide-users', tint: 'bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300', to: '/building/members', requiresBuilding: true },
  { label: 'دعوت از ساکنین', icon: 'i-lucide-user-plus', tint: 'bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300', to: '/building/invite', requiresManager: true },
  { label: 'مرکز اعلان‌ها', icon: 'i-lucide-bell', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300', to: '/notifications', badge: unreadCount.value },
  { label: 'مدیریت کل پلتفرم', icon: 'i-lucide-shield-check', tint: 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300', to: '/admin', requiresSuperAdmin: true },
  { label: 'تنظیمات', icon: 'i-lucide-settings', tint: 'bg-slate-100 text-slate-600 dark:bg-slate-400/10 dark:text-slate-300', to: '/settings' },
].filter((item) => {
  if (item.requiresSuperAdmin && !isSuperAdmin.value) return false
  if (isSuperAdmin.value && item.to.startsWith('/building')) return false
  if (item.requiresManager && (!isManager.value || !building.value)) return false
  if (item.requiresBuilding && !building.value) return false
  return true
}))
</script>

<template>
  <div class="space-y-7">
    <PageHeader title="حساب من" description="پروفایل و اطلاعات حساب کاربری" />

    <!-- کاربر وارد نشده -->
    <template v-if="!isAuthenticated || !user">
      <EmptyState
        icon="i-lucide-circle-user-round"
        title="وارد حساب نشده‌اید"
        description="برای مدیریت ساختمان و تنظیمات، وارد حساب خود شوید."
      >
        <template #action>
          <div class="flex gap-2">
            <UButton color="primary" variant="solid" size="md" label="ورود" icon="i-lucide-log-in" @click="router.push('/auth/login')" />
            <UButton color="neutral" variant="soft" size="md" label="ثبت‌نام" @click="router.push('/auth/register')" />
          </div>
        </template>
      </EmptyState>
    </template>

    <template v-else>
      <!-- پروفایل -->
      <section>
        <AppCard as="section">
          <div class="flex items-start gap-4">
            <UserAvatar :name="user.name" size="xl" />
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-extrabold text-slate-900 dark:text-white">{{ user.name }}</h2>
                  <p class="mt-1 text-xs text-slate-400 dark:text-slate-500" dir="ltr">
                    {{ formatPhone(user.phone) }}
                  </p>
                </div>
                <UButton
                  color="neutral"
                  variant="soft"
                  size="sm"
                  icon="i-lucide-pencil"
                  label="ویرایش"
                  class="shrink-0"
                  @click="openEdit"
                />
              </div>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge :status="membership?.role ?? user.role" />
                <span
                  v-if="building"
                  class="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  <Icon name="i-lucide-building-2" class="size-3" />
                  {{ building.name }}<template v-if="unitInfo"> • {{ unitInfo }}</template>
                </span>
              </div>
            </div>
          </div>
        </AppCard>
      </section>

      <!-- منوی حساب -->
      <section>
        <AppCard padding="none">
          <ul class="divide-y divide-slate-100 dark:divide-slate-800">
            <li v-for="item in menuItems" :key="item.label">
              <NuxtLink
                :to="item.to"
                class="flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 outline-none dark:hover:bg-slate-800/50 dark:focus-visible:bg-slate-800/50"
              >
                <span class="flex size-9 items-center justify-center rounded-xl" :class="item.tint">
                  <Icon :name="item.icon" class="size-4.5" />
                </span>
                <span class="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{{ item.label }}</span>
                <span
                  v-if="item.badge"
                  class="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1.5 text-[10px] font-extrabold text-white dark:bg-teal-500"
                >
                  {{ toPersianDigits(item.badge) }}
                </span>
                <Icon name="i-lucide-chevron-left" class="size-4 text-slate-300 dark:text-slate-600" />
              </NuxtLink>
            </li>
          </ul>
        </AppCard>
      </section>
    </template>

    <!-- ویرایش پروفایل -->
    <UModal v-model:open="isEditOpen" title="ویرایش پروفایل" description="نام نمایشی خود را تغییر دهید." :ui="{ content: 'max-w-md' }">
      <template #body>
        <div class="space-y-4">
          <BaseTextField
            v-model="editName"
            label="نام و نام خانوادگی"
            required
            icon="i-lucide-circle-user-round"
            :error="editError"
            @update:model-value="editError = ''"
          />
          <div class="rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            شماره موبایل <span class="font-bold" dir="ltr">{{ user ? formatPhone(user.phone) : '' }}</span> شناسه ورود شماست و قابل تغییر نیست.
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full flex-row-reverse gap-2">
          <UButton color="primary" variant="solid" size="md" block label="ذخیره" @click="saveProfile" />
          <UButton color="neutral" variant="soft" size="md" block :label="t('common.cancel')" @click="isEditOpen = false" />
        </div>
      </template>
    </UModal>
  </div>
</template>
