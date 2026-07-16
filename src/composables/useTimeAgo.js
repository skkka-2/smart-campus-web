import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

/**
 * 相对时间格式化(x 秒前 / x 分钟前 / ...)
 *
 * 全局单一 ticker:多个组件调用 useTimeAgo,内部只跑一个 setInterval
 * (旧版本 comment.vue 每个实例一个 interval,列表越长定时器越多)。
 */

const now = ref(Date.now());
let intervalId = null;
let refCount = 0;

function ensureTicker() {
  refCount += 1;
  if (intervalId === null) {
    intervalId = setInterval(() => {
      now.value = Date.now();
    }, 30_000); // 30s 更新一次已经足够——相对时间粒度就是分钟起步
  }
}

function releaseTicker() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function format(fromTs, currentTs) {
  const from = Number(fromTs);
  if (!Number.isFinite(from)) return '';
  const diff = Math.max(0, currentTs - from);
  const s = Math.floor(diff / 1000);
  if (s < 60) return '刚刚';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} 个月前`;
  return `${Math.floor(mo / 12)} 年前`;
}

/**
 * @param {import('vue').MaybeRef<number|string>} timestamp - 毫秒时间戳
 * @returns {ComputedRef<string>}
 */
export function useTimeAgo(timestamp) {
  onMounted(ensureTicker);
  onBeforeUnmount(releaseTicker);

  return computed(() => {
    const t = typeof timestamp === 'function'
      ? timestamp()
      : (timestamp?.value ?? timestamp);
    return format(t, now.value);
  });
}
