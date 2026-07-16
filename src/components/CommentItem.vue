<script setup>
import { computed } from 'vue';
import { ElAvatar } from 'element-plus';
import { useTimeAgo } from '@/composables/useTimeAgo';

const props = defineProps({
  time: { type: [Number, String], default: () => Date.now() },
  userName: { type: String, default: '匿名' },
  like: { type: [Number, String], default: 0 },
  content: { type: String, default: '' },
  avatar: { type: String, default: '' },
});

const timeMs = computed(() => {
  const n = Number(props.time);
  return Number.isFinite(n) ? n : Date.now();
});
const timeAgo = useTimeAgo(timeMs);

const initial = computed(() => (props.userName || '?').slice(0, 1));
</script>

<template>
  <article class="comment-item">
    <div class="header">
      <el-avatar :src="avatar" :size="40">{{ initial }}</el-avatar>
      <div class="header-info">
        <div class="name">{{ userName }}</div>
        <div class="time">{{ timeAgo }}</div>
      </div>
    </div>
    <p class="content">{{ content }}</p>
    <footer class="footer">
      <button class="action" aria-label="分享">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
          <path fill="currentColor" d="m13.576 17.271l-5.11-2.787a3.5 3.5 0 1 1 0-4.968l5.11-2.787a3.5 3.5 0 1 1 .958 1.755l-5.11 2.787a3.5 3.5 0 0 1 0 1.457l5.11 2.788a3.5 3.5 0 1 1-.958 1.755" />
        </svg>
      </button>
      <button class="action">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 23a1 1 0 0 1-1-1v-3H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4.1l-3.7 3.71c-.2.18-.44.29-.7.29zm1-6v3.08L16.08 17H21V7H7v10zM3 15H1V3a2 2 0 0 1 2-2h16v2H3zm6-6h10v2H9zm0 4h8v2H9z" />
        </svg>
        <span>回复</span>
      </button>
      <button class="action">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
          <path fill="currentColor" d="M7.24 11v9H5.63c-.9 0-1.62-.72-1.62-1.61v-5.77c0-.89.73-1.62 1.62-1.62zM18.5 9.5h-4.78V6c0-1.1-.9-2-1.99-2h-.09c-.4 0-.76.24-.92.61L7.99 11v9h9.2c.73 0 1.35-.52 1.48-1.24l1.32-7.5c.16-.92-.54-1.76-1.48-1.76Z" />
        </svg>
        <span>{{ like }}</span>
      </button>
    </footer>
  </article>
</template>

<style scoped>
.comment-item {
  padding: var(--space-4);
  background: #fff;
  border-radius: var(--radius-md);
}

.header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.header-info {
  display: flex;
  flex-direction: column;
}

.name {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--color-text-primary);
}

.time {
  font-size: var(--font-xs);
  color: var(--color-text-tertiary);
}

.content {
  margin: var(--space-3) 0 var(--space-2) 52px;
  font-size: var(--font-sm);
  color: var(--color-text-primary);
  line-height: 1.6;
}

.footer {
  display: flex;
  gap: var(--space-6);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
  margin-top: var(--space-2);
}

.action {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  font-size: var(--font-sm);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color 0.15s ease, background 0.15s ease;
}
.action:hover {
  color: var(--color-primary);
  background: var(--color-bg-hover);
}
</style>
