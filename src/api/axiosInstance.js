import axios from 'axios';
import { logout } from '../redux/slice/authSlice';
import { clearProfile } from '../redux/slice/profileSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

export let BASE_URL = 'https://laxmidatta.nakshatrainfo.co.in/';

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

export const setBaseUrl = async (url) => {
  BASE_URL = url;
  api.defaults.baseURL = url;
  await AsyncStorage.setItem('@app_base_url', url);
};

export const initializeBaseUrl = async () => {
  try {
    const savedUrl = await AsyncStorage.getItem('@app_base_url');
    if (savedUrl) {
      BASE_URL = savedUrl;
      api.defaults.baseURL = savedUrl;
      return savedUrl;
    }
  } catch (e) {
    console.error('Failed to load base URL', e);
  }
  return null;
};


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

let isSessionExpiredAlertShown = false;

const handleSessionExpired = () => {
  const { store } = require('../redux/store');
  const state = store.getState();
  const token = state.auth?.token;

  // Do not show the session expired modal if the user is already logged out or doesn't have a token
  if (!token) return;

  if (isSessionExpiredAlertShown) return;
  isSessionExpiredAlertShown = true;
  
  const { setSessionExpiredModalVisible } = require('../redux/slice/authSlice');
  
  store.dispatch(setSessionExpiredModalVisible(true));
  
  // Reset the throttle flag after a delay so it works for the next login session
  setTimeout(() => {
    isSessionExpiredAlertShown = false;
  }, 5000);
};

// Response interceptor to handle global token expiration
api.interceptors.response.use(
  (response) => {
    // Handle cases where the server returns 200 OK but with the error in the JSON payload
    const msg = response.data?.message?.toLowerCase() || '';
    if (
      response.data?.status === false &&
      msg.includes("invalid or expired token")
    ) {
      if (response.config && !response.config.url.includes('/auth/logout')) {
        handleSessionExpired();
      }
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const isUnauthorized = error.response.status === 401;
      const msg = error.response.data?.message?.toLowerCase() || '';
      const hasExpiredMessage = msg.includes("invalid or expired token");
      
      if (isUnauthorized || hasExpiredMessage) {
        if (error.config && !error.config.url.includes('/auth/logout')) {
          handleSessionExpired();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

