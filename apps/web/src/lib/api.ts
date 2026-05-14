import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

const shouldRefresh = (error: any, originalRequest: any) => {
  if (originalRequest?._retry) return false;

  const url = originalRequest?.url || '';
  if (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh')
  ) {
    return false;
  }

  if (error.response?.status === 401) return true;

  const message = error.response?.data?.message;
  return (
    error.response?.status === 403 &&
    typeof message === 'string' &&
    message.includes('缺少租户信息')
  );
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    clearAuth();
    throw new Error('Missing refresh token');
  }

  const res = await axios.post('/api/auth/refresh', { refreshToken });
  const { accessToken, refreshToken: newRefreshToken } = res.data;

  localStorage.setItem('token', accessToken);
  localStorage.setItem('refreshToken', newRefreshToken);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`;

  return accessToken;
};

// 请求拦截器：注入 JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：401 时尝试 refresh，失败则跳转登录
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (shouldRefresh(error, originalRequest)) {
      if (isRefreshing) {
        // 已有 refresh 请求在飞，排队等待
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const accessToken = await refreshAccessToken();
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

function clearAuth() {
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
    window.location.href = window.location.pathname.startsWith('/client') ? '/client/login' : '/login';
  }
}

export default api;
