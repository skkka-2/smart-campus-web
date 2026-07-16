import axios from 'axios';
import { ElMessage } from 'element-plus';

/**
 * axios 实例
 * 后端响应格式:{ code, message, data }
 *   - 成功(code === 0):自动 unwrap 出 data
 *   - 业务错误(code !== 0):toast 提示,reject
 *   - HTTP 4xx/5xx:toast 提示,reject
 *   - 401 特殊处理:清 store + 跳登录
 *
 * ⚠️ userStore 只能在拦截器函数体内取,不能在模块顶层——否则会在 pinia
 * 挂载之前执行,拿到 undefined。
 */
const request = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ==================== 请求拦截器 ====================
request.interceptors.request.use(
  async (config) => {
    // 延迟 import,避免循环依赖(store 也可能 import request)
    const { useUserStore } = await import('../stores');
    const userStore = useUserStore();
    const token = userStore.token;
    if (token) config.headers.Authorization = token;
    return config;
  },
  (error) => Promise.reject(error),
);

// ==================== 响应拦截器 ====================
request.interceptors.response.use(
  (response) => {
    const body = response.data;

    // 后端已返回统一 { code, message, data } 结构
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) return body.data; // ⭐ 自动 unwrap
      // 业务错误
      ElMessage.error(body.message || '请求失败');
      return Promise.reject(new Error(body.message || '业务错误'));
    }

    // 不符合规范的响应(比如老接口、代理透传),原样返回 response
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const body = error.response?.data;
    const message = body?.message || error.message || '网络错误';

    if (status === 401) {
      // 清 token + 跳登录
      const { useUserStore } = await import('../stores');
      const userStore = useUserStore();
      userStore.clearToken();
      userStore.clearID();
      ElMessage.error(message);
      // 用 window.location 避免依赖 router 实例(拦截器可能在 router 挂载前触发)
      if (!location.pathname.startsWith('/login')) {
        setTimeout(() => {
          location.href = '/login';
        }, 500);
      }
    } else {
      ElMessage.error(message);
    }

    return Promise.reject(error);
  },
);

export default request;
