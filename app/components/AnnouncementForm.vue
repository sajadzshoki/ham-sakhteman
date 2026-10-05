<script setup lang="ts">
import type { AnnouncementImportance } from '~/types'

/**
 * فرم مشترک ایجاد و ویرایش اطلاعیه.
 * مقدار تصویر می‌تواند دیتای تازه (پیش‌نمایش انتخاب کاربر)، کلید مرجع تصویر
 * ذخیره‌شده قبلی، یا بدون تصویر باشد — صفحه مقصد ذخیره‌سازی نهایی را انجام می‌دهد.
 */
const props = withDefaults(
  defineProps<{
    initialTitle?: string
    initialBody?: string
    initialImportance?: AnnouncementImportance
    initialImage?: string
    submitLabel: string
    submitIcon?: string
    busy?: boolean
  }>(),
  {
    initialTitle: '',
    initialBody: '',
    initialImportance: 'normal',
    initialImage: undefined,
    submitIcon: 'i-lucide-send',
    busy: false,
  },
)

const emit = defineEmits<{
  submit: [payload: { title: string; body: string; importance: AnnouncementImportance; image: string | undefined }]
  cancel: []
}>()

const title = ref(props.initialTitle)
const body = ref(props.initialBody)
const importance = ref<AnnouncementImportance>(props.initialImportance)
const image = ref<string | undefined>(props.initialImage)

const titleError = ref('')
const bodyError = ref('')

const importanceOptions: { id: AnnouncementImportance; label: string; hint: string; icon: string }[] = [
  { id: 'normal', label: 'عادی', hint: 'اطلاع‌رسانی معمول', icon: 'i-lucide-info' },
  { id: 'important', label: 'مهم', hint: 'نیازمند توجه ساکنین', icon: 'i-lucide-megaphone' },
]

function submit() {
  if (props.busy) return
  titleError.value = title.value.trim() ? '' : 'عنوان اطلاعیه را وارد کنید.'
  bodyError.value = body.value.trim() ? '' : 'متن اطلاعیه را وارد کنید.'
  if (titleError.value || bodyError.value) return

  emit('submit', {
    title: title.value.trim(),
    body: body.value.trim(),
    importance: importance.value,
    image: image.value,
  })
}
</script>

<template>
  <form class="space-y-5" novalidate @submit.prevent="submit">
    <BaseTextField
      v-model="title"
      label="عنوان اطلاعیه"
      placeholder="مثلاً: سرویس دوره‌ای آسانسور"
      icon="i-lucide-type"
      required
      :error="titleError"
    />

    <BaseTextAreaField
      v-model="body"
      label="متن اطلاعیه"
      placeholder="جزئیات اطلاعیه را برای ساکنین بنویسید…"
      :rows="5"
      required
      :error="bodyError"
    />

    <UFormField label="اهمیت" size="lg" class="w-full">
      <div class="grid w-full grid-cols-2 gap-2">
        <button
          v-for="option in importanceOptions"
          :key="option.id"
          type="button"
          class="flex flex-col items-start gap-1 rounded-xl px-3.5 py-3 text-start ring-1 transition-colors"
          :class="importance === option.id
            ? 'bg-teal-600 text-white ring-teal-600 dark:bg-teal-500 dark:ring-teal-500'
            : 'bg-white text-slate-600 ring-slate-200 hover:ring-teal-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-white/10 dark:hover:ring-teal-500/60'"
          @click="importance = option.id"
        >
          <span class="flex items-center gap-1.5 text-sm font-bold">
            <Icon :name="option.icon" class="size-4" />
            {{ option.label }}
          </span>
          <span class="text-[11px] opacity-80">{{ option.hint }}</span>
        </button>
      </div>
    </UFormField>

    <BaseImageField v-model="image" label="تصویر" hint="اختیاری — تصویر کوچک‌سازی و ذخیره می‌شود" />

    <div class="flex gap-2 pt-1">
      <UButton
        type="submit"
        color="primary"
        variant="solid"
        size="lg"
        block
        :icon="submitIcon"
        :label="submitLabel"
        :loading="busy"
      />
      <UButton
        type="button"
        color="neutral"
        variant="soft"
        size="lg"
        label="انصراف"
        class="shrink-0"
        @click="emit('cancel')"
      />
    </div>
  </form>
</template>
