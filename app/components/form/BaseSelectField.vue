<script setup lang="ts">
export interface SelectOption {
  label: string
  value: string
}

withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string
    required?: boolean
    items: SelectOption[]
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    label: undefined,
    hint: undefined,
    error: undefined,
    placeholder: undefined,
    disabled: false,
  },
)

const model = defineModel<string | undefined>()
</script>

<template>
  <UFormField :label="label" :hint="hint || undefined" :error="error || undefined" :required="required" size="lg" class="w-full">
    <USelect
      v-model="model"
      :items="items"
      :placeholder="placeholder"
      :disabled="disabled"
      size="lg"
      class="w-full"
    />
  </UFormField>
</template>
