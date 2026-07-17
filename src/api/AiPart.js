import request from '../util/request';

/**
 * 向 AI 提问
 * 后端从 JWT 里解析 userId,前端不用传
 * @returns {Promise<{ reply: string }>}
 */
export const ai = ({ content }) => request.post('/api/ai/chat', { content });

/** 拉当前用户的历史对话 */
export const getChatHistory = () => request.get('/api/ai/history');

/** 清空当前用户的对话 */
export const clearChatHistory = () => request.delete('/api/ai/history');

/** AI 简历适配度分析 */
export const analyzeResume = ({ resume, jobTitle, jobDesc, jobRequirements } = {}) =>
  request.post('/api/ai/resume-analysis', { resume, jobTitle, jobDesc, jobRequirements });
