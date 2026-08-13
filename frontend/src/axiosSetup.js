import axios from "axios";
import secureLocalStorage from "react-secure-storage";
import { logout } from "./features/authentication/AuthSlice";
import { store } from "./features/store";

axios.defaults.baseURL = process.env.REACT_APP_API;
axios.defaults.headers.post["Accept"] = "application/json";
axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.withCredentials = true;

// Interceptor request untuk menambahkan token jika ada
axios.interceptors.request.use(
  (config) => {
    const token = secureLocalStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor response untuk menangani error 401 Unauthorized
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      store.dispatch(logout()); // Dispatch logout action untuk menghapus data autentikasi
    }
    return Promise.reject(error); // Lempar error setelah logout
  }
);

export default axios;
