<script setup>
import { ref } from 'vue';

const emit = defineEmits(['change']);

const categories = [
  { id: 'all',    label: '全部动态',  icon: '📰' },
  { id: 'focus',  label: '关注',      icon: '⭐' },
  { id: 'campus', label: '校招就业',  icon: '💼' },
  { id: 'grad',   label: '考研考公',  icon: '📚' },
  { id: 'cert',   label: '考级考证',  icon: '🎓' },
  { id: 'match',  label: '学生竞赛',  icon: '🏆' },
  { id: 'innov',  label: '创新创业',  icon: '🚀' },
];

const selected = ref('all');
function pick(id) {
  selected.value = id;
  emit('change', id);
}
</script>

<template>
  <aside class="home-sidebar">
    <ul class="menu">
      <li
        v-for="c in categories"
        :key="c.id"
        class="menu-item"
        :class="{ active: selected === c.id }"
        @click="pick(c.id)"
      >
        <span class="icon" aria-hidden="true">{{ c.icon }}</span>
        <span class="label">{{ c.label }}</span>
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
