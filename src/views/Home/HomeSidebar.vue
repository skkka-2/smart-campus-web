<script setup>
import { ref, onMounted } from 'vue';
import { listCategories } from '@/api/CreatPart';

const emit = defineEmits(['change']);

const categories = ref([]);
const selected = ref('all');

onMounted(async () => {
  try {
    const data = await listCategories();
    categories.value = data?.items || [];
  } catch (err) {
    console.error('[HomeSidebar] load categories failed:', err);
  }
});

function pick(slug) {
  if (slug === selected.value) return;
  selected.value = slug;
  emit('change', slug);
}
</script>

<template>
  <aside class="home-sidebar">
    <ul class="menu">
      <li
        v-for="c in categories"
        :key="c.id"
        class="menu-item"
        :class="{ active: selected === c.slug }"
        @click="pick(c.slug)"
      >
        <span class="icon" aria-hidden="true">{{ c.icon }}</span>
        <span class="label">{{ c.name }}</span>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.home-sidebar {
  position: sticky;
  top: calc(var(--header-height) + var(--space-4));
  background: #fff;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  box-shadow: var(--shadow-sm);
  align-self: flex-start;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: var(--font-md);
  transition: background 0.15s ease, color 0.15s ease;
}
.menu-item:hover {
  background: var(--color-bg-hover);
}
.menu-item.active {
  color: var(--color-primary);
  background: rgba(30, 128, 255, 0.08);
  font-weight: 600;
}
.icon {
  font-size: 18px;
  line-height: 1;
}
</style>
