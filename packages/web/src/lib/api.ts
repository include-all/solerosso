import axios from "axios";

const getBaseUrl = () => {
  if (typeof window === "undefined") {
    // SSR - 服务端渲染时使用内部地址
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  }
  // 客户端 - 开发环境走代理，生产环境走同域名
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3001";
  }
  return process.env.NEXT_PUBLIC_API_URL || "";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器 - 自动添加 token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 响应拦截器 - 处理 token 过期
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 如果是 401 且不是刷新 token 的请求，尝试刷新
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${getBaseUrl()}/api/auth/refresh`,
            { refreshToken },
          );
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          // 刷新失败，清除 token
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
