import request from '../util/request';

/**
 * 登录
 * @returns {Promise<{ token: string, user: { id, username } }>}
 */
export const login = (username, password) =>
  request.post('/api/users/login', { username, password });

/**
 * 注册
 */
export const register = (username, phone, password) =>
  request.post('/api/users/register', { username, phone, password });

/** 当前登录用户 */
export const getMe = () => request.get('/api/users/me');
