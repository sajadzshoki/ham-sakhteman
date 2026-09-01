<script setup lang="ts">
const { t } = useI18n()
const auth = useAuth()
const { buildings, getBuilding } = useBuildings()
const { getByBuilding: getAnn } = useAnnouncements()
const { getByBuilding: getProb, categoryLabels, statusLabels } = useProblems()

const currentBuilding = computed(() => {
  if (!auth.isAuthenticated || buildings.value.length === 0) return null
  return buildings.value[0]
})

const announcements = computed(() => currentBuilding.value ? getAnn(currentBuilding.value.id).slice(0, 3) : [])
const openProblems = computed(() => currentBuilding.value ? getProb(currentBuilding.value.id).filter(p => p.status !== 'resolved').slice(0, 3) : [])


const quickActions = [
  { icon: 'i-lucide-building-2', label: 'ساختمان‌ها', to: '/buildings', color: 'from-violet-400 to-indigo-500' },
  { icon: 'i-lucide-file-text', label: 'درخواست خدمت', to: '/services', color: 'from-teal-450 to-primary-500' },
  { icon: 'i-lucide-bell', label: 'اعلان‌ها', to: '/profile', color: 'from-amber-400 to-orange-500' },
  { icon: 'i-lucide-wallet', label: 'مالیات', to: '/building', color: 'from-violet-400 to-indigo-500' },
  { icon: 'i-lucide-shield-check', label: 'امنیت', to: '/building', color: 'from-rose-400 to-rose-500' },
]

const notifications = [
  { id: '1', title: 'تعمیر آسانسور', message: 'تعمیر آسانسور طبقه ۵ در حال انجام است.', time: '۱۰ دقیقه پیش', unread: true },
  { id: '2', title: 'صورت‌حساب ماهانه', message: 'صورت‌حساب اردیبهشت آماده است.', time: '۲ ساعت پیش', unread: false },
  { id: '3', title: 'اجتماع ساکنان', message: 'اجتماع هفتگی در سالن اجتماعات.', time: '۵ ساعت پیش', unread: false },
]

const events = [
  { day: '۱۲', month: 'خرداد', title: 'تأیید نقشه تأسیسات', desc: 'بررسی نهایی نقشه تأسیسات ساختمان' },
  { day: '۱۵', month: 'خرداد', title: 'تعمیر پارکینگ', desc: 'تعمیر درب پارکینگ طبقه همکف' },
]
</script>

