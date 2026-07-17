<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElSkeleton, ElInput, ElButton } from 'element-plus';
import AvatarWithFallback from '@/components/AvatarWithFallback.vue';
import {
  getArticleDetail,
  toggleLike,
  listArticleComments,
  createArticleComment,
} from '@/api/CreatPart';
import { useAuth } from '@/composables/useAuth';
import { useTimeAgo } from '@/composables/useTimeAgo';

const route = useRoute();
const router = useRouter();
const { isLogin, username, requireLogin } = useAuth();

const articleId = computed(() => Number(route.params.id));

const article = ref(null);
const liked = ref(false);
const loading = ref(true);

const comments = ref([]);
const commentText = ref('');
const submittingComment = ref(false);

const createdAtMs = computed(() =>
  article.value?.created_at ? new Date(article.value.created_at).getTime() : Date.now(),
);
const timeAgo = useTimeAgo(createdAtMs);

function formatCount(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return String(n ?? 0);
  if (v >= 10_000) return `${(v / 10_000).toFixed(1).replace(/\.0$/, '')}w`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(v);
}

async function loadAll() {
  loading.value = true;
  try {
    const [detail, cmt] = await Promise.all([
      getArticleDetail(articleId.value),
      listArticleComments(articleId.value, { limit: 50 }),
    ]);
    article.value = detail.article;
    liked.value = detail.liked;
    comments.value = cmt?.items || [];
  } catch (err) {
    console.error('[ArticleDetail] load failed:', err);
    ElMessage.error('文章加载失败');
    router.push('/home');
  } finally {
    loading.value = false;
  }
}

async function onLike() {
  if (!requireLogin('登录后才能点赞')) return;
  try {
    const data = await toggleLike(articleId.value);
    liked.value = data.liked;
    article.value.like_count = data.likeCount;
  } catch (err) {
    console.error('[ArticleDetail] like failed:', err);
  }
}

async function submitComment() {
  if (!requireLogin('登录后才能评论')) return;
  const text = commentText.value.trim();
  if (!text) return;
  submittingComment.value = true;
  try {
    await createArticleComment(articleId.value, text);
    // 乐观:本地追加,然后刷一次(以拿到 id/时间)
    commentText.value = '';
    const cmt = await listArticleComments(articleId.value, { limit: 50 });
    comments.value = cmt?.items || [];
  } catch (err) {
    console.error('[ArticleDetail] comment failed:', err);
  } finally {
    submittingComment.value = false;
  }
}

onMounted(loadAll);
</script>

