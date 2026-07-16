<script setup>
import { ref, onMounted } from 'vue';
import { fetchRankings } from '@/api/CreatPart';

const rankings = ref({ articles: [], authors: [], topics: [] });

onMounted(async () => {
  try {
    rankings.value = await fetchRankings();
  } catch (err) {
    console.error('[HomeRankPanel] load failed:', err);
  }
});
</script>

<template>
  <aside class="rank-panel">
    <section class="card">
      <header class="head">
        <h3>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
            <path fill="var(--color-accent)" d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm3-4h5q.425 0 .713-.288T14 16t-.288-.712T13 15H8q-.425 0-.712.288T7 16t.288.713T8 17m0-4h8q.425 0 .713-.288T17 12t-.288-.712T16 11H8q-.425 0-.712.288T7 12t.288.713T8 13m0-4h8q.425 0 .713-.288T17 8t-.288-.712T16 7H8q-.425 0-.712.288T7 8t.288.713T8 9" />
          </svg>
          文章榜
        </h3>
      </header>
      <ol class="rank-list">
        <li v-for="(item, i) in rankings.articles" :key="`a-${i}`">
          <span class="rank" :class="{ top: i < 3 }">{{ i + 1 }}</span>
          <span class="text text-ellipsis">{{ item }}</span>
        </li>
      </ol>
    </section>

    <section class="card">
      <header class="head">
        <h3>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
            <path fill="var(--color-accent)" d="M21 21V5H3v7q0 .425-.288.713T2 13t-.712-.288T1 12V5q0-.825.588-1.412T3 3h18q.825 0 1.413.588T23 5v14q0 .825-.587 1.413T21 21M9 14q-1.65 0-2.825-1.175T5 10t1.175-2.825T9 6t2.825 1.175T13 10t-1.175 2.825T9 14m-6 8q-.825 0-1.412-.587T1 20v-.8q0-.85.438-1.562T2.6 16.55q1.55-.775 3.15-1.162T9 15t3.25.388t3.15 1.162q.725.375 1.163 1.088T17 19.2v.8q0 .825-.587 1.413T15 22z" />
          </svg>
          作者榜
        </h3>
      </header>
      <ol class="rank-list">
        <li v-for="(item, i) in rankings.authors" :key="`u-${i}`">
          <span class="rank" :class="{ top: i < 3 }">{{ i + 1 }}</span>
          <span class="text text-ellipsis">{{ item }}</span>
        </li>
      </ol>
    </section>

    <section class="card">
      <header class="head">
        <h3>推荐话题</h3>
      </header>
      <ul class="topic-list">
        <li v-for="(item, i) in rankings.topics" :key="`t-${i}`">
          <span aria-hidden="true">🔥</span>
          <span class="text text-ellipsis">{{ item }}</span>
        </li>
      </ul>
    </section>
  </aside>
</template>

<style scoped>
.rank-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  position: sticky;
  top: calc(var(--header-height) + var(--space-4));
  align-self: flex-start;
}

.card {
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--space-4);
}

.head h3 {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-lg);
  font-weight: 600;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.rank-list,
.topic-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.rank-list li,
.topic-list li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s ease;
}
.rank-list li:hover,
.topic-list li:hover {
  background: var(--color-bg-hover);
}

.rank {
  flex: 0 0 20px;
  height: 20px;
  border-radius: 4px;
  background: var(--color-bg);
  color: var(--color-text-tertiary);
  font-size: var(--font-xs);
  font-weight: 600;
  text-align: center;
  line-height: 20px;
}
.rank.top {
  background: var(--color-accent);
  color: #fff;
}

.text {
  flex: 1;
  min-width: 0;
  font-size: var(--font-sm);
  color: var(--color-text-primary);
}
</style>
