import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Replace with your backend URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and it's not a refresh token request
    if (error.response.status === 401 && !originalRequest._retry) {
      // Exclude specific URLs from triggering the redirect to login
      const excludedUrls = ['/auth/login', '/auth/accept-terms', '/game/config'];
      const requestUrl = originalRequest.url.replace(api.defaults.baseURL, ''); // Get relative path

      if (excludedUrls.includes(requestUrl)) {
        return Promise.reject(error); // Allow the 401 to propagate to the component
      }

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.clear();
        window.location.href = '/login'; // Adjust this to your login route
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken: newAccessToken } = response.data;
        localStorage.setItem('accessToken', newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login'; // Adjust this to your login route
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export const monetizationApi = {
  simulatePremiumPurchase: () => api.post('/monetization/simulate-premium', {}), // Pasar un cuerpo vacío para que el interceptor se active
  simulateScandalRescue: () => api.post('/monetization/simulate-scandal-rescue', {}),
  rewardAd: () => api.post('/monetization/reward-ad', {}),
};
