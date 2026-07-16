<script setup>
defineProps({
  title: { type: String, default: '' },
  cont: { type: String, default: '' },
  picUrl: { type: String, default: '' },
  like: { type: [Number, String], default: 0 },
  view: { type: String, default: '0' },
  user: { type: String, default: '' },
});
</script>

<template>
  <article class="article-card">
    <div class="body">
      <h3 class="title text-ellipsis">{{ title || '无标题' }}</h3>
      <p class="excerpt text-clamp-2">{{ cont }}</p>
      <footer class="meta">
        <span v-if="user" class="author">{{ user }}</span>
        <span class="stat">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5" />
          </svg>
          {{ view }}
        </span>
        <span class="stat">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
            <path fill="currentColor" fill-rule="evenodd" d="M15.03 9.684h3.965c.322 0 .64.08.925.232s.532.374.717.645a2.11 2.11 0 0 1 .242 1.883l-2.36 7.201c-.288.814-.48 1.355-1.884 1.355c-2.072 0-4.276-.677-6.157-1.256c-.472-.145-.924-.284-1.348-.404h-.115V9.478a25.5 25.5 0 0 0 4.238-5.514a1.8 1.8 0 0 1 .901-.83a1.74 1.74 0 0 1 1.21-.048c.396.13.736.397.96.757c.225.36.32.788.269 1.211zM4.177 10H7v8a2 2 0 1 1-4 0v-6.823C3 10.527 3.527 10 4.176 10Z" clip-rule="evenodd" />
          </svg>
          {{ like }}
        </span>
      </footer>
    </div>
    <img v-if="picUrl" class="cover" :src="picUrl" alt="" />
  </article>
</template>

<style scoped>
.article-card {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background 0.15s ease;
}
.article-card:hover {
  background: var(--color-bg-hover);
}

.body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.title {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--color-text-primary);
}

.excerpt {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.meta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-top: auto;
  font-size: var(--font-xs);
  color: var(--color-text-tertiary);
}
.author {
  padding-right: var(--space-3);
  border-right: 1px solid var(--color-border);
}
.stat {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  transition: color 0.15s ease;
}
.stat:hover {
  color: var(--color-primary);
}

.cover {
  flex: 0 0 auto;
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}
</style>
