<script setup lang="ts">
import { providerCategoryOf } from '~/data/mock'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { user, isManager } = useAuth()
const store = useAppStore()

const building = computed(() => store.buildingOfUser(user.value))
const provider = computed(() => store.getProvider(String(route.params.id)))

const category = computed(() => (provider.value ? providerCategoryOf(provider.value.category) : null))
const trusted = computed(() =>
  !!(building.value && provider.value) && store.isProviderTrusted(building.value.id, provider.value.id),
)

// عنوان فقط در صورت وجود ارائه‌دهنده افشا می‌شود
useSeoMeta({
  title: () => provider.value?.name ?? 'ارائه‌دهنده خدمات',
  ogTitle: () => provider.value?.name ?? 'ارائه‌دهنده خدمات',
})

async function toggleTrusted() {
  if (!building.value || !provider.value) return
  try {
    const nowTrusted = await store.toggleProviderTrusted(building.value.id, provider.value.id)
    toast.add({
      title: nowTrusted ? 'این ارائه‌دهنده به ساکنین پیشنهاد می‌شود' : 'از فهرست مورد اعتماد ساختمان خارج شد',
      color: nowTrusted ? 'success' : 'neutral',
    })
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error, 'تغییر وضعیت انجام نشد'), color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader title="ارائه‌دهنده خدمات" />

    <!-- ارائه‌دهنده پیدا نشد -->
    <EmptyState
      v-if="!provider"
      icon="i-lucide-circle-alert"
      title="ارائه‌دهنده پیدا نشد"
      description="ممکن است این مورد از فهرست خدمات حذف شده باشد یا پیوند معتبر نباشد."
    >
      <template #action>
        <UButton color="primary" variant="solid" size="md" label="بازگشت به خدمات" icon="i-lucide-arrow-right" @click="router.push('/services')" />
      </template>
    </EmptyState>

    <template v-else>
      <!-- کارت اطلاعات -->
      <AppCard as="article" padding="none" class="overflow-hidden">
        <AppImage
          v-if="provider.image"
          :src="provider.image"
          :alt="provider.name"
          aspect="aspect-[2/1]"
          rounded="rounded-none"
        />

        <div class="space-y-4 p-4">
          <div class="flex items-start gap-3">
            <span class="flex size-12 shrink-0 items-center justify-center rounded-xl" :class="category?.tint">
              <Icon :name="category?.icon ?? 'i-lucide-ellipsis'" class="size-6" />
            </span>
            <div class="min-w-0 flex-1">
              <h1 class="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                {{ provider.name }}
              </h1>
              <div class="mt-1.5 flex flex-wrap items-center gap-2">
                <span class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" :class="category?.tint">
                  <Icon :name="category?.icon ?? 'i-lucide-ellipsis'" class="size-3.5" />
                  {{ category?.label }}
                </span>
                <span
                  v-if="trusted"
                  class="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:bg-amber-400/10 dark:text-amber-300"
                >
                  <Icon name="i-lucide-badge-check" class="size-3.5" />
                  مورد اعتماد ساختمان
                </span>
              </div>
            </div>
          </div>

          <!-- امتیاز -->
          <div class="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/60">
            <Icon name="i-lucide-star" class="size-5 shrink-0 text-amber-500" />
            <p class="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              {{ formatRating(provider.rating) }}
              <span class="text-xs font-medium text-slate-400 dark:text-slate-500">از ۵</span>
            </p>
          </div>

          <p class="text-sm leading-7 text-slate-600 dark:text-slate-300">
            {{ provider.description }}
          </p>

          <!-- اطلاعات تماس و خدمات -->
          <div class="space-y-2.5 border-t border-slate-100 pt-4 text-sm text-slate-600 dark:border-white/5 dark:text-slate-300">
            <a
              :href="telHref(provider.phone)"
              class="flex items-center gap-2 font-bold text-teal-700 transition-colors hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
            >
              <Icon name="i-lucide-phone" class="size-4.5 shrink-0" />
              <span dir="ltr">{{ formatPhone(provider.phone) }}</span>
            </a>
            <p class="flex items-center gap-2">
              <Icon name="i-lucide-map-pin" class="size-4.5 shrink-0 text-slate-400 dark:text-slate-500" />
              محدوده خدمات: {{ provider.serviceArea }}
            </p>
            <p class="flex items-center gap-2">
              <Icon name="i-lucide-clock" class="size-4.5 shrink-0 text-slate-400 dark:text-slate-500" />
              ساعت کاری: {{ provider.workingHours }}
            </p>
          </div>
        </div>
      </AppCard>

      <!-- مورد اعتماد ساختمان — فقط مدیر -->
      <AppCard v-if="isManager && building">
        <div class="flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <Icon name="i-lucide-badge-check" class="size-4.5 shrink-0 text-amber-500" />
              مورد اعتماد ساختمان
            </p>
            <p class="mt-1 text-xs leading-5 text-slate-400 dark:text-slate-500">
              با فعال‌کردن این گزینه، این ارائه‌دهنده به ساکنین به‌عنوان انتخاب تأییدشده ساختمان معرفی می‌شود.
            </p>
          </div>
          <USwitch :model-value="trusted" class="shrink-0" @update:model-value="toggleTrusted" />
        </div>
      </AppCard>

      <!-- اقدام اصلی تماس — بالای ناوبری پایین چسبانده می‌شود -->
      <div class="sticky bottom-20 z-30 lg:bottom-4">
        <a
          :href="telHref(provider.phone)"
          class="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3.5 text-base font-extrabold text-white shadow-lg shadow-teal-600/30 transition-colors hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        >
          <Icon name="i-lucide-phone-call" class="size-5" />
          تماس با خدماتی
        </a>
      </div>

      <UButton
        color="neutral"
        variant="ghost"
        size="md"
        icon="i-lucide-arrow-right"
        label="بازگشت به خدمات"
        @click="router.push('/services')"
      />
    </template>
  </div>
</template>
