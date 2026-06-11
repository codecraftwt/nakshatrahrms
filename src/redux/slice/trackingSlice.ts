import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

interface TrackingState {
  liveKmData: any | null;
  loading: boolean;
  error: string | null;
  routeData: any | null;
  routeLoading: boolean;
  routeError: string | null;
  dailyKmData: any | null;
  dailyKmLoading: boolean;
  dailyKmError: string | null;
  kmSummaryData: any | null;
  kmSummaryLoading: boolean;
  kmSummaryError: string | null;
}

const initialState: TrackingState = {
  liveKmData: null,
  loading: false,
  error: null,
  routeData: null,
  routeLoading: false,
  routeError: null,
  dailyKmData: null,
  dailyKmLoading: false,
  dailyKmError: null,
  kmSummaryData: null,
  kmSummaryLoading: false,
  kmSummaryError: null,
};

export const fetchLiveKm = createAsyncThunk(
  'tracking/fetchLiveKm',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tracking/live-km');
      return response.data;
    } catch (error: any) {
      console.log('Live KM Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch live KM');
    }
  }
);

export const fetchRouteData = createAsyncThunk(
  'tracking/fetchRouteData',
  async (date: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tracking/route?date=${date}`);
      return response.data;
    } catch (error: any) {
      console.log('Route Data Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch route data');
    }
  }
);

export const fetchDailyKm = createAsyncThunk(
  'tracking/fetchDailyKm',
  async (date: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/km/daily?date=${date}`);
      return response.data;
    } catch (error: any) {
      console.log('Daily KM Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch daily KM');
    }
  }
);

export const fetchKmSummary = createAsyncThunk(
  'tracking/fetchKmSummary',
  async (period: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/km/summary?period=${period}`);
      return response.data;
    } catch (error: any) {
      console.log('KM Summary Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch KM summary');
    }
  }
);

const trackingSlice = createSlice({
  name: 'tracking',
  initialState,
  reducers: {
    clearTracking: (state) => {
      state.liveKmData = null;
      state.error = null;
      state.routeData = null;
      state.routeError = null;
      state.dailyKmData = null;
      state.dailyKmError = null;
      state.kmSummaryData = null;
      state.kmSummaryError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLiveKm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLiveKm.fulfilled, (state, action) => {
        state.loading = false;
        state.liveKmData = action.payload?.data || action.payload;
      })
      .addCase(fetchLiveKm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchRouteData.pending, (state) => {
        state.routeLoading = true;
        state.routeError = null;
      })
      .addCase(fetchRouteData.fulfilled, (state, action) => {
        state.routeLoading = false;
        state.routeData = action.payload?.data || action.payload;
      })
      .addCase(fetchRouteData.rejected, (state, action) => {
        state.routeLoading = false;
        state.routeError = action.payload as string;
      })
      .addCase(fetchDailyKm.pending, (state) => {
        state.dailyKmLoading = true;
        state.dailyKmError = null;
      })
      .addCase(fetchDailyKm.fulfilled, (state, action) => {
        state.dailyKmLoading = false;
        state.dailyKmData = action.payload?.data || action.payload;
      })
      .addCase(fetchDailyKm.rejected, (state, action) => {
        state.dailyKmLoading = false;
        state.dailyKmError = action.payload as string;
      })
      .addCase(fetchKmSummary.pending, (state) => {
        state.kmSummaryLoading = true;
        state.kmSummaryError = null;
      })
      .addCase(fetchKmSummary.fulfilled, (state, action) => {
        state.kmSummaryLoading = false;
        state.kmSummaryData = action.payload?.data || action.payload;
      })
      .addCase(fetchKmSummary.rejected, (state, action) => {
        state.kmSummaryLoading = false;
        state.kmSummaryError = action.payload as string;
      });
  },
});

export const { clearTracking } = trackingSlice.actions;
export default trackingSlice.reducer;
