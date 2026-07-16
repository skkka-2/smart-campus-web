import { onMounted, onBeforeUnmount, ref } from 'vue';
import { throttle } from './useDebounce';

/**
 * 挂在 window 上监听 scroll,组件卸载自动清理。
 *
 * @param {(payload: { scrollTop, clientHeight, scrollHeight, atBottom }) => void} handler
 * @param {{ delay?: number, threshold?: number }} options
 *   delay - 节流间隔,默认 200ms
 *   threshold - 距离底部多少像素算 atBottom,默认 100
 */
export function useScroll(handler, { delay = 200, threshold = 100 } = {}) {
  const scrollTop = ref(0);

  const wrapped = throttle(() => {
    const el = document.documentElement;
    const st = el.scrollTop;
    const ch = el.clientHeight;
    const sh = el.scrollHeight;
    scrollTop.value = st;
    handler({
      scrollTop: st,
      clientHeight: ch,
      scrollHeight: sh,
      atBottom: st + ch >= sh - threshold,
    });
  }, delay);

  onMounted(() => window.addEventListener('scroll', wrapped, { passive: true }));
  onBeforeUnmount(() => window.removeEventListener('scroll', wrapped));

  return { scrollTop };
}
