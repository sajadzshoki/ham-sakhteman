<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}>(), {
  title: 'تأیید', message: 'آیا مطمئن هستید؟', confirmText: 'تأیید', cancelText: 'لغو', destructive: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const open = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
const confirm = () => { emit('confirm'); open.value = false }
const cancel = () => { emit('cancel'); open.value = false }
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" @click="cancel" />
      <div class="relative z-10 bg-white rounded-3xl p-6 md:p-7 w-full max-w-md shadow-2xl border border-slate-100">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center shadow-soft" :class="destructive ? 'bg-rose-50 text-rose-500' : 'bg-primary-50 text-primary-600'">
            <Icon :name="destructive ? 'i-lucide-trash-2' : 'i-lucide-help-circle'" class="w-5 h-5" />
          </div>
          <h3 class="text-lg font-extrabold text-slate-900 leading-tight">{{ title }}</h3>
        </div>
        <p class="text-sm text-slate-500 font-medium leading-relaxed mb-6">{{ message }}</p>
        <div class="flex items-center gap-3">
          <button class="flex-1 h-11 rounded-xl bg-slate-100 text-slate-700 font-extrabold hover:bg-slate-200 transition-colors text-sm" @click="cancel">{{ cancelText }}</button>
          <button class="flex-1 h-11 rounded-xl font-extrabold shadow-soft text-white text-sm transition-colors" :class="destructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-primary-600 hover:bg-primary-700'" @click="confirm">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
