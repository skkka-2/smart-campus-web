<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { ElSkeleton, ElEmpty } from 'element-plus';
import ArticleCard from '@/components/ArticleCard.vue';
import { listArticles } from '@/api/CreatPart';
import { throttle } from '@/composables/useDebounce';

/**
 * 首页信息流(带 "推荐 / 最新" tab + 无限滚动)
 * 修复了旧版:
 *   - itemList 和 itemList1/2 引用错位
 *   - 切 tab 后 hasMore 不重置
 */

const TABS = [
  { key: 'recommend', label: '推荐' },
  { key: 'latest',    label: '最新' },
];

const activeTab = ref('recommend');

// 分 tab 各自的状态(缓存,tab 切换不重复请求)
const state = ref({
  recommend: { items: [], page: 1, hasMore: true, loading: false },
  latest:    { items: [], page: 1, hasMore: true, loading: false },
});

function currentTabState() {
  return state.value[activeTab.value];
}

async function loadMore() {
  const s = currentTabState();
  if (s.loading || !s.hasMore) return;
  s.loading = true;
  try {
    const data = await listArticles({ sort: activeTab.value, page: s.page, limit: 5 });
    s.items.push(...data.items);
    s.hasMore = data.hasMore;
    s.page += 1;
  } catch (err) {
    console.error('[HomeFeed] loadMore failed:', err);
  } finally {
    s.loading = false;
  }
}

async function pickTab(key) {
  if (key === activeTab.value) return;
  activeTab.value = key;
  // 首次进入该 tab 时才加载
  const s = currentTabState();
  if (s.items.length === 0) await loadMore();
}

// 滚动到底触底加载
const onScroll = throttle(() => {
  const st = document.documentElement.scrollTop;
  const ch = document.documentElement.clientHeight;
  const sh = document.documentElement.scrollHeight;
  if (st + ch >= sh - 200) loadMore();
}, 200);

onMounted(async () => {
  await loadMore(); // 首屏加载推荐
  window.addEventListener('scroll', onScroll, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
  <section class="home-feed">
    <div class="tabs">
      <button
        v-for="t in TABS"
        :key="t.key"
        class="tab"
        :class="{ active: activeTab === t.key }"
        @click="pickTab(t.key)"
      >
        {{ t.label }}
      </button>
    </div>

    <div class="list">
      <ArticleCard
        v-for="item in currentTabState().items"
        :key="`${activeTab}-${item.id}`"
        :title="item.title"
        :cont="item.cont"
        :pic-url="item.picUrl"
        :like="item.like"
        :view="item.view"
        :user="item.user"
      />
    </div>

    <el-skeleton
      v-if="currentTabState().loading && currentTabState().items.length === 0"
      :rows="5"
      animated
    />

    <div v-if="currentTabState().loading && currentTabState().items.length > 0" class="tip">
      加载中...
    </div>

    <div v-else-if="!currentTabState().hasMore && currentTabState().items.length > 0" class="tip">
      没有更多了 ~
    </div>

    <el-empty
      v-else-if="!currentTabState().loading && currentTabState().items.length === 0"
      description="暂无内容"
    />
  </section>
</template>

<style scoped>
.home-feed {
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.tabs {
  display: flex;
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  gap: var(--space-6);
}

.tab {
  position: relative;
  padding: var(--space-3) 0;
  background: transparent;
  border: none;
  font-size: var(--font-md);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: color 0.15s ease;
}
.tab:hover {
  color: var(--color-primary);
}
.tab.active {
  color: var(--color-primary);
  font-weight: 600;
}
.tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: var(--color-primary);
  border-radius: 2px;
}

.list {
  display: flex;
  flex-direction: column;
}

.tip {
  text-align: center;
  padding: var(--space-4);
  color: var(--color-text-tertiary);
  font-size: var(--font-sm);
}
</style>
