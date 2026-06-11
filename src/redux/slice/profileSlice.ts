import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

interface ProfileState {
  data: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchEmployeeProfile = createAsyncThunk(
  'profile/fetchEmployeeProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/employee/profile');
      return response.data;
    } catch (error: any) {
      console.log('Profile Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch employee profile');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload?.data?.employee || action.payload?.employee || action.payload;
      })
      .addCase(fetchEmployeeProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
