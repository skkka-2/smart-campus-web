<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  ElTabs, ElTabPane, ElForm, ElFormItem, ElInput, ElSelect, ElOption,
  ElButton, ElMessage, ElTag, ElEmpty, ElSkeleton,
} from 'element-plus';
import AvatarWithFallback from '@/components/AvatarWithFallback.vue';
import { useAuth } from '@/composables/useAuth';
import { getMyProfile, updateMyProfile } from '@/api/UserPart';
import { myFavorites, myApplications } from '@/api/JobPart';

const router = useRouter();
const { userStore } = useAuth();

const profile = ref(null);
const loading = ref(true);
const saving = ref(false);
const activeTab = ref('profile');

// 表单绑定
const form = ref({
  bio: '',
  major: '',
  college: '',
  grade: '',
  career_direction: '',
  preferred_city: '',
  interests: [],
});
const newInterest = ref('');

// 常用选项
const MAJORS = [
  '计算机科学与技术', '软件工程', '人工智能', '数据科学与大数据', '信息安全',
  '电子信息工程', '通信工程', '设计学', '视觉传达设计', '工业设计',
  '数字媒体艺术', '市场营销', '广告学', '工商管理', '经济学',
  '金融学', '统计学', '数学与应用数学', '新闻传播学', '心理学',
];
const GRADES = ['大一', '大二', '大三', '大四', '研一', '研二', '研三', '其他'];
const DIRECTIONS = ['前端', '后端', '算法', '产品', '设计', '运营', '数据', '测试', '其他'];
const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '苏州', '其他'];

// tabs 数据
const favorites = ref([]);
const applications = ref([]);
const favLoading = ref(false);
const appLoading = ref(false);

const completionScore = computed(() => {
  if (!profile.value) return 0;
  const fields = ['major', 'college', 'grade', 'career_direction', 'preferred_city', 'bio'];
  const filled = fields.filter((f) => profile.value[f]).length;
  const interestBonus = (profile.value.interests || []).length > 0 ? 1 : 0;
  return Math.round(((filled + interestBonus) / (fields.length + 1)) * 100);
});

const grateColor = computed(() => {
  const s = completionScore.value;
  if (s >= 80) return '#52c41a';
  if (s >= 50) return '#1890ff';
  return '#faad14';
});

async function loadProfile() {
  loading.value = true;
  try {
    const data = await getMyProfile();
    profile.value = data;
    // 回填表单
    form.value = {
      bio: data.bio || '',
      major: data.major || '',
      college: data.college || '',
      grade: data.grade || '',
      career_direction: data.career_direction || '',
      preferred_city: data.preferred_city || '',
      interests: Array.isArray(data.interests) ? [...data.interests] : [],
    };
  } catch (err) {
    console.error('[Profile] load failed:', err);
  } finally {
    loading.value = false;
  }
}

async function saveProfile() {
  saving.value = true;
  try {
    const updated = await updateMyProfile(form.value);
    profile.value = updated;
    ElMessage.success('画像已更新');
  } catch (err) {
    console.error('[Profile] save failed:', err);
  } finally {
    saving.value = false;
  }
}

function addInterest() {
  const t = newInterest.value.trim();
  if (!t) return;
  if (form.value.interests.includes(t)) {
    ElMessage.warning('已存在');
    return;
  }
  if (form.value.interests.length >= 10) {
    ElMessage.warning('最多添加 10 个兴趣标签');
    return;
  }
  form.value.interests.push(t);
  newInterest.value = '';
}

function removeInterest(t) {
  form.value.interests = form.value.interests.filter((i) => i !== t);
}

async function loadFavorites() {
  favLoading.value = true;
  try {
    const data = await myFavorites({ limit: 20 });
    favorites.value = data?.items || [];
  } catch (err) {
    console.error('[Profile] favorites failed:', err);
  } finally {
    favLoading.value = false;
  }
}

async function loadApplications() {
  appLoading.value = true;
  try {
    const data = await myApplications({ limit: 20 });
    applications.value = data?.items || [];
  } catch (err) {
    console.error('[Profile] applications failed:', err);
  } finally {
    appLoading.value = false;
  }
}

const STATUS_MAP = {
  pending: { label: '等待反馈', color: '#faad14' },
  viewed: { label: 'HR 已查看', color: '#1890ff' },
  interview: { label: '面试邀约', color: '#52c41a' },
  offer: { label: 'Offer 到手', color: '#f759ab' },
  rejected: { label: '未通过', color: '#8c8c8c' },
  withdrawn: { label: '已撤回', color: '#8c8c8c' },
};

function onTabChange(name) {
  if (name === 'favorites' && favorites.value.length === 0) loadFavorites();
  if (name === 'applications' && applications.value.length === 0) loadApplications();
}

