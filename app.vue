<script setup lang="ts">
const { locale } = useI18n()
const dir = computed(() => (locale.value === 'fa' ? 'rtl' : 'ltr'))

useHead(() => ({
  htmlAttrs: {
    lang: locale.value === 'fa' ? 'fa' : 'en',
    dir: dir.value,
  },
  bodyAttrs: {
    class: 'font-vazirmatn antialiased',
    dir: dir.value,
  },
}))
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