<template>
  <div>
    <!-- Welcome -->
    <section class="mb-6">
      <div class="rounded-3xl bg-gradient-to-br from-primary-600 to-teal-700 text-white p-6 shadow-soft-lg relative overflow-hidden">
        <div class="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full -translate-x-1/3 -translate-y-1/2 blur-2xl pointer-events-none" />
        <div class="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/4 translate-y-1/3 blur-2xl pointer-events-none" />
        <div class="relative z-10">
          <div class="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-xs font-bold mb-3">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            وضعیت فعال
          </div>
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight mb-1">سلام {{ (auth.user as any)?.name || 'علی' }}</h1>
          <p class="text-primary-100 text-sm md:text-base font-medium leading-relaxed">{{ currentBuilding ? currentBuilding.name + ' — ' + currentBuilding.address : 'خوش آمدید به مدیریت ساختمان هم‌ساختمان' }}</p>
        </div>
      </div>
    </section>

    <!-- Quick actions -->
    <section class="mb-8">
      <PageHeader title="دسترسی سریع" subtitle="خدمات پرکاربرد" />
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NuxtLink v-for="a in quickActions" :key="a.label" :to="a.to" class="group bg-white rounded-3xl p-4 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5 border border-slate-100/80 flex flex-col items-center text-center gap-2.5">
          <span class="w-12 h-12 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center shadow-soft-lg shadow-inner-soft transition-transform group-hover:scale-110" :class="a.color">
            <Icon :name="a.icon" class="w-6 h-6" />
          </span>
          <span class="text-sm font-extrabold text-slate-800 leading-snug">{{ a.label }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- Announcements -->
    <section class="mb-6" v-if="announcements.length">
      <PageHeader title="آخرین اطلاعیه‌ها" subtitle="اطلاعیه‌های ساختمان" />
      <div class="flex flex-col gap-3">
        <NuxtLink v-for="a in announcements" :key="a.id" :to="'/announcements?id=' + a.id" class="bg-white rounded-3xl p-4 shadow-soft border border-slate-100/80 hover:shadow-soft-lg transition-all">
          <div class="flex items-center gap-2 mb-1">
            <StatusBadge :status="a.importance === 'important' ? 'warning' : 'success'" :label="a.importance === 'important' ? 'مهم' : 'عادی'" />
            <span class="text-[10px] text-slate-300 font-medium">{{ a.createdAt ? a.createdAt.slice(0,10) : '' }}</span>
          </div>
          <h4 class="text-sm font-extrabold text-slate-900 leading-snug">{{ a.title }}</h4>
          <p class="text-xs text-slate-400 font-medium truncate">{{ a.description }}</p>
        </NuxtLink>
      </div>
      <div v-if="!auth.isAuthenticated" class="mt-3 text-center"><NuxtLink to="/login" class="text-xs font-extrabold text-primary-600">ورود برای مشاهده بیشتر</NuxtLink></div>
    </section>

    <!-- Open problems -->
    <section class="mb-6" v-if="openProblems.length">
      <PageHeader title="مشکلات باز" subtitle="گزارش‌های در حال بررسی" />
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AppCard v-for="p in openProblems" :key="p.id" padding="md" hover>
          <NuxtLink :to="'/problems?id=' + p.id" class="block">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md border border-rose-100">{{ categoryLabels[p.category] || p.category }}</span>
              <StatusBadge :status="p.status === 'new' ? 'pending' : p.status === 'in-progress' ? 'in-progress' : 'completed'" :label="statusLabels[p.status] || p.status" />
            </div>
            <h4 class="text-sm font-extrabold text-slate-900 leading-snug">{{ p.title }}</h4>
            <p class="text-xs text-slate-400 font-medium truncate">{{ p.description }}</p>
          </NuxtLink>
        </AppCard>
      </div>
    </section>

    <!-- Quick manager/resident actions -->
    <section class="mb-8" v-if="auth.isManager || auth.isAuthenticated">
      <PageHeader title="دسترسی سریع" subtitle="خدمات پرکاربرد" />
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NuxtLink to="/announcements" class="group bg-white rounded-3xl p-4 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5 border border-slate-100/80 flex flex-col items-center text-center gap-2.5">
          <span class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-soft-lg shadow-inner-soft transition-transform group-hover:scale-110"><Icon name="i-lucide-bullhorn" class="w-6 h-6" /></span>
          <span class="text-sm font-extrabold text-slate-800 leading-snug">اعلان‌ها</span>
        </NuxtLink>
        <NuxtLink to="/problems" class="group bg-white rounded-3xl p-4 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5 border border-slate-100/80 flex flex-col items-center text-center gap-2.5">
          <span class="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-500 text-white flex items-center justify-center shadow-soft-lg shadow-inner-soft transition-transform group-hover:scale-110"><Icon name="i-lucide-wrench" class="w-6 h-6" /></span>
          <span class="text-sm font-extrabold text-slate-800 leading-snug">گزارش مشکل</span>
        </NuxtLink>
      </div>
    </section>

    <!-- Building status + notifications -->
    <!-- Building status + notifications -->
    <div class="grid md:grid-cols-3 gap-5 mb-8">
      <AppCard class="md:col-span-2" padding="lg">
        <PageHeader title="وضعیت ساختمان" subtitle="واحد ۴۰۲ — طبقه ۴" />
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100/60 text-center">
            <div class="text-2xl font-extrabold text-slate-900">۲۴</div>
            <div class="text-xs text-slate-400 font-bold mt-0.5">واحد</div>
          </div>
          <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100/60 text-center">
            <div class="text-2xl font-extrabold text-primary-600">۹۸%</div>
            <div class="text-xs text-slate-400 font-bold mt-0.5">اشغال</div>
          </div>
          <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100/60 text-center">
            <div class="text-2xl font-extrabold text-teal-600">۱۲</div>
            <div class="text-xs text-slate-400 font-bold mt-0.5">درخواست</div>
          </div>
        </div>
        <div class="mt-4 flex items-center gap-3 bg-amber-50 rounded-2xl px-4 py-3 border border-amber-100/60">
          <Icon name="i-lucide-alert-circle" class="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <div class="text-sm font-extrabold text-amber-800">تعمیر آسانسور</div>
            <div class="text-xs text-amber-600 font-medium">طبق برنامه در ساعت ۱۰ صبح انجام می‌شود.</div>
          </div>
        </div>
      </AppCard>

      <AppCard padding="lg">
        <PageHeader title="اعلان‌ها" subtitle="آخرین به‌روزرسانی‌ها" />
        <div class="flex flex-col gap-2.5">
          <div v-for="n in notifications" :key="n.id" class="flex items-start gap-3 rounded-2xl p-3 transition-colors" :class="n.unread ? 'bg-primary-50/60' : 'hover:bg-slate-50'">
            <div class="w-8 h-8 rounded-xl bg-white shadow-soft flex items-center justify-center text-slate-500 shrink-0 border border-slate-100" :class="n.unread ? 'text-primary-600' : ''">
              <Icon :name="n.unread ? 'i-lucide-bell' : 'i-lucide-check-circle'" class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <h4 class="text-sm font-extrabold text-slate-800 truncate">{{ n.title }}</h4>
              <p class="text-xs text-slate-400 font-medium truncate">{{ n.message }}</p>
              <div class="text-[10px] text-slate-300 font-medium mt-0.5">{{ n.time }}</div>
            </div>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Upcoming events -->
    <section class="mb-8">
      <PageHeader title="رویدادهای پیش رو" subtitle="تقویم ساختمان" />
      <div class="grid sm:grid-cols-2 gap-3">
        <AppCard v-for="e in events" :key="e.title" padding="md" hover>
          <div class="flex items-center gap-3">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-teal-600 text-white flex flex-col items-center justify-center shadow-soft shadow-inner-soft shrink-0 leading-none">
              <span class="text-xs font-bold opacity-90">{{ e.month }}</span>
              <span class="text-lg font-extrabold">{{ e.day }}</span>
            </div>
            <div class="min-w-0">
              <h4 class="text-sm font-extrabold text-slate-900 truncate">{{ e.title }}</h4>
              <p class="text-xs text-slate-400 font-medium truncate">{{ e.desc }}</p>
            </div>
          </div>
        </AppCard>
      </div>
    </section>
  </div>
</template>
