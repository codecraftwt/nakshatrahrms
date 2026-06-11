import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';


interface AuthState {
  user: any | null;
  token: string | null;
  tokenType: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  tokenType: null,
  isLoggedIn: false,
  loading: false,
  error: null,
};

export const loginCandidate = createAsyncThunk(
  'auth/loginCandidate',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', {
        login: credentials.email,
        password: credentials.password,
      });
      return response?.data;
    } catch (error: any) {
      console.log("Login Error:", error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);



export const logoutCandidate = createAsyncThunk(
  'auth/logoutCandidate',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      if (token) {
        await api.post('/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      dispatch(logout());
   
      return true;
    } catch (error: any) {

      // Still logout locally even if API fails (e.g. token expired)
      dispatch(logout());
    
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.tokenType = null;
      state.isLoggedIn = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginCandidate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginCandidate.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        // Updated to handle the new login endpoint payload
        state.user = action.payload?.result || action.payload?.data?.employee || action.payload?.data?.user || action.payload?.data || action.payload;
        state.token = action.payload?.session_id || action.payload?.data?.token || action.payload?.token || action.payload?.access_token || action.payload?.data?.access_token;
      })
      .addCase(loginCandidate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
