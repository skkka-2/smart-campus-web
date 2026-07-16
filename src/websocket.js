const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:3007';

let socket;
const listeners = new Set();
let onlineUsers = [];

export const getOnlineUsers = () => onlineUsers;

export const connectWebSocket = (userId) => {
  socket = new WebSocket(`${WS_URL}?userId=${userId}`);

  socket.onopen = () => {
    console.log('WebSocket connected');
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'onlineUsers') {
      onlineUsers = message.users;
    }
    listeners.forEach((listener) => listener(message));
  };

  socket.onclose = () => {
    console.log('WebSocket disconnected');
    socket = null;
  };
};

export const sendMessage = (senderId, receiverIds, content) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket is not connected');
    return;
  }
  const message = JSON.stringify({ senderId, receiverIds, content });
  socket.send(message);
};

export const addMessageListener = (listener) => {
  listeners.add(listener);
};

export const removeMessageListener = (listener) => {
  listeners.delete(listener);
};
