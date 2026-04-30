import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ── REQUEST INTERCEPTOR ─────────────────────────────────────────────────────
// Automatically attach the access token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── RESPONSE INTERCEPTOR ────────────────────────────────────────────────────
// When a request fails with 401 (token expired), silently fetch a new access
// token using the refresh token and retry the original request.
// A single shared promise prevents multiple parallel refresh calls.
let isRefreshing = false;
let failedRequestQueue = [];

const processQueue = (error, token = null) => {
  failedRequestQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedRequestQueue = [];
};

api.interceptors.response.use(
  // Pass successful responses straight through
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401 errors that haven't been retried yet
    // Also skip the /auth/refresh/ endpoint itself to avoid infinite loops
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh/")
    ) {
      if (isRefreshing) {
        // Another request is already refreshing — queue this one until done
        return new Promise((resolve, reject) => {
          failedRequestQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        // No refresh token available — force logout
        isRefreshing = false;
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Call the refresh endpoint directly (not via `api` to avoid interceptor loop)
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh/`,
          { refresh_token: refreshToken }
        );

        const newToken = data.access_token;
        localStorage.setItem("token", newToken);

        // Retry all queued requests with the new token
        processQueue(null, newToken);

        // Retry the original failed request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token is expired or invalid — force logout
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
