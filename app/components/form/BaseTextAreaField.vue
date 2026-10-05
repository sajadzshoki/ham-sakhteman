<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string
    required?: boolean
    placeholder?: string
    rows?: number
    disabled?: boolean
  }>(),
  {
    label: undefined,
    hint: undefined,
    error: undefined,
    placeholder: undefined,
    rows: 3,
    disabled: false,
  },
)

const model = defineModel<string>({ default: '' })
</script>

<template>
  <UFormField :label="label" :hint="hint || undefined" :error="error || undefined" :required="required" size="lg" class="w-full">
    <UTextarea
      v-model="model"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      size="lg"
      class="w-full"
    />
  </UFormField>
</template>
