import axios from 'axios';
import { logout } from '../redux/slice/authSlice';
import { clearProfile } from '../redux/slice/profileSlice';

export const BASE_URL = 'http://209.182.233.135:8075/';


const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const { store } = require('../redux/store');
    const state = store.getState();
    const token = state.auth?.token;
    console.log('--- DEBUG TOKEN ---', token ? `Token exists: ${token.substring(0, 15)}...` : 'NO TOKEN FOUND IN REDUX!');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle global 401 Unauthenticated errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If server returns 401, token is invalid/expired. 
      // Do not automatically log out the user per requirement
      // const { store } = require('../redux/store');
      // store.dispatch(logout());
      // store.dispatch(clearProfile());
    }
    return Promise.reject(error);
  }
);

export default api;

