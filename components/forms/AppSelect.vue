<script setup lang="ts">
const props = withDefaults(defineProps<{ modelValue?: string; label?: string; options?: { value: string; label: string }[] }>(), { modelValue: '', label: '', options: () => [] })
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <div class="w-full">
    <label v-if="props.label" class="block text-xs font-bold text-slate-600 mb-1.5">{{ props.label }}</label>
    <select
      :value="props.modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all shadow-soft appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%230f172a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat"
    >
      <option v-for="o in props.options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
  </div>
</template>
