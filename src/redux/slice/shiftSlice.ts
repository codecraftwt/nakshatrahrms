import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

interface ShiftState {
  data: any | null;
  loading: boolean;
  error: string | null;
  assignedData: any | null;
  assignedLoading: boolean;
  assignedError: string | null;
}

const initialState: ShiftState = {
  data: null,
  loading: false,
  error: null,
  assignedData: null,
  assignedLoading: false,
  assignedError: null,
};

export const fetchCurrentShift = createAsyncThunk(
  'shift/fetchCurrentShift',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/shift/current');
      return response.data;
    } catch (error: any) {
      console.log('Shift Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch current shift');
    }
  }
);

export const fetchAssignedShift = createAsyncThunk(
  'shift/fetchAssignedShift',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/shift/assigned');
      return response.data;
    } catch (error: any) {
      console.log('Assigned Shift Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assigned shift');
    }
  }
);

const shiftSlice = createSlice({
  name: 'shift',
  initialState,
  reducers: {
    clearShift: (state) => {
      state.data = null;
      state.error = null;
      state.assignedData = null;
      state.assignedError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Current Shift
      .addCase(fetchCurrentShift.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentShift.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload?.data?.shift || action.payload?.shift || action.payload;
      })
      .addCase(fetchCurrentShift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Assigned Shift
      .addCase(fetchAssignedShift.pending, (state) => {
        state.assignedLoading = true;
        state.assignedError = null;
      })
      .addCase(fetchAssignedShift.fulfilled, (state, action) => {
        state.assignedLoading = false;
        state.assignedData = action.payload?.data?.shift || action.payload?.shift || action.payload;
      })
      .addCase(fetchAssignedShift.rejected, (state, action) => {
        state.assignedLoading = false;
        state.assignedError = action.payload as string;
      });
  },
});

export const { clearShift } = shiftSlice.actions;
export default shiftSlice.reducer;
