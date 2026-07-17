import request from '../util/request';

/**
 * 岗位列表
 * @param {{ keyword, city, category, workType, degree, salaryMin, sort, page, limit }}
 */
export const listJobs = (params = {}) =>
  request.get('/api/jobs', { params });

/** 筛选面板选项(城市/类别/学历) */
export const fetchFilterOptions = () => request.get('/api/jobs/filter-options');

/** 为你推荐 */
export const recommendJobs = ({ limit = 6 } = {}) =>
  request.get('/api/jobs/recommend', { params: { limit } });

/** 岗位详情 */
export const getJobDetail = (id) => request.get(`/api/jobs/${id}`);

/** 收藏 toggle */
export const toggleFavorite = (id) => request.post(`/api/jobs/${id}/favorite`);

/** 投递 */
export const applyJob = (id, message) =>
  request.post(`/api/jobs/${id}/apply`, { message });

/** 我的收藏 */
export const myFavorites = ({ page = 1, limit = 20 } = {}) =>
  request.get('/api/jobs/my/favorites', { params: { page, limit } });

/** 我的投递 */
export const myApplications = ({ page = 1, limit = 20 } = {}) =>
  request.get('/api/jobs/my/applications', { params: { page, limit } });
