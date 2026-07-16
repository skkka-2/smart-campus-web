import request from '../util/request';

/**
 * 首页信息流分页
 * @param {'recommend'|'latest'} sort
 * @returns {Promise<{ items, page, limit, total, hasMore }>}
 */
export const listArticles = ({ sort = 'recommend', page = 1, limit = 5 } = {}) =>
  request.get('/api/articles', { params: { sort, page, limit } });

/** 首页右侧三个榜单 */
export const fetchRankings = () => request.get('/api/articles/rankings');

/** 发布新文章(旧组件用的名字保留) */
export const upload = ({ content }) => request.post('/api/articles', { content });

/** 别名 */
export const createArticle = upload;
