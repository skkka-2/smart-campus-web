<script setup>
import { computed } from 'vue';
import AvatarWithFallback from './AvatarWithFallback.vue';

const props = defineProps({
  job: { type: Object, required: true },
});

const emit = defineEmits(['open', 'favorite']);

const matchClass = computed(() => {
  const s = props.job.match_score;
  if (s == null) return 'none';
  if (s >= 85) return 'excellent';
  if (s >= 65) return 'good';
  if (s >= 40) return 'ok';
  return 'low';
});

const workTypeLabel = computed(() => {
  const m = { internship: '实习', campus: '校招', social: '社招' };
  return m[props.job.work_type] || '';
});
</script>

<template>
  <article class="job-card" @click="emit('open', job)">
    <!-- 顶部:公司 + 标签 -->
    <header class="head">
      <AvatarWithFallback
        :src="job.company_logo"
        :name="job.company"
        :size="40"
      />
      <div class="head-info">
        <div class="company-line">
          <span class="company">{{ job.company }}</span>
          <span class="dot">·</span>
          <span class="company-meta">{{ job.company_size || '' }}</span>
        </div>
        <div class="industry">{{ job.industry || '' }}</div>
      </div>

      <div class="badges">
        <span v-if="job.is_urgent" class="badge urgent">急招</span>
        <span v-if="job.is_hot" class="badge hot">热招</span>
        <span v-if="workTypeLabel" class="badge type" :class="job.work_type">{{ workTypeLabel }}</span>
      </div>
    </header>

    <!-- 中间:岗位 + 薪资 -->
    <div class="title-row">
      <h3 class="title text-ellipsis">{{ job.title }}</h3>
      <div class="salary">{{ job.salary_display }}</div>
    </div>

    <!-- 关键属性 -->
    <div class="meta">
      <span class="meta-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12q.825 0 1.413-.587T14 10t-.587-1.412T12 8t-1.412.588T10 10t.588 1.413T12 12m0 10q-4.025-3.425-6.012-6.362T4 10.2q0-3.75 2.413-5.975T12 2t5.588 2.225T20 10.2q0 2.5-1.987 5.438T12 22" /></svg>
        {{ job.city }}
      </span>
      <span class="meta-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2m-6 0h-4V4h4z" /></svg>
        {{ job.experience_required }}
      </span>
      <span class="meta-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9zm6.82 6L12 12.72L5.18 9L12 5.28zM17 15.99l-5 2.73l-5-2.73v-3.72L12 15l5-2.73z" /></svg>
        {{ job.degree_required }}
      </span>
    </div>

    <!-- 标签 -->
    <div v-if="job.tags && job.tags.length" class="tags">
      <span v-for="t in job.tags.slice(0, 5)" :key="t" class="tag">{{ t }}</span>
    </div>

    <!-- 底部:匹配度 + 已收藏/已投递 状态 -->
    <footer class="foot">
      <span v-if="job.match_score != null" class="match" :class="matchClass">
        <span class="match-dot" />
        匹配度 {{ job.match_score }}%
      </span>
      <span v-else class="hint">补全画像可看匹配度</span>

      <div class="foot-right">
        <span v-if="job.applied" class="applied">已投递</span>
        <button
          class="fav-btn"
          :class="{ active: job.favorited }"
          @click.stop="emit('favorite', job)"
          :aria-label="job.favorited ? '取消收藏' : '收藏'"
        >
          <svg v-if="job.favorited" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" /></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12.1 18.55L12 18.65l-.11-.1C7.14 14.24 4 11.39 4 8.5C4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5c0 2.89-3.14 5.74-7.9 10.05M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3C4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5C22 5.42 19.58 3 16.5 3" /></svg>
        </button>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.job-card {
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid transparent;
}
.job-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  border-color: rgba(30, 128, 255, 0.15);
}

/* Head */
.head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.head-info {
  flex: 1;
  min-width: 0;
}
.company-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  color: var(--color-text-primary);
}
.company {
  font-size: 15px;
  font-weight: 600;
}
.company-meta {
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.dot {
  color: var(--color-text-tertiary);
  font-weight: 700;
}
.industry {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.badges {
  display: flex;
  gap: 4px;
}
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
}
.badge.urgent { background: #fff2f0; color: #ff4d4f; }
.badge.hot    { background: #fff7e6; color: #fa8c16; }
.badge.type   { background: #e6f7ff; color: #1890ff; }
.badge.type.campus { background: #f6ffed; color: #52c41a; }

/* Title row */
.title-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
}
.title {
  flex: 1;
  min-width: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.3;
}
.salary {
  font-size: 16px;
  font-weight: 700;
  color: #ff5722;
  white-space: nowrap;
}

/* Meta */
.meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.meta-item svg {
  color: var(--color-text-tertiary);
}

/* Tags */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.tag {
  padding: 3px 10px;
  background: #f5f5f7;
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* Foot */
.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px dashed var(--color-border);
}
.match {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}
.match-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.match.excellent { color: #52c41a; }
.match.excellent .match-dot { background: #52c41a; box-shadow: 0 0 6px rgba(82, 196, 26, 0.5); }
.match.good      { color: #1890ff; }
.match.good      .match-dot { background: #1890ff; }
.match.ok        { color: #faad14; }
.match.ok        .match-dot { background: #faad14; }
.match.low       { color: var(--color-text-tertiary); }
.match.low       .match-dot { background: var(--color-text-tertiary); }
.hint {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.foot-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.applied {
  padding: 3px 10px;
  background: #e6f4ff;
  color: #0958d9;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.fav-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.fav-btn:hover {
  background: #fff2f0;
  color: #ff4d4f;
}
.fav-btn.active {
  color: #ff4d4f;
}
</style>
