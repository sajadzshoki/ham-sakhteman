<script setup lang="ts">
const { t } = useI18n()
const auth = useAuth()
const currentUser = computed(() => auth.user.value || null)
const { buildings, createBuilding } = useBuildings()

const showCreate = ref(false)
const name = ref('')
const address = ref('')
const desc = ref('')
const unitsCount = ref(4)

const submit = () => {
  if (!name.value.trim()) return
  const b: import("../types").Building = createBuilding({
    name: name.value,
    address: address.value,
    description: desc.value,
    unitCount: Number(unitsCount.value) || 0,
    residentCount: 0,
  })
  showCreate.value = false
  name.value = ''
  address.value = ''
  desc.value = ''
  navigateTo('/building?id=' + b.id)
}
</script>

<template>
  <div>
    <PageHeader title="ساختمان‌ها" subtitle="مدیریت ساختمان‌های شما" />

    <section v-if="!auth.isAuthenticated" class="mb-6">
      <AppCard padding="md" class="bg-gradient-to-br from-primary-50 to-teal-50 border-primary-100/60">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-teal-600 text-white flex items-center justify-center shadow-soft-lg shadow-inner-soft">
            <Icon name="i-lucide-log-in" class="w-6 h-6" />
          </div>
          <div class="flex-1">
            <h3 class="text-base font-extrabold text-slate-900">ورود به حساب</h3>
            <p class="text-xs text-slate-400 font-medium">برای ساخت یا مدیریت ساختمان وارد شوید</p>
          </div>
          <NuxtLink to="/login" class="shrink-0 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-extrabold shadow-soft hover:bg-primary-700 transition-colors">ورود</NuxtLink>
        </div>
      </AppCard>
    </section>

    <div class="flex items-center justify-between mb-4">
      <h2 v-if="auth.isManager" class="text-lg font-extrabold text-slate-800">{{ t('buildings.myBuildings') }}</h2>
      <button v-if="auth.isManager" @click="showCreate = true" class="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-600 text-white text-xs font-extrabold shadow-soft hover:bg-primary-700 transition-colors">
        <Icon name="i-lucide-plus" class="w-4 h-4" /> {{ t('buildings.createBuilding') }}
      </button>
    </div>

    <div v-if="showCreate" class="mb-6">
      <AppCard padding="lg">
        <h3 class="text-base font-extrabold text-slate-900 mb-3">ساخت ساختمان جدید</h3>
        <div class="grid sm:grid-cols-2 gap-3 mb-3">
          <AppInput v-model="name" label="نام ساختمان" placeholder="مثلاً ساختمان شمالی" />
          <AppInput v-model="address" label="آدرس" placeholder="تهران، خیابان..." />
        </div>
        <AppInput v-model="desc" label="توضیحات" placeholder="توضیحات اختیاری" />
        <AppSelect label="تعداد واحدها" v-model="unitsCount" :options="[{value:'4',label:'۴'},{value:'8',label:'۸'},{value:'12',label:'۱۲'},{value:'24',label:'۲۴'}]" />
        <div class="mt-3 flex gap-2 justify-end">
          <button @click="showCreate = false" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-sm hover:bg-slate-200 transition-colors">لغو</button>
          <button @click="submit" class="px-4 py-2 rounded-xl bg-primary-600 text-white font-extrabold text-sm shadow-soft hover:bg-primary-700 transition-colors">ساخت</button>
        </div>
      </AppCard>
    </div>

    <div class="flex flex-col gap-3">
      <AppCard v-for="b in buildings" :key="b.id" padding="md" hover>
        <NuxtLink :to="'/building?id=' + b.id" class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-teal-500 text-white flex items-center justify-center shadow-soft shadow-inner-soft shrink-0">
            <Icon name="i-lucide-building-2" class="w-6 h-6" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="text-base font-extrabold text-slate-900 leading-tight">{{ b.name }}</h3>
            <p class="text-xs text-slate-400 font-medium truncate">{{ b.address }}</p>
            <div class="flex items-center gap-3 mt-2 text-xs font-bold text-slate-500">
              <span class="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{{ b.unitCount }} واحد</span>
              <span class="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{{ b.residentCount }} ساکن</span>
              <span class="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-100">مدیر: {{ b.managerId === (currentUser?.id || '') ? 'شما' : 'دیگری' }}</span>
            </div>
          </div>
        </NuxtLink>
      </AppCard>
      <EmptyState v-if="buildings.length === 0" title="ساختمانی یافت نشد" message="ساختمان خود را بسازید یا از طریق دعوت پیوستید." />
    </div>

    <!-- Onboarding flow -->
    <section v-if="auth.isAuthenticated && buildings.length > 0" class="mt-8 mb-6">
      <PageHeader title="جریان راه‌اندازی" subtitle="ساخت ساختمان → واحدها → دعوت ساکنان" />
      <div class="grid sm:grid-cols-3 gap-3">
        <AppCard padding="md" class="bg-gradient-to-br from-primary-50 to-white border-primary-100/60">
          <div class="text-sm font-extrabold text-slate-900">۱. ساخت ساختمان</div>
          <div class="text-xs text-slate-500 font-medium mt-1">نام و آدرس را وارد کنید</div>
        </AppCard>
        <AppCard padding="md" class="bg-gradient-to-br from-teal-50 to-white border-teal-100/60">
          <div class="text-sm font-extrabold text-slate-900">۲. افزودن واحدها</div>
          <div class="text-xs text-slate-500 font-medium mt-1">واحدها را تعریف و وضعیت را تنظیم کنید</div>
        </AppCard>
        <AppCard padding="md" class="bg-gradient-to-br from-amber-50 to-white border-amber-100/60">
          <div class="text-sm font-extrabold text-slate-900">۳. دعوت ساکنان</div>
          <div class="text-xs text-slate-500 font-medium mt-1">کد دعوت را با ساکنان به اشتراک بگذارید</div>
        </AppCard>
      </div>
    </section>
  </div>
</template>
