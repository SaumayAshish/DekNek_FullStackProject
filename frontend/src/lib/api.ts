import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
console.log("BASE URL:", process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('portfolio_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('portfolio_token');
      localStorage.removeItem('portfolio_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/signup', data),
  login: async (data: { email: string; password: string }) => {
    console.log("LOGIN CALLED");
    return api.post('/auth/login', data);
  },
  profile: () => api.get('/auth/profile'),
};

// ── Portfolio ─────────────────────────────────────────────────
export const portfolioAPI = {
  get: () => api.get('/portfolio'),
  add: (data: { stock_symbol: string; quantity: number; buy_price: number }) =>
    api.post('/portfolio/add', data),
  remove: (id: string) => api.delete(`/portfolio/${id}`),
  aiRecommend: (symbol: string) => api.get(`/portfolio/ai/${symbol}`),
  topRecommendations: () => api.get('/portfolio/ai-top/recommendations'),
};

// ── Stock ─────────────────────────────────────────────────────
export const stockAPI = {
  getQuote: (symbol: string) => api.get(`/stock/${symbol}`),
  getNifty50: () => api.get('/stock/nifty50'),
};

export default api;
