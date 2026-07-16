<script setup>
import HomeSidebar from './HomeSidebar.vue';
import HomeFeed from './HomeFeed.vue';
import HomeRankPanel from './HomeRankPanel.vue';

function onCategoryChange(id) {
  console.log('[Home] category:', id);
  // Phase 3:接分类筛选
}
</script>

<template>
  <div class="home">
    <HomeSidebar class="col-side" @change="onCategoryChange" />
    <HomeFeed class="col-feed" />
    <HomeRankPanel class="col-rank" />
  </div>
</template>

<style scoped>
.home {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-4);
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) 300px;
  gap: var(--space-5);
}

@media (max-width: 1080px) {
  .home {
    grid-template-columns: 160px minmax(0, 1fr);
  }
  .col-rank { display: none; }
}
@media (max-width: 720px) {
  .home {
    grid-template-columns: 1fr;
  }
  .col-side { display: none; }
}
</style>
