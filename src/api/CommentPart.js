import request from '../util/request';

/**
 * 按用户名查评论(兼容旧接口)
 * @param {{ userName: string }} payload
 */
export const commentAcquire = ({ userName }) =>
  request.post('/api/comments/query', { userName });

/** 分页拉所有评论 */
export const listComments = ({ page = 1, limit = 20 } = {}) =>
  request.get('/api/comments', { params: { page, limit } });

/** 发表评论(需登录) */
export const createComment = ({ content }) =>
  request.post('/api/comments', { content });
