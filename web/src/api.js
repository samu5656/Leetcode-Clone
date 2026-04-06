import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const newToken = res.data.access_token;
          localStorage.setItem("access_token", newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed — force logout.
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          
          try {
            window.dispatchEvent(new Event("authChange"));
          } catch (eventError) {
            console.error("Failed to dispatch authChange event:", eventError);
          }
          
          alert("Your session has expired. Please log in again.");
          window.location.href = "/login";
          
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// ---------- Auth ----------

export const authAPI = {
  register: (data) => api.post("/v1/auth/register", data),
  login: (data) => api.post("/v1/auth/login", data),
  refresh: (refreshToken) =>
    api.post("/v1/auth/refresh", { refresh_token: refreshToken }),
};

// ---------- Users ----------

export const userAPI = {
  getMe: () => api.get("/v1/users/me"),
  updateMe: (data) => api.put("/v1/users/me", data),
  getByID: (id) => api.get(`/v1/users/${id}`),
};

// ---------- Problems ----------

export const problemAPI = {
  list: (params = {}) => api.get("/v1/problems", { params }),
  getBySlug: (slug) => api.get(`/v1/problems/${slug}`),
};

// ---------- Contests ----------

export const contestAPI = {
  list: (params = {}) => api.get("/v1/contests", { params }),
  getByID: (id) => api.get(`/v1/contests/${id}`),
  join: (id) => api.post(`/v1/contests/${id}/join`),
  leaderboard: (id, params = {}) =>
    api.get(`/v1/contests/${id}/leaderboard`, { params }),
};

// ---------- Submissions ----------

export const submissionAPI = {
  create: (data) => api.post("/v1/submissions", data),
  getByID: (id) => api.get(`/v1/submissions/${id}`),
};

// ---------- Leaderboard ----------

export const leaderboardAPI = {
  global: (params = {}) => api.get("/v1/leaderboard", { params }),
};

// ---------- Admin ----------

export const adminAPI = {
  createProblem: (data) => api.post("/v1/admin/problems", data),
  bulkCreateProblems: (data) => api.post("/v1/admin/problems/bulk", data),
  deleteProblem: (id) => api.delete(`/v1/admin/problems/${id}`),
  createContest: (data) => api.post("/v1/admin/contests", data),
};

export default api;
