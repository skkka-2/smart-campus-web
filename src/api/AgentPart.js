import request from '../util/request';

/** 拉取当前用户完整对话历史(user + assistant + legacy) */
export const getAgentHistory = () => request.get('/api/agent/history');

/** 清空当前用户对话 */
export const clearAgentHistory = () => request.delete('/api/agent/history');
