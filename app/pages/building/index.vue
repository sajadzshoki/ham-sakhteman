<script setup lang="ts">
const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const { user, isAuthenticated, isManager } = useAuth()
const store = useAppStore()

useSeoMeta({
  title: t('nav.building'),
  ogTitle: t('nav.building'),
})

const building = computed(() => store.buildingOfUser(user.value))
const membership = computed(() => store.membershipOfUser(user.value))
const manager = computed(() => (building.value ? store.buildingManager(building.value.id) : null))
const buildingUnits = computed(() => (building.value ? store.buildingUnits(building.value.id) : []))
const buildingMembers = computed(() => (building.value ? store.buildingMembers(building.value.id) : []))
const occupantOf = (unitId: string) => store.memberOfUnit(unitId)

const stats = computed(() => {
  if (!building.value) return []
  return [
    { label: 'تعداد واحد', value: toPersianDigits(buildingUnits.value.length), icon: 'i-lucide-door-open' },
    { label: 'ساکنین', value: toPersianDigits(store.residentCount(building.value.id)), icon: 'i-lucide-users' },
    { label: 'تعداد طبقات', value: toPersianDigits(store.floorCount(building.value.id)), icon: 'i-lucide-layers' },
    { label: 'مدیر ساختمان', value: manager.value?.name ?? '—', icon: 'i-lucide-user-round-cog' },
  ]
})

const activeInvitation = computed(() => {
  if (!building.value) return null
  return store.buildingInvitations(building.value.id).find(
    invitation => store.invitationDisplayStatus(invitation) === 'active',
  ) ?? null
})

// ——— ویرایش اطلاعات ساختمان ———
const isEditDialogOpen = ref(false)
const editName = ref('')
const editAddress = ref('')
const editDescription = ref('')
const editError = ref('')

function openEditDialog() {
  if (!building.value) return
  editName.value = building.value.name
  editAddress.value = building.value.address
  editDescription.value = building.value.description ?? ''
  editError.value = ''
  isEditDialogOpen.value = true
}

function submitEdit() {
  editError.value = ''
  if (!building.value) return
  if (!editName.value.trim() || !editAddress.value.trim()) {
    editError.value = 'نام و آدرس ساختمان الزامی است.'
    return
  }
  store.updateBuilding(building.value.id, {
    name: editName.value.trim(),
    address: editAddress.value.trim(),
    unitsCount: buildingUnits.value.length,
    description: editDescription.value.trim() || undefined,
  })
  toast.add({ title: 'اطلاعات ساختمان به‌روزرسانی شد', color: 'success' })
  isEditDialogOpen.value = false
}

const managerActions = [
  { label: 'مدیریت واحدها', icon: 'i-lucide-door-open', tint: 'bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300', action: () => router.push('/building/units') },
  { label: 'اعضای ساختمان', icon: 'i-lucide-users', tint: 'bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300', action: () => router.push('/building/members') },
  { label: 'دعوت ساکنین', icon: 'i-lucide-user-plus', tint: 'bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300', action: () => router.push('/building/invite') },
]
</script>

