import request from '../util/request';

/** 拉最新 N 条群聊记录 */
export const listChatHistory = ({ limit = 10 } = {}) =>
  request.get('/api/chat/history', { params: { limit } });
