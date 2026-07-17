import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores';

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/home',
    children: [
      { path: 'home', component: () => import('@/views/Home/index.vue') },
      { path: 'MainPart', redirect: '/home' }, // 兼容老链接
      { path: 'articles/:id', component: () => import('@/views/ArticleDetail.vue') },
      { path: 'OnePart', component: () => import('@/view/OnePart.vue') },
      { path: 'TwoPart', redirect: '/jobs' }, // 兼容老链接
      { path: 'jobs', component: () => import('@/views/Jobs/index.vue') },
      { path: 'jobs/:id', component: () => import('@/views/Jobs/JobDetail.vue') },
      { path: 'profile', component: () => import('@/views/Profile/index.vue'), meta: { requiresAuth: true } },
      { path: 'FourPart', component: () => import('@/view/FourPart.vue') },
      {
        path: 'AiPart',
        component: () => import('@/view/AiPart.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'ChatRoom',
        component: () => import('@/view/ChatRoom.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'CommentPart/:commentId?',
        component: () => import('@/view/CommentPart.vue'),
      },
    ],
  },
  {
    path: '/create',
    component: () => import('@/view/Create.vue'),
    meta: { requiresAuth: true },
  },
  { path: '/login', component: () => import('@/view/Login.vue') },
  { path: '/:catchAll(.*)', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

/**
 * 全局路由守卫:
 * - meta.requiresAuth 的路由未登录 → 跳登录页(带回跳)
 * - 已登录访问 /login → 跳首页
 */
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const isLogin = userStore.isLogin;

  if (to.meta?.requiresAuth && !isLogin) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }
  if (to.path === '/login' && isLogin) {
    return next('/');
  }
  next();
});

export default router;