<template>
  <div class="article-detail">
    <el-skeleton v-if="loading" :rows="10" animated />

    <template v-else-if="article">
      <header class="hero">
        <div class="crumb">
          <span class="crumb-item" @click="router.push('/home')">首页</span>
          <span class="sep">/</span>
          <span v-if="article.category_name" class="crumb-item">{{ article.category_name }}</span>
        </div>
        <h1 class="title">{{ article.title }}</h1>
        <div class="meta">
          <AvatarWithFallback :name="article.author_name" :user-id="article.author_id" :size="32" />
          <span class="author">{{ article.author_name || '匿名作者' }}</span>
          <span class="dot">·</span>
          <span>{{ timeAgo }}</span>
          <span class="dot">·</span>
          <span>{{ formatCount(article.view_count) }} 阅读</span>
        </div>
        <img v-if="article.cover_url" :src="article.cover_url" class="cover" alt="" />
      </header>

      <section class="content ql-content" v-html="article.content" />

      <footer class="actions">
        <button class="btn-like" :class="{ liked }" @click="onLike">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
            <path fill="currentColor" d="M7.24 11v9H5.63c-.9 0-1.62-.72-1.62-1.61v-5.77c0-.89.73-1.62 1.62-1.62zM18.5 9.5h-4.78V6c0-1.1-.9-2-1.99-2h-.09c-.4 0-.76.24-.92.61L7.99 11v9h9.2c.73 0 1.35-.52 1.48-1.24l1.32-7.5c.16-.92-.54-1.76-1.48-1.76Z" />
          </svg>
          <span>{{ liked ? '已点赞' : '点赞' }} · {{ formatCount(article.like_count) }}</span>
        </button>
      </footer>

      <section class="comments">
        <h2 class="comments-title">评论 ({{ comments.length }})</h2>

        <div class="composer">
          <el-input
            v-model="commentText"
            type="textarea"
            :rows="3"
            :placeholder="isLogin ? '写下你的看法...' : '登录后可评论'"
            :disabled="!isLogin"
            maxlength="500"
            show-word-limit
          />
          <div class="composer-actions">
            <el-button
              type="primary"
              :loading="submittingComment"
              :disabled="!commentText.trim()"
              @click="submitComment"
            >
              发表评论
            </el-button>
          </div>
        </div>

        <ul v-if="comments.length" class="comment-list">
          <li v-for="c in comments" :key="c.id" class="comment">
            <AvatarWithFallback :name="c.userName" :user-id="c.user_id" :size="36" />
            <div class="comment-body">
              <div class="comment-head">
                <span class="comment-user">{{ c.userName }}</span>
                <span class="comment-time">
                  {{ new Date(c.created_at).toLocaleString('zh-CN', { hour12: false }) }}
                </span>
              </div>
              <p class="comment-content">{{ c.content }}</p>
            </div>
          </li>
        </ul>
        <p v-else class="empty">还没有评论,来抢沙发吧 ~</p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.article-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-5) var(--space-4);
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.crumb {
  font-size: var(--font-sm);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-3);
}
.crumb-item {
  cursor: pointer;
}
.crumb-item:hover {
  color: var(--color-primary);
}
.sep {
  margin: 0 var(--space-2);
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.3;
  margin-bottom: var(--space-4);
}

.meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-sm);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-5);
}
.author {
  color: var(--color-text-primary);
  font-weight: 500;
}
.dot {
  color: var(--color-text-tertiary);
}

.cover {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-5);
}

.content {
  font-size: var(--font-md);
  line-height: 1.8;
  color: var(--color-text-primary);
  margin-bottom: var(--space-6);
}
.content :deep(h2) {
  font-size: 20px;
  font-weight: 700;
  margin: var(--space-5) 0 var(--space-3);
}
.content :deep(p) {
  margin: var(--space-3) 0;
}
.content :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-sm);
}
.content :deep(ol),
.content :deep(ul) {
  padding-left: var(--space-6);
  margin: var(--space-3) 0;
}
.content :deep(li) {
  list-style: initial;
  margin: var(--space-1) 0;
}
.content :deep(ol li) {
  list-style: decimal;
}
.content :deep(code) {
  padding: 2px 6px;
  background: var(--color-bg);
  border-radius: 4px;
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 90%;
}

.actions {
  padding: var(--space-4) 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-5);
  display: flex;
  justify-content: center;
}

.btn-like {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: transparent;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-md);
  transition: all 0.2s ease;
}
.btn-like:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.btn-like.liked {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
}

.comments-title {
  font-size: var(--font-lg);
  font-weight: 600;
  margin-bottom: var(--space-4);
}

.composer {
  margin-bottom: var(--space-5);
}
.composer-actions {
  margin-top: var(--space-2);
  text-align: right;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.comment {
  display: flex;
  gap: var(--space-3);
}
.comment-body {
  flex: 1;
  min-width: 0;
}
.comment-head {
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
  margin-bottom: var(--space-1);
}
.comment-user {
  font-weight: 500;
  color: var(--color-text-primary);
}
.comment-time {
  font-size: var(--font-xs);
  color: var(--color-text-tertiary);
}
.comment-content {
  color: var(--color-text-primary);
  line-height: 1.6;
}

.empty {
  text-align: center;
  padding: var(--space-6);
  color: var(--color-text-tertiary);
}
</style>
