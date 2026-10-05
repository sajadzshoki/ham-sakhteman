<script setup lang="ts">
import { problemCategoryOf } from '~/data/mock'

const router = useRouter()
const { t } = useI18n()
const { user, isAuthenticated, isManager } = useAuth()
const store = useAppStore()

useSeoMeta({
  title: t('nav.home'),
  ogTitle: t('nav.home'),
})

const building = computed(() => store.buildingOfUser(user.value))
const membership = computed(() => store.membershipOfUser(user.value))

const unit = computed(() => {
  const current = membership.value
  if (!current?.unitId) return null
  return store.buildingUnits(current.buildingId).find(item => item.id === current.unitId) ?? null
})

const firstName = computed(() => user.value?.name.split(' ')[0] ?? '')
const todayLabel = formatDate(new Date(), 'weekday')

// ——— وضعیت مالی برای داشبورد ———

/** اولین شارژ پرداخت‌نشده/دیرکردِ ساکن (نزدیک‌ترین سررسید) */
const nextDueCharge = computed(() => {
  if (!building.value || !membership.value) return null
  return store.dueChargesForMember(building.value.id, membership.value.id)[0] ?? null
})

const nextDueStatus = computed(() => {
  if (!nextDueCharge.value || !membership.value) return 'unpaid'
  return store.chargeStatusFor(nextDueCharge.value, membership.value.id)
})

const dueCount = computed(() => {
  if (!building.value || !membership.value) return 0
  return store.dueChargesForMember(building.value.id, membership.value.id).length
})

/** خلاصه مالی برای داشبورد مدیر */
const managerSummary = computed(() => {
  if (!building.value || !isManager.value) return null
  return store.financialSummary(building.value.id)
})

/** دسترسی سریع بر اساس نقش — مدیر ابزار مدیریت دارد و ساکن ابزار گزارش و مشاهده */
/** آمار سریع مدیر برای نمای کلی ساختمان */
const managerStats = computed(() => {
  if (!building.value || !isManager.value) return []
  return [
    { label: 'ساکن', value: store.residentCount(building.value.id), icon: 'i-lucide-users' },
    { label: 'واحد', value: store.buildingUnits(building.value.id).length, icon: 'i-lucide-door-open' },
    { label: 'گزارش باز', value: openProblemsCount.value, icon: 'i-lucide-circle-alert' },
  ]
})