<template>
  <div class="space-y-7">
    <!-- حالت کاربر وارد نشده -->
    <template v-if="!isAuthenticated">
      <PageHeader title="ساختمان" description="برای مدیریت ساختمان خود وارد شوید" />
      <EmptyState
        icon="i-lucide-building-2"
        title="هنوز وارد حساب نشده‌اید"
        description="با ورود به حساب، ساختمان، واحدها و ساکنین خود را مدیریت کنید."
      >
        <template #action>
          <div class="flex gap-2">
            <UButton color="primary" variant="solid" size="md" label="ورود" icon="i-lucide-log-in" @click="router.push('/auth/login')" />
            <UButton color="neutral" variant="soft" size="md" label="ثبت‌نام" @click="router.push('/auth/register')" />
          </div>
        </template>
      </EmptyState>
    </template>

    <!-- کاربر وارد شده ولی ساختمانی ندارد -->
    <template v-else-if="!building">
      <PageHeader title="ساختمان" description="هنوز به ساختمانی متصل نیستید" />
      <EmptyState
        v-if="isManager"
        icon="i-lucide-building-2"
        title="ساختمان خود را بسازید"
        description="در سه مرحله ساختمان بسازید، واحدها را اضافه کنید و ساکنین را دعوت کنید."
      >
        <template #action>
          <UButton color="primary" variant="solid" size="md" label="ساخت ساختمان" icon="i-lucide-plus" @click="router.push('/onboarding')" />
        </template>
      </EmptyState>
      <EmptyState
        v-else
        icon="i-lucide-ticket"
        title="به ساختمانی بپیوندید"
        description="کد دعوت را از مدیر ساختمان بگیرید و با آن به ساختمان محل سکونت خود بپیوندید."
      >
        <template #action>
          <UButton color="primary" variant="solid" size="md" label="پیوستن با کد دعوت" icon="i-lucide-log-in" @click="router.push('/join')" />
        </template>
      </EmptyState>
    </template>

    <!-- نمای کلی ساختمان -->
    <template v-else>
      <PageHeader :title="building.name" :description="building.address">
        <template #actions>
          <StatusBadge
            :status="membership?.role ?? 'resident'"
            :label="membership?.role === 'manager' ? 'مدیر ساختمان' : 'ساکن'"
          />
        </template>
      </PageHeader>

      <!-- آمار -->
      <section>
        <AppCard as="section">
          <dl class="grid grid-cols-2 gap-3">
            <div v-for="stat in stats" :key="stat.label" class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <dt class="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Icon :name="stat.icon" class="size-3.5" />
                {{ stat.label }}
              </dt>
              <dd class="mt-1 truncate text-sm font-bold text-slate-800 dark:text-slate-100">{{ stat.value }}</dd>
            </div>
          </dl>
          <p v-if="building.description" class="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {{ building.description }}
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-if="isManager"
              type="button"
              class="flex items-center gap-1.5 rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-100 dark:bg-teal-400/10 dark:text-teal-300 dark:hover:bg-teal-400/20"
              @click="openEditDialog"
            >
              <Icon name="i-lucide-pencil" class="size-3.5" />
              ویرایش اطلاعات ساختمان
            </button>
            <a
              v-if="manager?.phone"
              :href="telHref(manager.phone)"
              class="flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-teal-500/60 focus-visible:outline-none dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Icon name="i-lucide-phone" class="size-3.5" />
              تماس با مدیر
            </a>
          </div>
        </AppCard>
      </section>

      <!-- اقدامات مدیر -->
      <section v-if="isManager">
        <SectionHeader title="مدیریت" />
        <div class="grid grid-cols-3 gap-2.5">
          <button
            v-for="action in managerActions"
            :key="action.label"
            type="button"
            class="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-1 py-3.5 shadow-sm ring-1 ring-slate-950/5 transition-shadow hover:shadow-md dark:bg-slate-900 dark:ring-white/10"
            @click="action.action"
          >
            <span class="flex size-10 items-center justify-center rounded-xl" :class="action.tint">
              <Icon :name="action.icon" class="size-5" />
            </span>
            <span class="text-center text-[11px] leading-4 font-semibold text-slate-600 dark:text-slate-300">
              {{ action.label }}
            </span>
          </button>
        </div>
      </section>

      <!-- دعوت‌نامه فعال مدیر -->
      <section v-if="isManager && activeInvitation">
        <SectionHeader title="دعوت ساکنین" :action="{ label: 'مدیریت دعوت‌ها', to: '/building/invite' }" />
        <AppCard>
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs text-slate-500 dark:text-slate-400">کد دعوت فعال</p>
              <p dir="ltr" class="mt-1 inline-block font-mono text-lg font-extrabold tracking-[0.25em] text-teal-700 dark:text-teal-300">
                {{ activeInvitation.code }}
              </p>
            </div>
            <UButton color="primary" variant="soft" size="sm" label="اشتراک‌گذاری" icon="i-lucide-share-2" @click="router.push('/building/invite')" />
          </div>
        </AppCard>
      </section>

      <!-- پیش‌نمایش واحدها -->
      <section>
        <SectionHeader title="واحدها" :action="{ label: 'مشاهده همه', to: '/building/units' }" />
        <AppCard padding="none">
          <ul class="divide-y divide-slate-100 dark:divide-slate-800">
            <li v-for="unit in buildingUnits.slice(0, 5)" :key="unit.id" class="flex items-center gap-3 px-4 py-3">
              <span class="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-sm font-extrabold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
                {{ toPersianDigits(unit.number) }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                  {{ occupantOf(unit.id)?.name ?? 'بدون ساکن' }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">طبقه {{ toPersianDigits(unit.floor) }}</p>
              </div>
              <StatusBadge
                :status="occupantOf(unit.id) ? (occupantOf(unit.id)?.unitStatus ?? 'owner') : 'vacant'"
              />
            </li>
          </ul>
        </AppCard>
      </section>

      <!-- پیش‌نمایش اعضا -->
      <section>
        <SectionHeader title="ساکنین" :action="{ label: 'مشاهده همه', to: '/building/members' }" />
        <AppCard padding="none">
          <ul class="divide-y divide-slate-100 dark:divide-slate-800">
            <li v-for="member in buildingMembers.slice(0, 4)" :key="member.id" class="flex items-center gap-3 px-4 py-3">
              <UserAvatar :name="member.name" size="md" />
              <div class="min-w-0 flex-1">
                <p class="flex items-center gap-1.5 truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                  {{ member.name }}
                  <span
                    v-if="member.userId === user?.id"
                    class="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:bg-teal-400/10 dark:text-teal-300"
                  >
                    شما
                  </span>
                </p>
                <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  <template v-if="member.unitId">
                    واحد {{ toPersianDigits(buildingUnits.find(unit => unit.id === member.unitId)?.number ?? '') }}
                  </template>
                  <template v-else>بدون واحد</template>
                </p>
              </div>
              <StatusBadge :status="member.role" :label="member.role === 'manager' ? 'مدیر' : 'ساکن'" />
            </li>
          </ul>
        </AppCard>
      </section>
    </template>

    <!-- مودال ویرایش اطلاعات ساختمان -->
    <UModal v-model:open="isEditDialogOpen" title="ویرایش اطلاعات ساختمان" :ui="{ content: 'max-w-md' }">
      <template #body>
        <form class="space-y-4" @submit.prevent="submitEdit">
          <BaseTextField v-model="editName" label="نام ساختمان" required @update:model-value="editError = ''" />
          <BaseTextField v-model="editAddress" label="آدرس" required @update:model-value="editError = ''" />
          <p class="rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs leading-5 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            تعداد واحدهای ثبت‌شده:
            <span class="font-bold text-slate-700 dark:text-slate-200">{{ toPersianDigits(buildingUnits.length) }}</span>
            — برای افزودن یا حذف واحد به صفحه واحدها بروید.
          </p>
          <BaseTextAreaField v-model="editDescription" label="توضیحات" hint="اختیاری" />
          <p v-if="editError" class="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-400/10 dark:text-red-400">
            {{ editError }}
          </p>
          <div class="flex w-full flex-row-reverse gap-2">
            <UButton type="submit" color="primary" variant="solid" size="md" block label="ذخیره تغییرات" />
            <UButton type="button" color="neutral" variant="soft" size="md" block label="انصراف" @click="isEditDialogOpen = false" />
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>
