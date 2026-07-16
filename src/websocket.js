const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:3007';

let socket = null;
const listeners = new Set();
let onlineUsers = [];

export const getOnlineUsers = () => onlineUsers;

/**
 * 连接聊天室
 * @param {string} userId
 * @param {string} [token]  可选,后端可选校验(带 Bearer 前缀或裸 token 都支持)
 */
export const connectWebSocket = (userId, token) => {
  // 关掉旧连接,避免多标签/hot reload 时留孤儿
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    try { socket.close(); } catch { /* noop */ }
  }

  const url = new URL(WS_URL);
  url.searchParams.set('userId', userId);
  if (token) url.searchParams.set('token', token);

  socket = new WebSocket(url.toString());

  socket.onopen = () => console.log('[ws] connected');

  socket.onmessage = (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (message.type === 'onlineUsers') {
      onlineUsers = message.users || [];
    }
    listeners.forEach((listener) => listener(message));
  };

  socket.onclose = (e) => {
    console.log('[ws] disconnected:', e.code, e.reason);
    socket = null;
  };

  socket.onerror = (e) => console.error('[ws] error:', e);
};

export const sendMessage = (senderId, receiverIds, content) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('[ws] not connected');
    return;
  }
  socket.send(JSON.stringify({ senderId, receiverIds, content }));
};

export const addMessageListener = (listener) => listeners.add(listener);
export const removeMessageListener = (listener) => listeners.delete(listener);
