<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string
    required?: boolean
    type?: string
    placeholder?: string
    icon?: string
    disabled?: boolean
    /** جهت متن ورودی؛ برای شماره موبایل و کدها از «ltr» استفاده می‌شود */
    dir?: 'rtl' | 'ltr'
    /** برای فیلدهای عددی فارسی؛ مثلاً numeric */
    inputmode?: 'text' | 'numeric' | 'tel' | 'decimal'
  }>(),
  {
    label: undefined,
    hint: undefined,
    error: undefined,
    type: 'text',
    placeholder: undefined,
    icon: undefined,
    disabled: false,
    dir: undefined,
    inputmode: undefined,
  },
)

const model = defineModel<string>({ default: '' })
</script>

<template>
  <UFormField :label="label" :hint="hint || undefined" :error="error || undefined" :required="required" size="lg" class="w-full">
    <UInput
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :icon="icon"
      :disabled="disabled"
      :dir="dir"
      :inputmode="inputmode"
      size="lg"
      class="w-full"
    />
  </UFormField>
</template>
