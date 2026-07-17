<script setup>
import { ref, computed, nextTick, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElInput, ElButton, ElMessage, ElAvatar, ElTooltip } from 'element-plus';
import AvatarWithFallback from '@/components/AvatarWithFallback.vue';
import { useAgentStream } from '@/composables/useAgentStream';
import { useAuth } from '@/composables/useAuth';
import { getAgentHistory, clearAgentHistory } from '@/api/AgentPart';

const router = useRouter();
const { userID, username } = useAuth();

/**
 * 一条消息在 UI 上有三种形态:
 *   { role: 'user',      text }
 *   { role: 'assistant', text, tools: [{ name, args, result, error }] }
 *   { role: 'assistant', streaming: true, thinking: true, tools: [...], text: '' }
 */
const messages = ref([]);
const inputText = ref('');
const messagesRef = ref(null);

// 工具执行卡片的展示映射
const TOOL_LABELS = {
  get_my_profile: { icon: '👤', label: '读取你的画像' },
  list_jobs: { icon: '🔍', label: '搜索岗位库' },
  get_job_detail: { icon: '📄', label: '拉取岗位详情' },
  recommend_jobs: { icon: '✨', label: '基于画像推荐' },
  list_my_favorites: { icon: '❤️', label: '读取收藏列表' },
  list_my_applications: { icon: '📮', label: '读取投递记录' },
  favorite_job: { icon: '⭐', label: '收藏岗位' },
  apply_job: { icon: '🚀', label: '提交投递' },
};

function labelForTool(name) {
  return TOOL_LABELS[name] || { icon: '🔧', label: name };
}

// ==================== SSE ====================
const { send: sendStream, cancel, streaming } = useAgentStream({
  onEvent(evt) {
    const last = messages.value[messages.value.length - 1];
    if (!last || last.role !== 'assistant' || !last.streaming) return;

    switch (evt.type) {
      case 'thinking':
        last.thinking = true;
        break;
      case 'mock_fallback':
        last.mockNote = 'AI 服务临时不可用,已切到规则模式';
        break;
      case 'tool_call':
        last.tools.push({
          name: evt.name,
          args: evt.arguments,
          status: 'running',
        });
        break;
      case 'tool_result': {
        const t = last.tools.find((x) => x.name === evt.name && x.status === 'running');
        if (t) {
          t.status = evt.error ? 'error' : 'done';
          t.result = evt.result;
          t.error = evt.error;
          t.count = Array.isArray(evt.result) ? evt.result.length : null;
        }
        break;
      }
      case 'final':
        last.thinking = false;
        last.text = evt.content;
        break;
      case 'error':
        last.thinking = false;
        last.error = evt.message;
        break;
    }
    scrollToBottom();
  },
  onDone() {
    const last = messages.value[messages.value.length - 1];
    if (last?.role === 'assistant') last.streaming = false;
    scrollToBottom();
  },
  onError(err) {
    const last = messages.value[messages.value.length - 1];
    if (last?.role === 'assistant') {
      last.streaming = false;
      last.thinking = false;
      last.error = err.message || '未知错误';
    }
  },
});

// ==================== 交互 ====================

const suggestions = [
  { icon: '✨', label: '推荐 5 个最匹配的岗位', text: '基于我的画像,推荐 5 个最匹配的岗位' },
  { icon: '🔍', label: '北京的前端实习', text: '有哪些北京的前端实习?' },
  { icon: '📮', label: '看看我投过什么', text: '我投递过哪些岗位,状态怎么样?' },
  { icon: '🎯', label: '简历怎么改', text: '按目前的画像,我的简历怎么改能更受青睐?' },
];

function pickSuggestion(s) {
  inputText.value = s.text;
  send();
}

async function send() {
  const text = inputText.value.trim();
  if (!text || streaming.value) return;

  messages.value.push({ role: 'user', text });
  messages.value.push({
    role: 'assistant',
    streaming: true,
    thinking: true,
    tools: [],
    text: '',
    error: null,
    mockNote: null,
  });

  inputText.value = '';
  await nextTick();
  scrollToBottom();

  sendStream(text);
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
}

async function loadHistory() {
  try {
    const data = await getAgentHistory();
    const rows = data?.items || [];
    messages.value = rows.map((r) => ({
      role: r.role === 'ai' ? 'assistant' : r.role, // 兼容旧记录
      text: r.text,
      tools: r.metadata?.tools?.map((n) => ({ name: n, status: 'done' })) || [],
      streaming: false,
    }));
  } catch { /* silent */ }
}