onMounted(loadProfile);
</script>

<template>
  <div class="profile-page">
    <el-skeleton v-if="loading" :rows="10" animated style="max-width: 960px; margin: 24px auto; padding: 24px;" />

    <template v-else-if="profile">
      <!-- 顶部卡片 -->
      <section class="hero-card">
        <div class="hero-inner">
          <AvatarWithFallback
            :user-id="profile.id"
            :name="profile.username"
            :src="profile.avatar_url"
            :size="88"
          />
          <div class="info">
            <div class="name-row">
              <h1 class="name">{{ profile.username }}</h1>
              <span v-if="profile.grade" class="tag">{{ profile.grade }}</span>
              <span v-if="profile.career_direction" class="tag primary">{{ profile.career_direction }}方向</span>
            </div>
            <div class="bio">{{ profile.bio || '还没有个人简介 — 快去编辑吧' }}</div>
            <div class="chips">
              <span v-if="profile.major" class="chip">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9zm6.82 6L12 12.72L5.18 9L12 5.28zM17 15.99l-5 2.73l-5-2.73v-3.72L12 15l5-2.73z" /></svg>
                {{ profile.major }}
              </span>
              <span v-if="profile.college" class="chip">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M6.5 10h-2v7h2zm6 0h-2v7h2zM21 19H2v2h19zm-2.5-9h-2v7h2zM11.5 3.26L16.71 6H6.29zM11.5 1L2 6v2h19V6z" /></svg>
                {{ profile.college }}
              </span>
              <span v-if="profile.preferred_city" class="chip">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12q.825 0 1.413-.587T14 10t-.587-1.412T12 8t-1.412.588T10 10t.588 1.413T12 12m0 10q-4.025-3.425-6.012-6.362T4 10.2q0-3.75 2.413-5.975T12 2t5.588 2.225T20 10.2q0 2.5-1.987 5.438T12 22" /></svg>
                意向:{{ profile.preferred_city }}
              </span>
            </div>
          </div>

          <div class="completion">
            <div class="ring" :style="{ '--score': completionScore, '--color': grateColor }">
              <span>{{ completionScore }}%</span>
            </div>
            <div class="completion-label">画像完整度</div>
          </div>
        </div>
      </section>

      <!-- Tabs -->
      <section class="tabs-section">
        <el-tabs v-model="activeTab" @tab-change="onTabChange">
          <el-tab-pane label="个人画像" name="profile">
            <div class="form-wrap">
              <el-form label-width="90px" size="default" @submit.prevent>
                <el-form-item label="个人简介">
                  <el-input
                    v-model="form.bio"
                    type="textarea"
                    :rows="3"
                    maxlength="200"
                    show-word-limit
                    placeholder="一句话介绍你自己"
                  />
                </el-form-item>

                <el-form-item label="学校">
                  <el-input v-model="form.college" placeholder="如:清华大学 / 北京大学" />
                </el-form-item>

                <el-form-item label="专业">
                  <el-select v-model="form.major" filterable placeholder="选择或搜索专业" style="width: 100%">
                    <el-option v-for="m in MAJORS" :key="m" :value="m" :label="m" />
                  </el-select>
                </el-form-item>

                <el-form-item label="年级">
                  <div class="chip-select">
                    <button
                      v-for="g in GRADES"
                      :key="g"
                      class="select-chip"
                      :class="{ active: form.grade === g }"
                      @click="form.grade = g"
                      type="button"
                    >
                      {{ g }}
                    </button>
                  </div>
                </el-form-item>

                <el-form-item label="职业方向">
                  <div class="chip-select">
                    <button
                      v-for="d in DIRECTIONS"
                      :key="d"
                      class="select-chip"
                      :class="{ active: form.career_direction === d }"
                      @click="form.career_direction = d"
                      type="button"
                    >
                      {{ d }}
                    </button>
                  </div>
                </el-form-item>

                <el-form-item label="意向城市">
                  <div class="chip-select">
                    <button
                      v-for="c in CITIES"
                      :key="c"
                      class="select-chip"
                      :class="{ active: form.preferred_city === c }"
                      @click="form.preferred_city = c"
                      type="button"
                    >
                      {{ c }}
                    </button>
                  </div>
                </el-form-item>

                <el-form-item label="兴趣技能">
                  <div class="interests-wrap">
                    <div v-if="form.interests.length" class="interests-list">
                      <el-tag
                        v-for="t in form.interests"
                        :key="t"
                        closable
                        @close="removeInterest(t)"
                      >
                        {{ t }}
                      </el-tag>
                    </div>
                    <div class="interest-add">
                      <el-input
                        v-model="newInterest"
                        placeholder="添加技能标签 如 Vue / Python / PS"
                        @keyup.enter="addInterest"
                        style="max-width: 300px;"
                      />
                      <el-button @click="addInterest">添加</el-button>
                    </div>
                    <p class="hint">技能标签会影响岗位匹配度,建议填 3-8 个</p>
                  </div>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" :loading="saving" @click="saveProfile">
                    保存画像
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="`收藏的岗位 (${favorites.length})`" name="favorites">
            <el-skeleton v-if="favLoading" :rows="4" animated />
            <template v-else>
              <div v-if="favorites.length" class="mini-list">
                <div v-for="j in favorites" :key="j.id" class="mini-item" @click="router.push(`/jobs/${j.id}`)">
                  <AvatarWithFallback :src="j.company_logo" :name="j.company" :size="40" />
                  <div class="mini-body">
                    <div class="mini-title">{{ j.title }}</div>
                    <div class="mini-meta">
                      {{ j.company }} · {{ j.city }} · {{ j.salary_display }}
                    </div>
                  </div>
                </div>
              </div>
              <el-empty v-else description="还没有收藏任何岗位">
                <el-button type="primary" @click="router.push('/jobs')">去看看</el-button>
              </el-empty>
            </template>
          </el-tab-pane>

          <el-tab-pane :label="`我的投递 (${applications.length})`" name="applications">
            <el-skeleton v-if="appLoading" :rows="4" animated />
            <template v-else>
              <div v-if="applications.length" class="app-list">
                <div v-for="a in applications" :key="a.id" class="app-item" @click="router.push(`/jobs/${a.job_id}`)">
                  <div class="app-head">
                    <span class="app-title">{{ a.company }} · {{ a.title }}</span>
                    <span
                      class="status-pill"
                      :style="{ background: STATUS_MAP[a.status]?.color + '20', color: STATUS_MAP[a.status]?.color }"
                    >
                      {{ STATUS_MAP[a.status]?.label || a.status }}
                    </span>
                  </div>
                  <div class="app-meta">
                    {{ a.city }} · {{ a.salary_display }}
                    <span class="app-time">投递于 {{ new Date(a.created_at).toLocaleDateString('zh-CN') }}</span>
                  </div>
                  <div v-if="a.message" class="app-msg">"{{ a.message }}"</div>
                </div>
              </div>
              <el-empty v-else description="还没有投递记录">
                <el-button type="primary" @click="router.push('/jobs')">去岗位广场看看</el-button>
              </el-empty>
            </template>
          </el-tab-pane>
        </el-tabs>
      </section>
    </template>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: 60px;
}

