<script setup lang="ts">
const { t } = useI18n()
const auth = useAuth()
const { providers, categories, toggleTrusted } = useProviders()
const route = useRoute()
const id = computed(() => route.query.id as string)
const provider = computed(() => providers.value.find(p => p.id === id.value) || null)
const isMgr = computed(() => auth.isManager)
</script>

<template>
  <div>
    <AppHeader title="خدماتی" subtitle="جزئیات خدمات" back />

    <div v-if="provider" class="flex flex-col gap-4">
      <AppCard padding="lg">
        <div class="flex items-start gap-4 mb-4">
          <div class="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-400 to-teal-500 text-white flex items-center justify-center shadow-soft-lg shadow-inner-soft shrink-0">
            <Icon name="i-lucide-user-cog" class="w-8 h-8" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-xl font-extrabold text-slate-900 leading-tight">{{ (provider as any).name }}</h2>
              <span v-if="(provider as any).trusted" class="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md border border-amber-100">مورد اعتماد ساختمان</span>
            </div>
            <div class="text-xs text-slate-400 font-medium mt-1">{{ categories.find(c => c.value === (provider as any).category)?.label || (provider as any).category }} {{ (provider as any).area ? '• ' + (provider as any).area : '' }}</div>
            <div class="flex items-center gap-1 mt-1 text-amber-500 font-extrabold text-sm">
              <Icon name="i-lucide-star" class="w-4 h-4" />
              <span>{{ (provider as any).rating }}</span>
            </div>
          </div>
        </div>
        <p class="text-sm text-slate-600 font-medium leading-relaxed">{{ (provider as any).description }}</p>

        <div class="grid grid-cols-2 gap-3 mt-5">
          <div class="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <div class="text-[10px] text-slate-400 font-bold">تلفن</div>
            <a :href="'tel:' + (provider as any).phone" class="text-sm font-extrabold text-primary-600 hover:underline">{{ (provider as any).phone }}</a>
          </div>
          <div class="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <div class="text-[10px] text-slate-400 font-bold">ساعات کاری</div>
            <div class="text-sm font-extrabold text-slate-800">{{ (provider as any).workingHours }}</div>
          </div>
        </div>
      </AppCard>

      <a :href="'tel:' + (provider as any).phone" class="flex items-center justify-center gap-2 h-14 rounded-3xl bg-gradient-to-br from-primary-500 to-teal-600 text-white font-extrabold text-lg shadow-soft-lg hover:shadow-xl transition-all">
        <Icon name="i-lucide-phone" class="w-6 h-6" />
        تماس با {{ (provider as any).name }}
      </a>

      <AppCard v-if="isMgr" padding="md">
        <button @click="toggleTrusted((provider as any).id)" class="w-full h-11 rounded-xl font-extrabold text-sm transition-colors" :class="(provider as any).trusted ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-600 border border-slate-100'">{{ (provider as any).trusted ? 'حذف اعتماد ساختمان' : 'اعتماد ساختمان' }}</button>
      </AppCard>
    </div>

    <EmptyState v-else title="خدماتی یافت نشد" message="این خدمات در لیست وجود ندارد." />
  </div>
</template>