async function clearHistory() {
  try {
    await clearAgentHistory();
    messages.value = [];
    ElMessage.success('已清空');
  } catch { /* silent */ }
}

/** 简版 Markdown → HTML(只支持 **粗** 和换行) */
function renderMarkdown(text) {
  if (!text) return '';
  const esc = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return esc
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');
}

onMounted(loadHistory);
</script>

<template>
  <div class="agent-page">
    <!-- 顶部标题栏 -->
    <header class="agent-header">
      <div class="header-inner">
        <div class="brand">
          <div class="brand-icon">✨</div>
          <div>
            <h1 class="brand-title">智学助手</h1>
            <p class="brand-sub">带画像 + 工具调用 · 不只是聊天</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button size="small" plain @click="clearHistory" :disabled="streaming">
            清空对话
          </el-button>
        </div>
      </div>
    </header>

    <!-- 主体 -->
    <main class="messages-wrap">
      <div class="messages" ref="messagesRef">
        <!-- 空态:欢迎 + 建议卡 -->
        <div v-if="!messages.length" class="welcome">
          <div class="welcome-icon">✨</div>
          <h2 class="welcome-title">你好,我是智学助手</h2>
          <p class="welcome-sub">
            我能读到你的画像和岗位数据,给出针对性建议。<br />
            试试下面的问题:
          </p>
          <div class="suggestions">
            <button
              v-for="s in suggestions"
              :key="s.label"
              class="suggest-chip"
              @click="pickSuggestion(s)"
            >
              <span class="chip-icon">{{ s.icon }}</span>
              {{ s.label }}
            </button>
          </div>
        </div>

        <!-- 消息 -->
        <div v-for="(m, i) in messages" :key="i" class="msg" :class="`msg-${m.role}`">
          <!-- 头像 -->
          <div class="msg-avatar">
            <AvatarWithFallback
              v-if="m.role === 'user'"
              :user-id="userID"
              :name="username"
              :size="36"
            />
            <div v-else class="assistant-avatar">✨</div>
          </div>

          <!-- 消息内容 -->
          <div class="msg-body">
            <div class="msg-name">
              {{ m.role === 'user' ? (username || '你') : '智学助手' }}
            </div>

            <!-- mock 说明 -->
            <div v-if="m.mockNote" class="mock-note">
              <span class="mock-dot" />
              {{ m.mockNote }}
            </div>

            <!-- 工具调用卡 -->
            <div v-if="m.tools?.length" class="tools-timeline">
              <div v-for="(t, ti) in m.tools" :key="ti" class="tool-step" :class="`tool-${t.status}`">
                <span class="tool-icon">{{ labelForTool(t.name).icon }}</span>
                <span class="tool-label">{{ labelForTool(t.name).label }}</span>
                <span class="tool-status">
                  <template v-if="t.status === 'running'">
                    <span class="tool-spinner" /> 执行中
                  </template>
                  <template v-else-if="t.status === 'done'">
                    <template v-if="t.count != null">✓ 拿到 {{ t.count }} 条</template>
                    <template v-else>✓ 完成</template>
                  </template>
                  <template v-else-if="t.status === 'error'">
                    ⚠ {{ t.error }}
                  </template>
                </span>
              </div>
            </div>

            <!-- thinking 状态 -->
            <div v-if="m.streaming && m.thinking && !m.tools?.length" class="thinking">
              <span class="td" />
              <span class="td" style="animation-delay: 0.15s" />
              <span class="td" style="animation-delay: 0.3s" />
              <span class="thinking-hint">思考中...</span>
            </div>

            <!-- 最终文本 -->
            <div v-if="m.text" class="msg-text" v-html="renderMarkdown(m.text)" />

            <!-- 错误 -->
            <div v-if="m.error" class="msg-error">
              ⚠ {{ m.error }}
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部输入区 -->
    <footer class="composer">
      <div class="composer-inner">
        <div class="composer-hint">
          <span class="dot"></span>
          {{ streaming ? 'AI 正在响应…' : '按 Enter 发送 · Shift + Enter 换行' }}
        </div>
        <div class="input-row">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="1"
            :autosize="{ minRows: 1, maxRows: 5 }"
            placeholder="问点什么…比如「帮我找 5 个字节的前端实习」"
            :disabled="streaming"
            @keydown.enter.exact.prevent="send"
          />
          <el-button
            v-if="!streaming"
            type="primary"
            :disabled="!inputText.trim()"
            @click="send"
            round
            size="large"
          >
            发送
          </el-button>
          <el-button
            v-else
            type="danger"
            plain
            round
            size="large"
            @click="cancel"
          >
            停止
          </el-button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
