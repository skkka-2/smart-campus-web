<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ElInput, ElSelect, ElOption, ElButton, ElSkeleton, ElEmpty, ElMessage } from 'element-plus';
import JobCard from '@/components/JobCard.vue';
import { listJobs, fetchFilterOptions, recommendJobs, toggleFavorite } from '@/api/JobPart';
import { useAuth } from '@/composables/useAuth';
import { throttle } from '@/composables/useDebounce';

const router = useRouter();
const { isLogin, requireLogin } = useAuth();

// 筛选状态
const filters = ref({
  keyword: '',
  city: '',
  category: '',
  workType: '',
  degree: '',
});
const sort = ref('default');
const SORT_OPTIONS = [
  { value: 'default', label: '综合排序' },
  { value: 'latest',  label: '最新发布' },
  { value: 'salary',  label: '薪资优先' },
  { value: 'hot',     label: '热度优先' },
];

// 筛选面板选项(从后端拉)
const options = ref({ cities: [], categories: [], degrees: [] });
const WORK_TYPES = [
  { value: '', label: '不限' },
  { value: 'internship', label: '实习' },
  { value: 'campus', label: '校招' },
];

// 列表状态
const items = ref([]);
const total = ref(0);
const page = ref(1);
const hasMore = ref(true);
const loading = ref(false);
const initLoading = ref(true);

// 推荐区
const recommendations = ref([]);

async function loadFilterOptions() {
  try {
    options.value = await fetchFilterOptions();
  } catch (err) {
    console.error('[Jobs] load filter options failed:', err);
  }
}

async function loadJobs({ reset = false } = {}) {
  if (loading.value) return;
  if (reset) {
    page.value = 1;
    items.value = [];
    hasMore.value = true;
    initLoading.value = true;
  }
  if (!hasMore.value) return;
  loading.value = true;
  try {
    const data = await listJobs({
      ...filters.value,
      sort: sort.value,
      page: page.value,
      limit: 8,
    });
    items.value.push(...(data.items || []));
    total.value = data.total || 0;
    hasMore.value = !!data.hasMore;
    page.value += 1;
  } catch (err) {
    console.error('[Jobs] loadJobs failed:', err);
  } finally {
    loading.value = false;
    initLoading.value = false;
  }
}

async function loadRecommend() {
  try {
    const data = await recommendJobs({ limit: 6 });
    recommendations.value = data?.items || [];
  } catch (err) {
    console.error('[Jobs] load recommend failed:', err);
  }
}

// 触底加载
const onScroll = throttle(() => {
  const st = document.documentElement.scrollTop;
  const ch = document.documentElement.clientHeight;
  const sh = document.documentElement.scrollHeight;
  if (st + ch >= sh - 300) loadJobs();
}, 200);

// 筛选切换
function pickFilter(field, value) {
  if (filters.value[field] === value) return;
  filters.value[field] = value;
  loadJobs({ reset: true });
}

function resetAllFilters() {
  filters.value = { keyword: '', city: '', category: '', workType: '', degree: '' };
  sort.value = 'default';
  loadJobs({ reset: true });
}

function onKeywordSearch() {
  loadJobs({ reset: true });
}

function goDetail(job) {
  router.push(`/jobs/${job.id}`);
}

async function onFavorite(job) {
  if (!requireLogin('登录后才能收藏')) return;
  try {
    const data = await toggleFavorite(job.id);
    // 直接在本地更新,避免整页重载
    const idx = items.value.findIndex((j) => j.id === job.id);
    if (idx !== -1) items.value[idx] = { ...items.value[idx], favorited: data.favorited };
    const recIdx = recommendations.value.findIndex((j) => j.id === job.id);
    if (recIdx !== -1) recommendations.value[recIdx] = { ...recommendations.value[recIdx], favorited: data.favorited };
    ElMessage.success(data.favorited ? '已收藏' : '已取消收藏');
  } catch (err) {
    console.error('[Jobs] favorite failed:', err);
  }
}

watch(sort, () => loadJobs({ reset: true }));

