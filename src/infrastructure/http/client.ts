import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// 创建 axios 实例
const httpClient: AxiosInstance = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 180000, // 180 秒超时（AI 生成需要较长时间）
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 允许发送 cookies
});

// 请求拦截器
httpClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证 token
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
httpClient.interceptors.response.use(
  (response) => {
    // 直接返回 response.data，这样 http.post 等方法就能正确获取数据
    return response;
  },
  (error) => {
    // 统一错误处理
    const message = error.response?.data?.error || error.message || '请求失败';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// HTTP 方法封装
export const http = {
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await httpClient.get<T>(url, config);
    return response.data;
  },

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await httpClient.post<T>(url, data, config);
    return response.data;
  },

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await httpClient.put<T>(url, data, config);
    return response.data;
  },

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await httpClient.patch<T>(url, data, config);
    return response.data;
  },

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await httpClient.delete<T>(url, config);
    return response.data;
  },
};

export default httpClient;


