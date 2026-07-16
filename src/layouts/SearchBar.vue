<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  suggestions: { type: Array, default: () => [] },
  placeholder: { type: String, default: '大学智学网' },
});
const emit = defineEmits(['update:modelValue', 'search']);

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const focused = ref(false);
const showList = ref(false);

const currentPlaceholder = computed(() =>
  focused.value ? '搜索你感兴趣的任何事' : props.placeholder,
);

const filtered = computed(() => {
  if (!value.value) return [];
  const kw = value.value.toLowerCase();
  return props.suggestions.filter((s) => s.name.toLowerCase().includes(kw));
});

function highlight(text) {
  if (!value.value) return text;
  const safe = value.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(`(${safe})`, 'gi'),
    '<span class="hl">$1</span>',
  );
}

function onFocus() {
  focused.value = true;
  showList.value = true;
}
function onBlur() {
  focused.value = false;
  // 延时以便点击建议项能命中
  setTimeout(() => (showList.value = false), 120);
}
function pick(item) {
  value.value = item.name;
  emit('search', item);
  showList.value = false;
}
function onEnter() {
  emit('search', { name: value.value });
}
</script>

<template>
  <div class="search-box" :class="{ 'is-focused': focused }">
    <input
      v-model="value"
      class="search-input"
      :placeholder="currentPlaceholder"
      @focus="onFocus"
      @blur="onBlur"
      @keyup.enter="onEnter"
    />
    <div class="search-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
        <path fill="none" stroke="#86909c" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21l-4.343-4.343m0 0A8 8 0 1 0 5.343 5.343a8 8 0 0 0 11.314 11.314" />
      </svg>
    </div>
    <ul v-if="showList && filtered.length" class="search-list">
      <li
        v-for="item in filtered"
        :key="item.id"
        @mousedown.prevent="pick(item)"
        v-html="highlight(item.name)"
      />
    </ul>
  </div>
</template>

<style scoped>
.search-box {
  position: relative;
  width: 240px;
  height: 34px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: #fff;
  transition: width 0.3s ease, border-color 0.2s ease;
}
.search-box.is-focused {
  width: 360px;
  border-color: var(--color-primary);
  border-width: 2px;
}

.search-input {
  width: 100%;
  height: 100%;
  padding: 0 40px 0 var(--space-3);
  border: none;
  background: transparent;
  outline: none;
  font-size: var(--font-sm);
  color: var(--color-text-primary);
}
.search-input::placeholder {
  color: var(--color-text-placeholder);
}

.search-icon {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
}

.search-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 360px;
  max-height: 320px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  z-index: var(--z-modal);
}
.search-list li {
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  font-size: var(--font-sm);
}
.search-list li:hover {
  background: var(--color-bg-hover);
}
:deep(.hl) {
  color: var(--color-primary);
  font-weight: 600;
}
</style>
