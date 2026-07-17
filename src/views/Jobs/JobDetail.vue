<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ElButton, ElSkeleton, ElMessage, ElDialog, ElInput, ElMessageBox,
} from 'element-plus';
import AvatarWithFallback from '@/components/AvatarWithFallback.vue';
import { useAuth } from '@/composables/useAuth';
import { useTimeAgo } from '@/composables/useTimeAgo';
import { useJobViewers } from '@/composables/useJobViewers';
import { getJobDetail, toggleFavorite, applyJob } from '@/api/JobPart';
import { analyzeResume } from '@/api/AiPart';

const route = useRoute();
const router = useRouter();
const { isLogin, requireLogin } = useAuth();

const jobId = computed(() => Number(route.params.id));

const job = ref(null);
const similar = ref([]);
const loading = ref(true);

// 实时"N 人正在看"
const { viewers, connected: viewersConnected } = useJobViewers(jobId);

const createdMs = computed(() =>
  job.value?.created_at ? new Date(job.value.created_at).getTime() : Date.now(),
);
const timeAgo = useTimeAgo(createdMs);

const matchClass = computed(() => {
  const s = job.value?.match_score;
  if (s == null) return '';
  if (s >= 85) return 'excellent';
  if (s >= 65) return 'good';
  if (s >= 40) return 'ok';
  return 'low';
});

const workTypeLabel = computed(() => {
  const m = { internship: '实习', campus: '校招', social: '社招' };
  return job.value ? m[job.value.work_type] || '' : '';
});

// 投递弹窗
const applyDialogVisible = ref(false);
const applyMessage = ref('');
const applying = ref(false);

// AI 简历分析
const aiDialogVisible = ref(false);
const resumeText = ref('');
const aiAnalyzing = ref(false);
const aiResult = ref('');

async function load() {
  loading.value = true;
  try {
    const data = await getJobDetail(jobId.value);
    job.value = data.job;
    similar.value = data.similar || [];
  } catch (err) {
    console.error('[JobDetail] load failed:', err);
    router.push('/jobs');
  } finally {
    loading.value = false;
  }
}

async function onFavorite() {
  if (!requireLogin('登录后才能收藏')) return;
  try {
    const data = await toggleFavorite(jobId.value);
    job.value.favorited = data.favorited;
    ElMessage.success(data.favorited ? '已收藏' : '已取消收藏');
  } catch (err) {
    console.error('[JobDetail] favorite failed:', err);
  }
}

function openApplyDialog() {
  if (!requireLogin('登录后才能投递')) return;
  if (job.value.applied) {
    ElMessage.info('你已经投递过这个岗位');
    return;
  }
  applyMessage.value = '';
  applyDialogVisible.value = true;
}

async function submitApply() {
  if (!applyMessage.value.trim()) {
    ElMessage.warning('请写点申请留言吧');
    return;
  }
  applying.value = true;
  try {
    await applyJob(jobId.value, applyMessage.value.trim());
    job.value.applied = 'pending';
    job.value.apply_count = (job.value.apply_count || 0) + 1;
    applyDialogVisible.value = false;
    ElMessage.success('投递成功,请等待 HR 联系');
  } catch (err) {
    console.error('[JobDetail] apply failed:', err);
  } finally {
    applying.value = false;
  }
}

function goSimilar(item) {
  router.push(`/jobs/${item.id}`);
}

function openAiDialog() {
  if (!requireLogin('登录后才能使用 AI 分析')) return;
  aiResult.value = '';
  aiDialogVisible.value = true;
}

