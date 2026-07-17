import request from '../util/request';

/** 完整画像 */
export const getMyProfile = () => request.get('/api/users/me/profile');

/** 更新画像 */
export const updateMyProfile = (patch) =>
  request.put('/api/users/me/profile', patch);
