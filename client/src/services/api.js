import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api", timeout: 45000 });

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem("ss_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith("/auth")) {
      localStorage.removeItem("ss_token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(err);
  }
);

export default api;