onMounted(async () => {
  await Promise.all([loadFilterOptions(), loadJobs(), loadRecommend()]);
  window.addEventListener('scroll', onScroll, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
  <div class="jobs-page">
    <!-- Hero 顶部搜索区 -->
    <section class="hero">
      <div class="hero-inner">
        <h1 class="hero-title">找到属于你的第一份实习</h1>
        <p class="hero-sub">80+ 真实校招/实习岗位 · 智能匹配 · 一键投递</p>

        <div class="search-box">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索岗位名或公司(如 前端 / 字节 / 算法)"
            size="large"
            class="search-input"
            @keyup.enter="onKeywordSearch"
          >
            <template #prefix>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21l-4.343-4.343m0 0A8 8 0 1 0 5.343 5.343a8 8 0 0 0 11.314 11.314"/></svg>
            </template>
          </el-input>
          <el-button type="primary" size="large" @click="onKeywordSearch">搜索</el-button>
        </div>

        <div class="hero-stats">
          <div><b>{{ total || '80+' }}</b> 岗位</div>
          <div><b>{{ options.cities.length || 6 }}</b> 城市</div>
          <div><b>{{ options.categories.length || 8 }}</b> 方向</div>
        </div>
      </div>
    </section>

    <!-- 主体 -->
    <div class="body">
      <!-- 左筛选 -->
      <aside class="filter-panel">
        <div class="filter-block">
          <div class="filter-head">
            <span class="filter-title">筛选</span>
            <button v-if="filters.city || filters.category || filters.workType || filters.degree" class="reset-btn" @click="resetAllFilters">重置</button>
          </div>
        </div>

        <div class="filter-block">
          <div class="filter-label">工作类型</div>
          <div class="chip-group">
            <button
              v-for="w in WORK_TYPES"
              :key="w.value"
              class="chip"
              :class="{ active: filters.workType === w.value }"
              @click="pickFilter('workType', w.value)"
            >
              {{ w.label }}
            </button>
          </div>
        </div>

        <div class="filter-block">
          <div class="filter-label">城市</div>
          <div class="chip-group">
            <button class="chip" :class="{ active: !filters.city }" @click="pickFilter('city', '')">不限</button>
            <button
              v-for="c in options.cities"
              :key="c.city"
              class="chip"
              :class="{ active: filters.city === c.city }"
              @click="pickFilter('city', c.city)"
            >
              {{ c.city }}
              <span class="chip-count">{{ c.n }}</span>
            </button>
          </div>
        </div>

        <div class="filter-block">
          <div class="filter-label">方向</div>
          <div class="chip-group">
            <button class="chip" :class="{ active: !filters.category }" @click="pickFilter('category', '')">全部</button>
            <button
              v-for="c in options.categories"
              :key="c.category"
              class="chip"
              :class="{ active: filters.category === c.category }"
              @click="pickFilter('category', c.category)"
            >
              {{ c.category }}
              <span class="chip-count">{{ c.n }}</span>
            </button>
          </div>
        </div>

        <div class="filter-block">
          <div class="filter-label">学历</div>
          <div class="chip-group">
            <button class="chip" :class="{ active: !filters.degree }" @click="pickFilter('degree', '')">不限</button>
            <button
              v-for="d in options.degrees"
              :key="d.degree_required"
              class="chip"
              :class="{ active: filters.degree === d.degree_required }"
              @click="pickFilter('degree', d.degree_required)"
            >
              {{ d.degree_required }}
            </button>
          </div>
        </div>
      </aside>

      <!-- 中间列表 -->
      <main class="job-list">
        <div class="list-head">
          <div class="list-count">
            共 <b>{{ total }}</b> 个岗位
          </div>
          <el-select v-model="sort" size="small" style="width: 140px">
            <el-option v-for="o in SORT_OPTIONS" :key="o.value" :value="o.value" :label="o.label" />
          </el-select>
        </div>

        <el-skeleton v-if="initLoading" :rows="8" animated />

        <template v-else>
          <div v-if="items.length" class="cards">
            <JobCard
              v-for="job in items"
              :key="job.id"
              :job="job"
              @open="goDetail"
              @favorite="onFavorite"
            />
          </div>
          <el-empty v-else description="没有找到匹配的岗位,试试其他筛选条件" />

          <div v-if="loading && items.length" class="tip">加载中...</div>
          <div v-else-if="!hasMore && items.length" class="tip">已经到底了 🎉</div>
        </template>
      </main>

      <!-- 右侧推荐 -->
      <aside class="side-panel">
        <div class="side-card">
          <div class="side-head">
            <h3 class="side-title">
              <span class="side-badge">✨</span>
              为你推荐
            </h3>
            <span v-if="!isLogin" class="side-hint">登录后个性化</span>
          </div>

          <ul v-if="recommendations.length" class="rec-list">
            <li
              v-for="job in recommendations"
              :key="job.id"
              class="rec-item"
              @click="goDetail(job)"
            >
              <div class="rec-title text-ellipsis">{{ job.title }}</div>
              <div class="rec-meta">
                <span>{{ job.company }}</span>
                <span class="rec-dot">·</span>
                <span>{{ job.city }}</span>
                <span class="rec-salary">{{ job.salary_display }}</span>
              </div>
              <div v-if="job.match_score != null" class="rec-match">
                匹配度 {{ job.match_score }}%
              </div>
            </li>
          </ul>
          <el-empty v-else description="暂无推荐" :image-size="60" />
        </div>

        <div class="side-card side-cta" v-if="!isLogin">
          <h4>登录解锁个性化推荐</h4>
          <p>基于你的专业、年级、城市偏好精准匹配岗位</p>
          <el-button type="primary" round @click="router.push('/login')">立即登录</el-button>
        </div>

        <div class="side-card side-cta" v-else>
          <h4>完善画像 · 提升匹配度</h4>
          <p>补充专业、方向、意向城市等信息,匹配度更精准</p>
          <el-button type="primary" round @click="router.push('/profile')">完善我的画像</el-button>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.jobs-page {
  min-height: 100vh;
  padding-bottom: 60px;
}

/* Hero */
.hero {
  background: linear-gradient(135deg, #1e80ff 0%, #4c5cff 50%, #7b3ff2 100%);
  color: #fff;
  padding: 48px 24px 40px;
  text-align: center;
}
.hero-inner {
  max-width: 720px;
  margin: 0 auto;
}
.hero-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.hero-sub {
  font-size: 15px;
  opacity: 0.88;
  margin-bottom: 24px;
}
.search-box {
  display: flex;
  gap: 8px;
  background: #fff;
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}
.search-input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  padding-left: 12px;
}
.hero-stats {
  display: flex;
  justify-content: center;
  gap: 48px;
  margin-top: 24px;
  font-size: 13px;
  opacity: 0.85;
}
.hero-stats b {
  font-size: 20px;
  margin-right: 4px;
  color: #fff;
  font-weight: 700;
}

/* Body */
.body {
  max-width: 1280px;
  margin: 24px auto 0;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 300px;
  gap: 20px;
}

/* Filter panel */
.filter-panel {
  position: sticky;
  top: calc(var(--header-height) + 16px);
  align-self: flex-start;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.filter-block {
  margin-bottom: 20px;
}
.filter-block:last-child {
  margin-bottom: 0;
}
.filter-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-title {
  font-size: 16px;
  font-weight: 600;
}
.reset-btn {
  padding: 0;
  font-size: 12px;
  color: var(--color-primary);
  background: transparent;
  border: none;
  cursor: pointer;
}
.filter-label {
  font-size: 13px;
  color: var(--color-text-tertiary);
  margin-bottom: 8px;
  font-weight: 500;
}
.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  padding: 5px 10px;
  background: #f5f5f7;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}
.chip:hover {
  background: #e6f4ff;
  color: var(--color-primary);
}
.chip.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.chip-count {
  margin-left: 4px;
  opacity: 0.65;
  font-size: 11px;
}

/* Job list */
.job-list {
  min-height: 60vh;
}
.list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.list-count {
  font-size: 14px;
  color: var(--color-text-secondary);
}
.list-count b {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 16px;
  margin: 0 2px;
}
.cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tip {
  text-align: center;
  padding: 20px;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

/* Side panel */
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: calc(var(--header-height) + 16px);
  align-self: flex-start;
}
.side-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.side-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.side-title {
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}
.side-badge {
  font-size: 18px;
}
.side-hint {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.rec-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rec-item {
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.rec-item:hover {
  background: #f5f5f7;
}
.rec-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}
.rec-meta {
  font-size: 12px;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  gap: 4px;
}
.rec-dot { opacity: 0.5; }
.rec-salary {
  margin-left: auto;
  color: #ff5722;
  font-weight: 500;
}
.rec-match {
  margin-top: 4px;
  font-size: 12px;
  color: #52c41a;
  font-weight: 500;
}

/* CTA card */
.side-cta {
  background: linear-gradient(135deg, #e6f4ff 0%, #eef2ff 100%);
  text-align: center;
}
.side-cta h4 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}
.side-cta p {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
  line-height: 1.5;
}

/* 响应式 */
@media (max-width: 1080px) {
  .body {
    grid-template-columns: 200px minmax(0, 1fr);
  }
  .side-panel { display: none; }
}
@media (max-width: 720px) {
  .body {
    grid-template-columns: 1fr;
  }
  .filter-panel {
    position: static;
  }
  .hero-title { font-size: 24px; }
}
</style>