const quickActions = computed(() => {
  if (isManager.value) {
    return [
      { label: 'ایجاد اطلاعیه', icon: 'i-lucide-megaphone', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300', to: '/announcements/new' },
      { label: 'ایجاد شارژ', icon: 'i-lucide-wallet', tint: 'bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300', to: '/charges/new' },
      { label: 'ثبت هزینه', icon: 'i-lucide-receipt', tint: 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300', to: '/expenses/new' },
      { label: 'دعوت ساکن', icon: 'i-lucide-user-plus', tint: 'bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300', to: '/building/invite' },
      { label: 'مشاهده مشکلات', icon: 'i-lucide-circle-alert', tint: 'bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300', to: '/problems' },
      { label: 'مدیریت ساختمان', icon: 'i-lucide-building-2', tint: 'bg-slate-100 text-slate-600 dark:bg-slate-400/10 dark:text-slate-300', to: '/building' },
    ]
  }
  return [
    { label: 'گزارش مشکل', icon: 'i-lucide-circle-alert', tint: 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300', to: '/problems/new' },
    { label: 'مشاهده اطلاعیه‌ها', icon: 'i-lucide-megaphone', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300', to: '/announcements' },
    { label: 'خدمات ساختمان', icon: 'i-lucide-concierge-bell', tint: 'bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300', to: '/services' },
  ]
})

const latestAnnouncements = computed(() =>
  building.value ? store.buildingAnnouncements(building.value.id).slice(0, 3) : [],
)

/** مشکلات باز: مدیر همه را می‌بیند، ساکن فقط گزارش‌های خودش را */
const openProblems = computed(() => {
  if (!building.value || !user.value) return []
  const items = isManager.value
    ? store.openBuildingProblems(building.value.id)
    : store.problemsOfUser(building.value.id, user.value.id).filter(item => item.status !== 'resolved')
  return items.slice(0, 3)
})

const openProblemsCount = computed(() => {
  if (!building.value || !user.value) return 0
  return isManager.value
    ? store.openBuildingProblems(building.value.id).length
    : store.problemsOfUser(building.value.id, user.value.id).filter(item => item.status !== 'resolved').length
})

const unitLabel = computed(() => {
  if (!unit.value) return null
  return `واحد ${toPersianDigits(unit.value.number)} • طبقه ${toPersianDigits(unit.value.floor)}`
})

const features = [
  { title: 'مدیریت شارژ', description: 'پرداخت شفاف و به‌موقع شارژ ماهانه', icon: 'i-lucide-wallet', tint: 'bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300' },
  { title: 'اطلاعیه‌ها', description: 'از اخبار ساختمان جا نمانید', icon: 'i-lucide-megaphone', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300' },
  { title: 'خدمات ساختمان', description: 'یافتن ارائه‌دهندگان خدمات و تماس مستقیم', icon: 'i-lucide-concierge-bell', tint: 'bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300' },
]
</script>

<template>
  <div class="space-y-7">
    <!-- داشبورد کاربر دارای ساختمان: الان در ساختمان چه خبر است؟ -->
    <template v-if="isAuthenticated && building">
      <!-- خوش‌آمدگویی -->
      <section class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ todayLabel }}</p>
          <h1 class="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            سلام، {{ firstName }} 👋
          </h1>
          <p class="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
            در «{{ building.name }}» چه خبر؟
          </p>
        </div>
        <UserAvatar :name="user?.name ?? ''" size="lg" />
      </section>

      <!-- ساختمان و واحد فعلی -->
      <section>
        <AppCard>
          <div class="flex items-center gap-3">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300">
              <Icon name="i-lucide-building-2" class="size-5" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{{ building.name }}</p>
                <StatusBadge v-if="isManager" status="manager" />
              </div>
              <p class="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                <template v-if="unit && !isManager">
                  {{ unitLabel }}
                  <template v-if="membership?.unitStatus">
                    • {{ membership.unitStatus === 'owner' ? 'مالک' : 'مستأجر' }}
                  </template>
                </template>
                <template v-else-if="isManager">
                  مدیر ساختمان
                </template>
                <template v-else>
                  بدون واحد تخصیص‌یافته
                </template>
              </p>
            </div>
            <NuxtLink
              to="/building"
              class="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-300"
            >
              جزئیات
              <Icon name="i-lucide-chevron-left" class="size-3.5" />
            </NuxtLink>
          </div>
        </AppCard>
      </section>

      <!-- دسترسی سریع بر اساس نقش -->
      <section>
        <div class="grid grid-cols-3 gap-2.5 sm:gap-3">
          <NuxtLink
            v-for="action in quickActions"
            :key="action.label"
            :to="action.to"
            class="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-1 py-3.5 shadow-sm ring-1 ring-slate-950/5 transition-shadow hover:shadow-md dark:bg-slate-900 dark:ring-white/10"
          >
            <span class="flex size-10 items-center justify-center rounded-xl" :class="action.tint">
              <Icon :name="action.icon" class="size-5" />
            </span>
            <span class="text-center text-[11px] leading-4 font-semibold text-slate-600 dark:text-slate-300">
              {{ action.label }}
            </span>
          </NuxtLink>
        </div>
      </section>

      <!-- آمار سریع مدیر -->
      <section v-if="isManager && managerStats.length">
        <div class="grid grid-cols-3 gap-2.5 sm:gap-3">
          <AppCard v-for="stat in managerStats" :key="stat.label" padding="sm">
            <div class="flex items-center gap-2.5">
              <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Icon :name="stat.icon" class="size-4.5" />
              </span>
              <div class="min-w-0">
                <p class="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">{{ toPersianDigits(stat.value) }}</p>
                <p class="truncate text-[11px] text-slate-500 dark:text-slate-400">{{ stat.label }}</p>
              </div>
            </div>
          </AppCard>
        </div>
      </section>

      <!-- تازه‌ترین اطلاعیه‌ها -->
      <section>
        <SectionHeader title="تازه‌ترین اطلاعیه‌ها" :action="{ label: t('common.showAll'), to: '/announcements' }" />
        <div v-if="latestAnnouncements.length" class="space-y-3">
          <NuxtLink
            v-for="announcement in latestAnnouncements"
            :key="announcement.id"
            :to="`/announcements/${announcement.id}`"
            class="block"
          >
            <AppCard as="article" hover>
              <div class="flex items-center justify-between gap-2">
                <StatusBadge :status="announcement.importance" />
                <time class="text-[11px] text-slate-400 dark:text-slate-500">
                  {{ formatRelative(announcement.createdAt) }}
                </time>
              </div>
              <h3 class="mt-2.5 text-sm font-bold text-slate-800 dark:text-slate-100">
                {{ announcement.title }}
              </h3>
              <p class="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {{ announcement.body }}
              </p>
            </AppCard>
          </NuxtLink>
        </div>
        <EmptyState
          v-else
          icon="i-lucide-megaphone"
          title="هنوز اطلاعیه‌ای ثبت نشده"
          :description="isManager ? 'اولین اطلاعیه ساختمان خود را ثبت کنید تا ساکنین در جریان قرار بگیرند.' : 'به‌زودی اطلاعیه‌های ساختمان اینجا نمایش داده می‌شود.'"
        >
          <template v-if="isManager" #action>
            <UButton color="primary" variant="solid" size="md" label="ایجاد اطلاعیه" icon="i-lucide-plus" @click="router.push('/announcements/new')" />
          </template>
        </EmptyState>
      </section>

      <!-- مشکلات باز -->
      <section>
        <SectionHeader
          :title="isManager ? 'مشکلات در انتظار رسیدگی' : 'گزارش‌های پیگیری‌نشده شما'"
          :action="{ label: t('common.showAll'), to: '/problems' }"
        />
        <div v-if="openProblems.length" class="space-y-3">
          <NuxtLink
            v-for="problem in openProblems"
            :key="problem.id"
            :to="`/problems/${problem.id}`"
            class="block"
          >
            <AppCard as="article" hover>
              <div class="flex items-start gap-3">
                <span class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="problemCategoryOf(problem.category).tint">
                  <Icon :name="problemCategoryOf(problem.category).icon" class="size-5" />
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <p class="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{{ problem.title }}</p>
                    <StatusBadge :status="problem.status" :label="problem.status === 'in-progress' ? 'در حال پیگیری' : undefined" />
                  </div>
                  <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {{ problemCategoryOf(problem.category).label }}
                    •
                    {{ formatRelative(problem.createdAt) }}
                    <template v-if="isManager">
                      • {{ problem.reportedByName }}
                    </template>
                  </p>
                </div>
              </div>
            </AppCard>
          </NuxtLink>
        </div>
        <EmptyState
          v-else
          icon="i-lucide-circle-check"
          title="مشکل بازی وجود ندارد"
          :description="isManager
            ? 'همه گزارش‌های ثبت‌شده رسیدگی شده‌اند.'
            : (openProblemsCount === 0 ? 'اگر مشکلی در ساختمان دیدید، همین‌جا گزارش دهید.' : '')"
        >
          <template v-if="!isManager" #action>
            <UButton color="primary" variant="soft" size="md" label="گزارش مشکل" icon="i-lucide-plus" @click="router.push('/problems/new')" />
          </template>
        </EmptyState>
      </section>

      <!-- داشبورد مالی مدیر: مانده، درآمد و هزینه -->
      <section
        v-if="isManager && managerSummary"
        class="space-y-4 rounded-2xl bg-teal-600 p-5 text-white shadow-md shadow-teal-600/20"
      >
        <div class="flex items-center justify-between gap-2">
          <p class="flex items-center gap-1.5 text-sm font-medium text-teal-50">
            <Icon name="i-lucide-wallet" class="size-4" />
            نمای مالی ساختمان
          </p>
          <span
            v-if="managerSummary.unpaidItems > 0"
            class="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold"
          >
            {{ toPersianDigits(managerSummary.unpaidItems) }} سهم پرداخت‌نشده
          </span>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div class="rounded-xl bg-white/10 p-3">
            <p class="text-[11px] text-teal-100">درآمد شارژ</p>
            <p class="mt-1 text-sm font-extrabold tracking-tight">{{ formatAmount(managerSummary.income) }}</p>
          </div>
          <div class="rounded-xl bg-white/10 p-3">
            <p class="text-[11px] text-teal-100">هزینه‌ها</p>
            <p class="mt-1 text-sm font-extrabold tracking-tight">{{ formatAmount(managerSummary.expensesTotal) }}</p>
          </div>
          <div class="rounded-xl bg-white/10 p-3">
            <p class="text-[11px] text-teal-100">مانده</p>
            <p class="mt-1 text-sm font-extrabold tracking-tight">{{ formatAmount(Math.abs(managerSummary.balance)) }}</p>
          </div>
        </div>
        <UButton
          color="neutral"
          variant="solid"
          size="md"
          block
          label="شفافیت مالی ساختمان"
          icon="i-lucide-pie-chart"
          class="bg-white text-teal-700 hover:bg-teal-50"
          @click="router.push('/finances')"
        />
      </section>

      <!-- کارت شارژ ساکن: بدهی فعال یا حساب تسویه -->
      <section
        v-else-if="!isManager && nextDueCharge"
        class="space-y-4 rounded-2xl bg-teal-600 p-5 text-white shadow-md shadow-teal-600/20"
      >
        <div class="flex items-center justify-between gap-2">
          <p class="min-w-0 truncate text-sm font-medium text-teal-50">
            {{ nextDueCharge.title }} • {{ nextDueCharge.period }}
          </p>
          <span
            class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
            :class="nextDueStatus === 'overdue' ? 'bg-red-400/90 text-white' : 'bg-white/15'"
          >
            {{ nextDueStatus === 'overdue' ? t('status.overdue') : t('status.unpaid') }}
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-2xl font-extrabold tracking-tight">
            {{ formatAmount(nextDueCharge.amount) }}
            <span class="text-sm font-medium text-teal-50">تومان</span>
          </p>
          <p class="text-xs text-teal-100">
            سررسید: {{ formatDate(nextDueCharge.dueAt, 'full') }}
            <template v-if="dueCount > 1">
              • {{ toPersianDigits(dueCount - 1) }} شارژ دیگر هم باقی است
            </template>
          </p>
        </div>
        <UButton
          color="neutral"
          variant="solid"
          size="md"
          block
          label="مشاهده شارژهای من"
          icon="i-lucide-wallet"
          class="bg-white text-teal-700 hover:bg-teal-50"
          @click="router.push('/charges')"
        />
      </section>

      <section v-else-if="!isManager">
        <AppCard>
          <div class="flex items-center gap-3">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
              <Icon name="i-lucide-badge-check" class="size-5" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-slate-800 dark:text-slate-100">حساب شارژ شما تسویه است</p>
              <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">بدهی فعالی ندارید؛ شارژهای قبلی از صفحه شارژها قابل مشاهده‌اند.</p>
            </div>
            <NuxtLink to="/charges" class="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-300">
              شارژها
              <Icon name="i-lucide-chevron-left" class="size-3.5" />
            </NuxtLink>
          </div>
        </AppCard>
      </section>
    </template>

    <!-- خوش‌آمدگویی کاربر بدون ساختمان / وارد نشده -->
    <template v-else>
      <section class="space-y-4 rounded-2xl bg-teal-600 p-6 text-white shadow-md shadow-teal-600/20">
        <span class="flex size-12 items-center justify-center rounded-2xl bg-white/15">
          <Icon name="i-lucide-building-2" class="size-6" />
        </span>
        <div class="space-y-1.5">
          <h1 class="text-xl font-extrabold tracking-tight">
            <template v-if="isAuthenticated">سلام، {{ firstName }} 👋</template>
            <template v-else>به هم‌ساختمان خوش آمدید 👋</template>
          </h1>
          <p class="text-sm leading-6 text-teal-50">
            <template v-if="isAuthenticated && isManager">
              ساختمان خود را بسازید، واحدها را مدیریت کنید و ساکنین را دعوت کنید.
            </template>
            <template v-else-if="isAuthenticated">
              با کد دعوت مدیر، به ساختمان محل سکونت خود بپیوندید.
            </template>
            <template v-else>
              مدیریت شارژ، اطلاعیه‌ها، خدمات و ساکنین ساختمان — همه در یک اپ ساده و شفاف.
            </template>
          </p>
        </div>
        <div class="flex flex-col gap-2 pt-1">
          <template v-if="!isAuthenticated">
            <UButton color="neutral" variant="solid" size="lg" block label="ورود به حساب" icon="i-lucide-log-in" class="bg-white text-teal-700 hover:bg-teal-50" @click="router.push('/auth/login')" />
            <UButton color="neutral" variant="soft" size="lg" block label="ایجاد حساب جدید" class="bg-white/15 text-white hover:bg-white/25" @click="router.push('/auth/register')" />
          </template>
          <template v-else-if="isManager">
            <UButton color="neutral" variant="solid" size="lg" block label="ساخت ساختمان" icon="i-lucide-plus" class="bg-white text-teal-700 hover:bg-teal-50" @click="router.push('/onboarding')" />
          </template>
          <template v-else>
            <UButton color="neutral" variant="solid" size="lg" block label="پیوستن به ساختمان" icon="i-lucide-ticket" class="bg-white text-teal-700 hover:bg-teal-50" @click="router.push('/join')" />
          </template>
        </div>
      </section>

      <!-- قابلیت‌ها -->
      <section>
        <SectionHeader title="با هم‌ساختمان" />
        <div class="space-y-3">
          <AppCard v-for="feature in features" :key="feature.title" hover>
            <div class="flex items-center gap-3">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="feature.tint">
                <Icon :name="feature.icon" class="size-5" />
              </span>
              <div class="min-w-0">
                <p class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ feature.title }}</p>
                <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{{ feature.description }}</p>
              </div>
            </div>
          </AppCard>
        </div>
      </section>
    </template>
  </div>
</template>
