/**
 * useAgentStream —— 消费 POST /api/agent/stream 的 SSE
 *
 * 由于 EventSource 不支持 POST + 自定义 header,这里直接用 fetch + ReadableStream 逐块解析。
 *
 * 用法:
 *   const { send, aborting, cancel } = useAgentStream({
 *     onEvent: (evt) => { ... },
 *     onDone: () => { ... },
 *     onError: (err) => { ... },
 *   })
 *   send('帮我找几个前端实习')
 */

import { ref } from 'vue';
import { useUserStore } from '@/stores';

const BASE_API = import.meta.env.VITE_BASE_API || '';

export function useAgentStream({ onEvent, onDone, onError } = {}) {
  const streaming = ref(false);
  const aborting = ref(false);
  let controller = null;

  async function send(message) {
    if (streaming.value) {
      console.warn('[agent] already streaming, ignore');
      return;
    }
    streaming.value = true;
    aborting.value = false;
    controller = new AbortController();

    const userStore = useUserStore();
    const token = userStore.token;

    try {
      const resp = await fetch(`${BASE_API}/api/agent/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        let msg = `HTTP ${resp.status}`;
        try {
          const body = await resp.json();
          msg = body?.message || msg;
        } catch { /* noop */ }
        throw new Error(msg);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE 是"事件块"以 \n\n 分隔;每块内是 event: X\ndata: Y
        let sepIndex;
        while ((sepIndex = buffer.indexOf('\n\n')) >= 0) {
          const rawEvent = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);
          parseAndDispatch(rawEvent);
        }
      }

      // 收尾
      if (buffer.trim()) parseAndDispatch(buffer);
      onDone?.();
    } catch (err) {
      if (err.name === 'AbortError') {
        onEvent?.({ type: 'aborted' });
      } else {
        console.error('[useAgentStream] error:', err);
        onError?.(err);
      }
    } finally {
      streaming.value = false;
      aborting.value = false;
      controller = null;
    }
  }

  function parseAndDispatch(rawEvent) {
    const lines = rawEvent.split('\n');
    let eventType = 'message';
    let dataStr = '';
    for (const line of lines) {
      if (line.startsWith('event:')) eventType = line.slice(6).trim();
      else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
    }
    if (!dataStr) return;
    let data;
    try { data = JSON.parse(dataStr); } catch { data = { raw: dataStr }; }
    onEvent?.({ type: eventType, ...data });
  }

  function cancel() {
    if (controller) {
      aborting.value = true;
      controller.abort();
    }
  }

  return { send, cancel, streaming, aborting };
}
