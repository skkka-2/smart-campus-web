import request from '../util/request';

/**
 * 文章列表
 * @param {{ sort?: 'recommend'|'latest'|'all', category?: string, page?: number, limit?: number }} params
 */
export const listArticles = ({
  sort = 'recommend',
  category = 'all',
  page = 1,
  limit = 5,
} = {}) => request.get('/api/articles', { params: { sort, category, page, limit } });

/** 首页右侧三个榜单 */
export const fetchRankings = () => request.get('/api/articles/rankings');

/** 文章详情 */
export const getArticleDetail = (id) => request.get(`/api/articles/${id}`);

/** 发布新文章(旧组件用的名字保留) */
export const upload = ({ content, title = null, categoryId = null } = {}) =>
  request.post('/api/articles', { content, title, categoryId });
export const createArticle = upload;

/** 切换点赞;返回 { liked, likeCount } */
export const toggleLike = (id) => request.post(`/api/articles/${id}/like`);

/** 分类列表 */
export const listCategories = () => request.get('/api/categories');

/** 某文章下评论 */
export const listArticleComments = (id, { page = 1, limit = 20 } = {}) =>
  request.get(`/api/articles/${id}/comments`, { params: { page, limit } });

/** 在文章下评论 */
export const createArticleComment = (id, content) =>
  request.post(`/api/articles/${id}/comments`, { content });
