<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from './AppHeader.vue';
import FloatToolbar from './FloatToolbar.vue';
import { useScroll } from '@/composables/useScroll';

const route = useRoute();
const activePath = ref(route.path);
watch(
  () => route.path,
  (v) => (activePath.value = v),
  { immediate: true },
);

const compact = ref(false);
const showBackTop = ref(false);
useScroll(({ scrollTop }) => {
  compact.value = scrollTop > 400; // 之前是过 300 就藏 header,现在阈值放宽
  showBackTop.value = scrollTop > 300;
});
</script>

<template>
  <div class="default-layout">
    <AppHeader :active-path="activePath" :compact="compact" />
    <main class="main">
      <router-view />
    </main>
    <FloatToolbar :show-back-top="showBackTop" />
  </div>
</template>

<style scoped>
.default-layout {
  min-height: 100vh;
  background: var(--color-bg);
}

.main {
  padding-top: var(--header-height);
  min-height: 100vh;
}
</style>
