<script setup lang="ts">
import type { ProblemCategory } from '~/types'
import { problemCategories } from '~/data/mock'

const router = useRouter()
const toast = useToast()
const { user } = useAuth()
const store = useAppStore()

useSeoMeta({
  title: 'گزارش مشکل جدید',
  ogTitle: 'گزارش مشکل جدید',
})

const building = computed(() => store.buildingOfUser(user.value))

const category = ref<ProblemCategory | null>(null)
const title = ref('')
const description = ref('')
const image = ref<string | undefined>(undefined)

const categoryError = ref('')
const titleError = ref('')
const descriptionError = ref('')

const saving = ref(false)

function submit() {
  if (saving.value) return
  categoryError.value = category.value ? '' : 'دسته‌بندی مشکل را انتخاب کنید.'
  titleError.value = title.value.trim() ? '' : 'عنوان مشکل را وارد کنید.'
  descriptionError.value = description.value.trim() ? '' : 'توضیح مشکل را وارد کنید.'
  if (categoryError.value || titleError.value || descriptionError.value) return
  if (!building.value || !user.value || !category.value) return

  saving.value = true
  const imageKey = resolveImagePayload(image.value)
  const report = store.createProblemReport(
    building.value.id,
    { category: category.value, title: title.value, description: description.value, image: imageKey },
    { id: user.value.id, name: user.value.name },
  )
  toast.add({ title: 'گزارش شما ثبت شد؛ مدیر ساختمان آن را بررسی می‌کند', color: 'success' })
  router.push(`/problems/${report.id}`)
}

function onCancel() {
  router.push('/problems')
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader title="گزارش مشکل" description="مشکل را ثبت کنید تا مدیر ساختمان پیگیری کند" />

    <AppCard>
      <form class="space-y-5" novalidate @submit.prevent="submit">
        <!-- دسته‌بندی -->
        <UFormField label="دسته‌بندی مشکل" size="lg" :error="categoryError || undefined" required class="w-full">
          <div class="grid w-full grid-cols-3 gap-2 sm:grid-cols-4">
            <button
              v-for="option in problemCategories"
              :key="option.id"
              type="button"
              class="flex flex-col items-center gap-1.5 rounded-xl px-1 py-3 ring-1 transition-colors"
              :class="category === option.id
                ? 'bg-teal-600 text-white ring-teal-600 dark:bg-teal-500 dark:ring-teal-500'
                : 'bg-white text-slate-600 ring-slate-200 hover:ring-teal-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-white/10 dark:hover:ring-teal-500/60'"
              @click="category = option.id"
            >
              <span class="flex size-9 items-center justify-center rounded-lg" :class="category === option.id ? 'bg-white/15' : option.tint">
                <Icon :name="option.icon" class="size-5" />
              </span>
              <span class="text-[11px] font-bold">{{ option.label }}</span>
            </button>
          </div>
        </UFormField>

        <BaseTextField
          v-model="title"
          label="عنوان مشکل"
          placeholder="مثلاً: چکه شیر آب پارکینگ"
          icon="i-lucide-circle-alert"
          required
          :error="titleError"
        />

        <BaseTextAreaField
          v-model="description"
          label="توضیحات"
          placeholder="جزئیات مشکل و محل دقیق آن را بنویسید…"
          :rows="4"
          required
          :error="descriptionError"
        />

        <BaseImageField v-model="image" label="تصویر" hint="اختیاری — عکس به پیگیری سریع‌تر کمک می‌کند" />

        <div class="flex gap-2 pt-1">
          <UButton
            type="submit"
            color="primary"
            variant="solid"
            size="lg"
            block
            icon="i-lucide-send"
            label="ثبت گزارش"
            :loading="saving"
          />
          <UButton
            type="button"
            color="neutral"
            variant="soft"
            size="lg"
            label="انصراف"
            class="shrink-0"
            @click="onCancel"
          />
        </div>
      </form>
    </AppCard>
  </div>
</template>
