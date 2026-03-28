import axios from 'axios';
import toast from 'react-hot-toast';

// Tự động dùng cùng host với browser — hoạt động với localhost và IP LAN/WiFi
const API_BASE = import.meta.env.VITE_API_URL
  || `http://${window.location.hostname}:7071`;

const axiosClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else {
      const message = error.response?.data?.error || 'Đã xảy ra lỗi, vui lòng thử lại';
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
