// src/api/index.js
import axios from "axios";

// Create axios instance without interceptors first
const api = axios.create({
  baseURL: process.env.REACT_APP_API,
});

// Export a function to set up interceptors after store is created
export const setupInterceptors = (store) => {
  // Request interceptor to add auth token to headers
  api.interceptors.request.use(
    (config) => {
      const token = store.getState().auth.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle 401 errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        store.dispatch(logout());
      }
      return Promise.reject(error);
    }
  );
};

export default api;
