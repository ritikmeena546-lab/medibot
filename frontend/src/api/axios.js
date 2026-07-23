import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 90000, // 90s — covers Render free-tier cold starts (can take up to 60s)
});

// ── Auth token injection ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auto-retry on network/timeout errors (cold start recovery) ────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Only retry on network errors or timeouts (no response received)
    const isNetworkError = !error.response;
    const isTimeout = error.code === 'ECONNABORTED';
    const shouldRetry = (isNetworkError || isTimeout) && !config._retried;

    if (shouldRetry) {
      config._retried = true;
      // Wait 5s then retry — gives the server time to wake from cold start
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