/** 简版 Markdown → HTML(只支持 **粗** 和换行) */
function renderMarkdown(text) {
  if (!text) return '';
  const esc = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return esc
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');
}
export default { methods: { renderMarkdown } };
</script>

<style scoped>
.agent-page {
  height: calc(100vh - var(--header-height));
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8f9ff 0%, #f5f5f7 100%);
}

/* Header */
.agent-header {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  padding: 14px 24px;
}
.header-inner {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(118, 75, 162, 0.3);
}
.brand-title {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 2px;
}
.brand-sub {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* Messages */
.messages-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.messages {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
}
.messages > * {
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

/* Welcome */
.welcome {
  padding: 60px 20px;
  text-align: center;
}
.welcome-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  box-shadow: 0 8px 24px rgba(118, 75, 162, 0.35);
}
.welcome-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
}
.welcome-sub {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin-bottom: 32px;
}
.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 640px;
  margin: 0 auto;
}
.suggest-chip {
  padding: 12px 18px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 24px;
  font-size: 14px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.suggest-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
  color: #667eea;
}
.chip-icon {
  font-size: 15px;
}

/* Message row */
.msg {
  display: flex;
  gap: 14px;
  margin-bottom: 24px;
}
.msg-user {
  flex-direction: row-reverse;
}
.msg-avatar {
  flex: 0 0 auto;
}
.assistant-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(118, 75, 162, 0.3);
}
.msg-body {
  flex: 1;
  min-width: 0;
  max-width: 620px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.msg-user .msg-body {
  align-items: flex-end;
}

.msg-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 0 4px;
}

.msg-text {
  padding: 12px 16px;
  background: #fff;
  border-radius: 14px;
  border-top-left-radius: 4px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  word-wrap: break-word;
}
.msg-text :deep(strong) {
  color: #667eea;
  font-weight: 600;
}
.msg-user .msg-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 14px;
  border-top-right-radius: 4px;
}
.msg-user .msg-text :deep(strong) {
  color: #fff;
}

.msg-error {
  padding: 10px 14px;
  background: #fff2f0;
  color: #cf1322;
  border-radius: 10px;
  font-size: 13px;
}

/* Mock note */
.mock-note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #fff7e6;
  color: #d46b08;
  border-radius: 6px;
  font-size: 12px;
}
.mock-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d46b08;
}

/* Tools timeline */
.tools-timeline {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: rgba(102, 126, 234, 0.06);
  border-radius: 10px;
  border-left: 3px solid #667eea;
}
.tool-step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  padding: 4px 0;
}
.tool-icon {
  font-size: 16px;
}
.tool-label {
  flex: 1;
  color: var(--color-text-primary);
  font-weight: 500;
}
.tool-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.tool-running .tool-label { color: #667eea; }
.tool-done .tool-status { color: #52c41a; }
.tool-error .tool-status { color: #cf1322; }

.tool-spinner {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 2px solid #d9e0f5;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Thinking dots */
.thinking {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 14px;
  border-top-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  align-self: flex-start;
}
.td {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #667eea;
  animation: td-bounce 1.4s ease-in-out infinite;
}
@keyframes td-bounce {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(-6px); opacity: 1; }
}
.thinking-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* Composer */
.composer {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--color-border);
  padding: 16px 24px 20px;
}
.composer-inner {
  max-width: 800px;
  margin: 0 auto;
}
.composer-hint {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-bottom: 8px;
  padding-left: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.composer-hint .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #52c41a;
}
.input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
.input-row :deep(.el-textarea__inner) {
  border-radius: 12px;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  box-shadow: none;
  font-size: 14px;
}
.input-row :deep(.el-textarea__inner:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

@media (max-width: 720px) {
  .header-inner, .messages > *, .composer-inner { max-width: 100%; }
  .msg-body { max-width: calc(100vw - 100px); }
}
</style>
