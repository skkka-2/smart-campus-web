import { ref, onMounted, onBeforeUnmount } from 'vue';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:3007';

/**
 * 岗位浏览人数实时订阅
 *   const { viewers, connected } = useJobViewers(jobIdRef)
 *
 * 组件卸载自动 leave + close。
 */
export function useJobViewers(jobId) {
  const viewers = ref(0);
  const connected = ref(false);
  let socket = null;

  function connect() {
    try {
      const idVal = typeof jobId === 'function' ? jobId() : (jobId?.value ?? jobId);
      if (idVal == null) return;

      socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        connected.value = true;
        socket.send(JSON.stringify({ type: 'joinJobRoom', jobId: String(idVal) }));
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'jobViewers' && String(msg.jobId) === String(idVal)) {
            viewers.value = msg.count;
          }
        } catch { /* noop */ }
      };

      socket.onclose = () => {
        connected.value = false;
      };
    } catch (err) {
      console.warn('[useJobViewers] connect failed:', err);
    }
  }

  function disconnect() {
    if (socket) {
      try {
        const idVal = typeof jobId === 'function' ? jobId() : (jobId?.value ?? jobId);
        if (idVal != null && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'leaveJobRoom', jobId: String(idVal) }));
        }
      } catch { /* noop */ }
      try { socket.close(); } catch { /* noop */ }
      socket = null;
    }
    connected.value = false;
  }

  onMounted(connect);
  onBeforeUnmount(disconnect);

  return { viewers, connected };
}
