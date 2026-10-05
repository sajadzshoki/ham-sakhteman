<script setup lang="ts">
/** فیلد تصویر اختیاری: انتخاب فایل، پیش‌نمایش فشرده و حذف */
withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string
  }>(),
  {
    label: undefined,
    hint: undefined,
    error: undefined,
  },
)

/** مقدار می‌تواند دیتای تصویر یا کلید مرجع `img:` (تصویر ذخیره‌شده قبلی) باشد */
const model = defineModel<string>()
const toast = useToast()
const inputRef = ref<HTMLInputElement>()
const busy = ref(false)

const previewSrc = computed(() => {
  if (!model.value) return null
  if (isImageKey(model.value)) return loadImage(model.value)
  return model.value
})

function pick() {
  inputRef.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  busy.value = true
  const result = await readImageFile(file)
  busy.value = false

  if (!result.ok) {
    toast.add({
      title: result.error === 'size'
        ? 'حجم تصویر زیاد است؛ تصویر کوچک‌تری انتخاب کنید.'
        : 'فایل انتخابی یک تصویر معتبر نیست.',
      color: 'error',
    })
    return
  }
  model.value = result.dataUrl
}

function clear() {
  model.value = undefined
}
</script>

<template>
  <UFormField :label="label" :hint="hint || undefined" :error="error || undefined" size="lg" class="w-full items-stretch">
    <div v-if="model" class="relative w-full">
      <img
        v-if="previewSrc"
        :src="previewSrc"
        alt="پیش‌نمایش تصویر انتخابی"
        class="aspect-video w-full rounded-xl object-cover ring-1 ring-slate-950/10 dark:ring-white/10"
      >
      <div
        v-else
        class="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-slate-400 ring-1 ring-slate-950/10 dark:bg-slate-800/70 dark:ring-white/10"
      >
        <Icon name="i-lucide-image-off" class="size-6" />
        <span class="text-[11px] font-medium">تصویر در دسترس نیست — می‌توانید آن را حذف کنید</span>
      </div>
      <button
        type="button"
        aria-label="حذف تصویر"
        class="absolute end-2 top-2 flex size-8 items-center justify-center rounded-full bg-slate-950/55 text-white backdrop-blur-sm transition-colors hover:bg-slate-950/75"
        @click="clear"
      >
        <Icon name="i-lucide-x" class="size-4" />
      </button>
    </div>
    <button
      v-else
      type="button"
      :disabled="busy"
      class="flex aspect-[3/1.4] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 transition-colors hover:border-teal-400 hover:text-teal-600 disabled:opacity-60 dark:border-slate-700 dark:text-slate-400 dark:hover:border-teal-500 dark:hover:text-teal-300"
      @click="pick"
    >
      <Icon :name="busy ? 'i-lucide-loader-circle' : 'i-lucide-image-plus'" class="size-6" :class="busy && 'animate-spin'" />
      <span class="text-xs font-semibold">{{ busy ? 'در حال آماده‌سازی تصویر…' : 'افزودن تصویر (اختیاری)' }}</span>
    </button>
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      class="hidden"
      tabindex="-1"
      @change="onFileChange"
    >
  </UFormField>
</template>