/* Hero card */
.hero-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 24px;
  color: #fff;
}
.hero-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 24px;
}

.info {
  flex: 1;
  min-width: 0;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.name {
  font-size: 28px;
  font-weight: 700;
}
.tag {
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(6px);
  border-radius: 4px;
  font-size: 12px;
}
.tag.primary {
  background: rgba(255, 255, 255, 0.35);
  font-weight: 500;
}
.bio {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 12px;
  line-height: 1.6;
}
.chips {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  opacity: 0.9;
}

/* Completion ring */
.completion {
  text-align: center;
  flex: 0 0 auto;
}
.ring {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: conic-gradient(var(--color) calc(var(--score) * 1%), rgba(255, 255, 255, 0.25) 0);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.ring::before {
  content: '';
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(6px);
}
.ring span {
  position: relative;
  z-index: 1;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}
.completion-label {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.85;
}

/* Tabs */
.tabs-section {
  max-width: 960px;
  margin: 24px auto 0;
  padding: 0 24px;
}
.tabs-section :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}
.tabs-section :deep(.el-tabs__item) {
  font-size: 15px;
  height: 48px;
}

.form-wrap {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  max-width: 720px;
}

.chip-select {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.select-chip {
  padding: 6px 14px;
  background: #f5f5f7;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.select-chip:hover {
  background: #e6f4ff;
  color: var(--color-primary);
}
.select-chip.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.interests-wrap {
  width: 100%;
}
.interests-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.interest-add {
  display: flex;
  gap: 8px;
}
.hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* Mini list (favorites) */
.mini-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mini-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.mini-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}
.mini-title {
  font-size: 15px;
  font-weight: 500;
}
.mini-meta {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 4px;
}

/* Applications */
.app-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.app-item {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border-left: 3px solid var(--color-primary);
}
.app-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}
.app-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.app-title {
  font-size: 15px;
  font-weight: 500;
}
.status-pill {
  padding: 3px 10px;
  font-size: 12px;
  border-radius: 4px;
  font-weight: 500;
}
.app-meta {
  font-size: 13px;
  color: var(--color-text-tertiary);
  display: flex;
  justify-content: space-between;
}
.app-time { font-size: 12px; }
.app-msg {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f5f5f7;
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-style: italic;
}

@media (max-width: 720px) {
  .hero-inner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