async function runAiAnalysis() {
  if (resumeText.value.trim().length < 20) {
    ElMessage.warning('简历内容太短了,至少 20 字');
    return;
  }
  aiAnalyzing.value = true;
  aiResult.value = '';
  try {
    const data = await analyzeResume({
      resume: resumeText.value.trim(),
      jobTitle: `${job.value.company} · ${job.value.title}`,
      jobDesc: job.value.description,
      jobRequirements: job.value.requirements || [],
    });
    aiResult.value = data.analysis;
  } catch (err) {
    console.error('[JobDetail] AI 分析失败:', err);
  } finally {
    aiAnalyzing.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="detail-page">
    <el-skeleton v-if="loading" :rows="12" animated style="max-width: 800px; margin: 24px auto; padding: 24px;" />

    <template v-else-if="job">
      <!-- 顶部大 banner -->
      <section class="header-banner">
        <div class="header-inner">
          <button class="back" @click="router.push('/jobs')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8l8 8l1.41-1.41L7.83 13H20z" /></svg>
            返回列表
          </button>

          <div class="banner-body">
            <div class="banner-left">
              <div class="badges-line">
                <span v-if="job.is_urgent" class="badge urgent">急招</span>
                <span v-if="job.is_hot" class="badge hot">热招</span>
                <span class="badge type" :class="job.work_type">
                  {{ workTypeLabel }}
                </span>
                <span v-if="job.match_score != null" class="badge match" :class="matchClass">
                  匹配度 {{ job.match_score }}%
                </span>
              </div>

              <h1 class="job-title">{{ job.title }}</h1>

              <div class="job-meta">
                <span class="salary">{{ job.salary_display }}</span>
                <span class="sep">|</span>
                <span>{{ job.city }}</span>
                <span class="sep">|</span>
                <span>{{ job.experience_required }}</span>
                <span class="sep">|</span>
                <span>{{ job.degree_required }}</span>
              </div>

              <div class="job-tags">
                <span v-for="t in job.tags || []" :key="t" class="tag">{{ t }}</span>
              </div>

              <div class="stats">
                <span>{{ job.view_count }} 浏览</span>
                <span class="sep">·</span>
                <span>{{ job.apply_count }} 投递</span>
                <span class="sep">·</span>
                <span>发布于 {{ timeAgo }}</span>
                <span v-if="viewersConnected && viewers > 0" class="viewers-live">
                  <span class="pulse-dot" />
                  {{ viewers }} 人正在看
                </span>
              </div>
            </div>

            <div class="banner-right">
              <AvatarWithFallback :src="job.company_logo" :name="job.company" :size="72" />
              <div class="company-name">{{ job.company }}</div>
              <div class="company-meta">{{ job.company_size }}</div>
              <div class="company-meta">{{ job.industry }}</div>
            </div>
          </div>

          <div class="action-bar">
            <el-button
              size="large"
              round
              :type="job.favorited ? 'danger' : ''"
              @click="onFavorite"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style="margin-right: 6px;">
                <path v-if="job.favorited" fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
                <path v-else fill="currentColor" d="M12.1 18.55L12 18.65l-.11-.1C7.14 14.24 4 11.39 4 8.5C4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5c0 2.89-3.14 5.74-7.9 10.05M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3C4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5C22 5.42 19.58 3 16.5 3" />
              </svg>
              {{ job.favorited ? '已收藏' : '收藏' }}
            </el-button>
            <el-button
              size="large"
              round
              type="primary"
              :disabled="!!job.applied"
              @click="openApplyDialog"
              style="min-width: 160px;"
            >
              {{ job.applied ? '已投递,等待反馈' : '立即投递' }}
            </el-button>
          </div>
        </div>
      </section>

      <!-- 主体两栏 -->
      <div class="body">
        <main class="main-col">
          <section class="block">
            <h2 class="block-title">岗位描述</h2>
            <div class="description">
              <p v-for="(para, i) in (job.description || '').split('\n\n')" :key="i">
                {{ para }}
              </p>
            </div>
          </section>

          <section class="block">
            <h2 class="block-title">任职要求</h2>
            <ol class="req-list">
              <li v-for="(r, i) in job.requirements || []" :key="i">{{ r }}</li>
            </ol>
          </section>

          <section v-if="job.benefits && job.benefits.length" class="block">
            <h2 class="block-title">福利待遇</h2>
            <div class="benefits">
              <span v-for="b in job.benefits" :key="b" class="benefit">
                <span class="benefit-icon">✓</span>
                {{ b }}
              </span>
            </div>
          </section>
        </main>

        <aside class="side-col">
          <section class="side-block">
            <h3 class="side-title">相似岗位</h3>
            <ul v-if="similar.length" class="similar-list">
              <li
                v-for="s in similar"
                :key="s.id"
                class="similar-item"
                @click="goSimilar(s)"
              >
                <div class="similar-title text-ellipsis">{{ s.title }}</div>
                <div class="similar-meta">
                  <span>{{ s.company }}</span>
                  <span class="dot">·</span>
                  <span>{{ s.city }}</span>
                </div>
                <div class="similar-salary">{{ s.salary_display }}</div>
              </li>
            </ul>
            <p v-else class="empty">暂无相似岗位</p>
          </section>

          <section class="side-block cta-block">
            <div class="cta-icon">🎯</div>
            <h4>AI 简历适配度分析</h4>
            <p>把简历贴进来,让 AI 告诉你与这个岗位的匹配度和改进方向</p>
            <el-button type="primary" plain round @click="openAiDialog">
              开始分析
            </el-button>
          </section>
        </aside>
      </div>
    </template>

    <!-- 投递弹窗 -->
    <el-dialog
      v-model="applyDialogVisible"
      title="投递岗位"
      width="480"
      align-center
    >
      <div class="apply-dialog">
        <div class="apply-target">
          投递:<b>{{ job?.company }} · {{ job?.title }}</b>
        </div>
        <el-input
          v-model="applyMessage"
          type="textarea"
          :rows="5"
          maxlength="500"
          show-word-limit
          placeholder="告诉 HR 你为什么适合这个岗位,以及你的核心优势..."
        />
      </div>
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="applying" @click="submitApply">
          确认投递
        </el-button>
      </template>
    </el-dialog>

    <!-- AI 简历分析弹窗 -->
    <el-dialog
      v-model="aiDialogVisible"
      title="🎯 AI 简历适配度分析"
      width="640"
      align-center
    >
      <div class="ai-dialog">
        <div class="ai-target" v-if="job">
          目标岗位:<b>{{ job.company }} · {{ job.title }}</b>
        </div>

        <el-input
          v-model="resumeText"
          type="textarea"
          :rows="8"
          maxlength="2000"
          show-word-limit
          placeholder="粘贴你的简历文本(个人信息、教育经历、项目经验、技能等)。AI 会针对这个岗位给出适配度打分和改进建议..."
        />

        <div v-if="aiAnalyzing" class="ai-loading">
          <div class="ai-loading-dot" />
          <div class="ai-loading-dot" style="animation-delay: 0.2s" />
          <div class="ai-loading-dot" style="animation-delay: 0.4s" />
          <span>AI 正在阅读你的简历...</span>
        </div>

        <div v-if="aiResult" class="ai-result">
          <div class="ai-result-head">
            <span class="ai-badge">✨ AI 分析结果</span>
          </div>
          <pre class="ai-result-body">{{ aiResult }}</pre>
        </div>
      </div>
      <template #footer>
        <el-button @click="aiDialogVisible = false">关闭</el-button>
        <el-button
          type="primary"
          :loading="aiAnalyzing"
          :disabled="resumeText.trim().length < 20"
          @click="runAiAnalysis"
        >
          {{ aiResult ? '重新分析' : '开始分析' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.detail-page {
  min-height: 100vh;
  padding-bottom: 60px;
}

/* Header banner */
.header-banner {
  background: linear-gradient(135deg, #f8f9ff 0%, #e6f4ff 100%);
  padding: 32px 24px 24px;
  border-bottom: 1px solid var(--color-border);
}
.header-inner {
  max-width: 1080px;
  margin: 0 auto;
}
.back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.15s ease;
}
.back:hover {
  background: #fff;
  color: var(--color-primary);
}

.banner-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px;
  gap: 24px;
  margin-bottom: 24px;
}

.badges-line {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.badge {
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
}
.badge.urgent { background: #ff4d4f; color: #fff; }
.badge.hot    { background: #fa8c16; color: #fff; }
.badge.type   { background: #1890ff; color: #fff; }
.badge.type.campus { background: #52c41a; }
.badge.match.excellent { background: #52c41a; color: #fff; }
.badge.match.good      { background: #1890ff; color: #fff; }
.badge.match.ok        { background: #faad14; color: #fff; }
.badge.match.low       { background: #d9d9d9; color: #666; }

.job-title {
  font-size: 30px;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.3;
}
.job-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: var(--color-text-secondary);
  margin-bottom: 16px;
}
.salary {
  color: #ff5722;
  font-size: 22px;
  font-weight: 700;
}
.sep {
  color: var(--color-border-strong);
}

.job-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.tag {
  padding: 3px 10px;
  background: rgba(30, 128, 255, 0.1);
  color: var(--color-primary);
  border-radius: 4px;
  font-size: 12px;
}

.stats {
  font-size: 13px;
  color: var(--color-text-tertiary);
  display: flex;
  gap: 6px;
  align-items: center;
}

.viewers-live {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  background: rgba(82, 196, 26, 0.12);
  color: #52c41a;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #52c41a;
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.6; }
}

.banner-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
}
.company-name {
  font-size: 16px;
  font-weight: 600;
  margin-top: 12px;
}
.company-meta {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.action-bar {
  display: flex;
  gap: 12px;
  justify-content: flex-start;
}

/* Body */
.body {
  max-width: 1080px;
  margin: 24px auto 0;
  padding: 0 24px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
}
.main-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.block {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.block-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 3px solid var(--color-primary);
}
.description p {
  font-size: 14px;
  color: var(--color-text-primary);
  line-height: 1.8;
  margin-bottom: 10px;
  white-space: pre-wrap;
}
.description p:last-child { margin-bottom: 0; }

.req-list {
  padding-left: 20px;
}
.req-list li {
  list-style: decimal;
  margin: 6px 0;
  padding-left: 4px;
  font-size: 14px;
  color: var(--color-text-primary);
  line-height: 1.7;
}
.benefits {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.benefit {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f0f9ff;
  color: #0958d9;
  border-radius: 6px;
  font-size: 13px;
}
.benefit-icon {
  color: #52c41a;
  font-weight: 700;
}

/* Side */
.side-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.side-block {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.side-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}
.similar-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.similar-item {
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.similar-item:hover {
  background: #f5f5f7;
}
.similar-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}
.similar-meta {
  font-size: 12px;
  color: var(--color-text-tertiary);
  display: flex;
  gap: 4px;
}
.similar-meta .dot { opacity: 0.5; }
.similar-salary {
  margin-top: 4px;
  font-size: 12px;
  color: #ff5722;
  font-weight: 500;
}
.empty {
  padding: 20px 0;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.cta-block {
  background: linear-gradient(135deg, #fff7e6 0%, #fff2e6 100%);
  text-align: center;
}
.cta-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
.cta-block h4 {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 6px;
}
.cta-block p {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
  line-height: 1.5;
}

.apply-dialog {
  padding: 8px 0;
}
.apply-target {
  padding: 12px;
  background: #f5f5f7;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

/* AI 分析弹窗 */
.ai-dialog {
  padding: 8px 0;
}
.ai-target {
  padding: 12px;
  background: linear-gradient(135deg, #fff7e6 0%, #fff2e6 100%);
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 12px;
  color: var(--color-text-primary);
}
.ai-loading {
  margin-top: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--color-text-secondary);
  font-size: 13px;
}
.ai-loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: ai-bounce 1.4s ease-in-out infinite;
}
.ai-loading-dot + .ai-loading-dot {
  margin-left: -2px;
}
.ai-loading span {
  margin-left: 8px;
}
@keyframes ai-bounce {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(-6px); opacity: 1; }
}

.ai-result {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #fdf4ff 100%);
  border-radius: 12px;
  border-left: 3px solid #722ed1;
}
.ai-result-head {
  margin-bottom: 12px;
}
.ai-badge {
  display: inline-block;
  padding: 3px 10px;
  background: #722ed1;
  color: #fff;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.ai-result-body {
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}

@media (max-width: 900px) {
  .banner-body {
    grid-template-columns: 1fr;
  }
  .body {
    grid-template-columns: 1fr;
  }
}
</style>
