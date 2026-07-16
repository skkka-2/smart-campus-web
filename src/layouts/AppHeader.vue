<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElAvatar, ElDialog, ElButton } from 'element-plus';
import { useAuth } from '@/composables/useAuth';
import SearchBar from './SearchBar.vue';
import Logo from '@/assets/Logo.png';

const props = defineProps({
  activePath: { type: String, default: '' },
  compact: { type: Boolean, default: false },
});

const router = useRouter();
const { isLogin, userID, logout } = useAuth();

const searchValue = ref('');
const suggestions = ref([
  { id: 1, name: '考研攻略' },
  { id: 2, name: '前端面试' },
  { id: 3, name: 'MySQL 索引' },
  { id: 4, name: 'Vue3 实战' },
  { id: 5, name: '学习方法论' },
]);

const showLogoutDialog = ref(false);

function goCreate() {
  router.push('/create');
}
function goLogin() {
  router.push('/login');
}
async function confirmLogout() {
  showLogoutDialog.value = false;
  await logout({ redirect: '/home' });
}
function onSearch(item) {
  console.log('[search]', item);
}

const avatarUrl = computed(() =>
  userID.value ? `/avatars/${userID.value}.png` : null,
);
</script>

<template>
  <header class="app-header" :class="{ 'is-compact': compact }">
    <div class="header-inner">
      <router-link to="/home" class="logo" aria-label="大学智学网">
        <img :src="Logo" alt="Logo" />
      </router-link>

      <nav class="nav">
        <router-link to="/home" class="nav-item" :class="{ active: activePath === '/home' || activePath === '/' }">
          首页动态
        </router-link>
        <router-link to="/OnePart" class="nav-item" :class="{ active: activePath === '/OnePart' }">
          升学速递
        </router-link>
        <router-link to="/TwoPart" class="nav-item" :class="{ active: activePath === '/TwoPart' }">
          实习就业
        </router-link>
        <a class="nav-item" href="https://cy.ncss.cn/" target="_blank" rel="noopener">创业立项</a>
        <router-link to="/FourPart" class="nav-item" :class="{ active: activePath === '/FourPart' }">
          名师咨询
        </router-link>
      </nav>

      <div class="header-right">
        <SearchBar v-model="searchValue" :suggestions="suggestions" @search="onSearch" />

        <button v-if="isLogin" class="btn-create" @click="goCreate">创作者中心</button>

        <template v-if="isLogin">
          <el-avatar
            class="user-avatar"
            :src="avatarUrl"
            :size="36"
            @click="showLogoutDialog = true"
          >
            {{ (userID ?? '?').toString().slice(0, 1) }}
          </el-avatar>
        </template>
        <button v-else class="btn-login" @click="goLogin">登录</button>
      </div>
    </div>

    <el-dialog v-model="showLogoutDialog" title="退出登录" width="360" align-center>
      <span>确定要退出当前账号吗?</span>
      <template #footer>
        <el-button @click="showLogoutDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmLogout">确定退出</el-button>
      </template>
    </el-dialog>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: #fff;
  box-shadow: var(--shadow-sm);
  z-index: var(--z-header);
  transition: transform 0.2s ease;
}
.app-header.is-compact {
  transform: translateY(-100%);
}

.header-inner {
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.logo {
  flex: 0 0 auto;
  height: 44px;
  display: flex;
  align-items: center;
}
.logo img {
  height: 100%;
  width: auto;
}

.nav {
  flex: 0 0 auto;
  display: flex;
  gap: var(--space-4);
}
.nav-item {
  position: relative;
  padding: var(--space-3) var(--space-2);
  font-size: var(--font-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color 0.2s ease;
}
.nav-item:hover {
  color: var(--color-primary);
}
.nav-item.active {
  color: var(--color-primary);
  font-weight: 600;
}
.nav-item.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -4px;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: var(--color-primary);
  border-radius: 2px;
}

.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.btn-create,
.btn-login {
  height: 34px;
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: background 0.2s ease;
}
.btn-create {
  background: var(--color-primary);
  color: #fff;
}
.btn-create:hover {
  background: var(--color-primary-hover);
}
.btn-login {
  background: var(--color-bg);
  color: var(--color-text-primary);
}
.btn-login:hover {
  background: var(--color-border);
}

.user-avatar {
  cursor: pointer;
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
}
</style>
