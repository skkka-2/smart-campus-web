<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ElSkeleton, ElEmpty } from 'element-plus';
import ArticleCard from '@/components/ArticleCard.vue';
import { listArticles } from '@/api/CreatPart';
import { throttle } from '@/composables/useDebounce';

const props = defineProps({
  category: { type: String, default: 'all' },
});

const router = useRouter();

const TABS = [
  { key: 'recommend', label: '推荐' },
  { key: 'latest',    label: '最新' },
];

const activeTab = ref('recommend');

// 分 tab 状态,切分类时会 reset
const state = ref({
  recommend: { items: [], page: 1, hasMore: true, loading: false },
  latest:    { items: [], page: 1, hasMore: true, loading: false },
});

function currentTabState() {
  return state.value[activeTab.value];
}

function resetAll() {
  state.value = {
    recommend: { items: [], page: 1, hasMore: true, loading: false },
    latest:    { items: [], page: 1, hasMore: true, loading: false },
  };
}

async function loadMore() {
  const s = currentTabState();
  if (s.loading || !s.hasMore) return;
  s.loading = true;
  try {
    const data = await listArticles({
      sort: activeTab.value,
      category: props.category,
      page: s.page,
      limit: 5,
    });
    s.items.push(...(data?.items || []));
    s.hasMore = !!data?.hasMore;
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
  const s = currentTabState();
  if (s.items.length === 0) await loadMore();
}

function goDetail(item) {
  router.push(`/articles/${item.id}`);
}

// 滚动到底触底加载
const onScroll = throttle(() => {
  const st = document.documentElement.scrollTop;
  const ch = document.documentElement.clientHeight;
  const sh = document.documentElement.scrollHeight;
  if (st + ch >= sh - 200) loadMore();
}, 200);

// 分类变化 → 重置并重新加载
import { watch } from 'vue';
watch(
  () => props.category,
  async () => {
    resetAll();
    await loadMore();
  },
);

onMounted(async () => {
  await loadMore();
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
        :cont="item.excerpt"
        :pic-url="item.cover_url"
        :like="item.like_count"
        :view="item.view_count"
        :user="item.author_name"
        :category="item.category_name"
        @click="goDetail(item)"
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
      description="该分类下暂无内容"
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
.tab:hover { color: var(--color-primary); }
.tab.active { color: var(--color-primary); font-weight: 600; }
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

.list { display: flex; flex-direction: column; }

.tip {
  text-align: center;
  padding: var(--space-4);
  color: var(--color-text-tertiary);
  font-size: var(--font-sm);
}
</style>
