import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../stores';

/**
 * 登录态便捷 hook
 *   const { isLogin, userID, requireLogin, logout } = useAuth()
 */
export function useAuth() {
  const userStore = useUserStore();
  const router = useRouter();

  const isLogin = computed(() => userStore.isLogin);
  const userID = computed(() => userStore.userID);
  const username = computed(() => userStore.username);

  /**
   * 要求登录:未登录则 toast + 跳登录页;登录了返回 true
   * @returns {boolean}
   */
  function requireLogin(message = '请先登录') {
    if (isLogin.value) return true;
    ElMessage.warning(message);
    router.push({ path: '/login' });
    return false;
  }

  async function logout({ redirect = '/login' } = {}) {
    userStore.logout();
    ElMessage.success('已退出登录');
    if (redirect) await router.push(redirect);
  }

  return { isLogin, userID, username, requireLogin, logout, userStore };
}
