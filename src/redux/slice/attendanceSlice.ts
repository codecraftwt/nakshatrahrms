import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

interface AttendanceState {
  todayData: any | null;
  loading: boolean;
  error: string | null;
  statusData: any | null;
  statusLoading: boolean;
  statusError: string | null;
  historyData: any | null;
  historyLoading: boolean;
  historyError: string | null;
  summaryData: any | null;
  summaryLoading: boolean;
  summaryError: string | null;
  punchInLoading: boolean;
  punchInError: string | null;
  punchOutLoading: boolean;
  punchOutError: string | null;
}

const initialState: AttendanceState = {
  todayData: null,
  loading: false,
  error: null,
  statusData: null,
  statusLoading: false,
  statusError: null,
  historyData: null,
  historyLoading: false,
  historyError: null,
  summaryData: null,
  summaryLoading: false,
  summaryError: null,
  punchInLoading: false,
  punchInError: null,
  punchOutLoading: false,
  punchOutError: null,
};

export const fetchTodayAttendance = createAsyncThunk(
  'attendance/fetchTodayAttendance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/attendance/today');
      return response.data;
    } catch (error: any) {
      console.log('Attendance Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance');
    }
  }
);

export const fetchAttendanceStatus = createAsyncThunk(
  'attendance/fetchAttendanceStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/attendance/status');
      return response.data;
    } catch (error: any) {
      console.log('Attendance Status Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance status');
    }
  }
);

export const fetchAttendanceHistory = createAsyncThunk(
  'attendance/fetchAttendanceHistory',
  async (month: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/attendance/history?month=${month}`);
      return response.data;
    } catch (error: any) {
      console.log('Attendance History Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance history');
    }
  }
);

export const fetchAttendanceSummary = createAsyncThunk(
  'attendance/fetchAttendanceSummary',
  async (month: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/attendance/summary?month=${month}`);
      return response.data;
    } catch (error: any) {
      console.log('Attendance Summary Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance summary');
    }
  }
);

export const postPunchIn = createAsyncThunk(
  'attendance/postPunchIn',
  async (data: { lat: number; lng: number; selfie: string; timestamp: string; In_remarks?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/attendance/punch-in', data);
      return response.data;
    } catch (error: any) {
      console.log('Punch In Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to punch in');
    }
  }
);

export const postPunchOut = createAsyncThunk(
  'attendance/postPunchOut',
  async (data: { lat: number; lng: number; selfie: string; timestamp: string; out_remarks?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/attendance/punch-out', data);
      return response.data;
    } catch (error: any) {
      console.log('Punch Out Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to punch out');
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendance: (state) => {
      state.todayData = null;
      state.error = null;
      state.statusData = null;
      state.statusError = null;
      state.historyData = null;
      state.historyError = null;
      state.summaryData = null;
      state.summaryError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Today Attendance
      .addCase(fetchTodayAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodayAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.todayData = action.payload?.data || action.payload;
      })
      .addCase(fetchTodayAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Attendance Status
      .addCase(fetchAttendanceStatus.pending, (state) => {
        state.statusLoading = true;
        state.statusError = null;
      })
      .addCase(fetchAttendanceStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.statusData = action.payload?.data || action.payload;
      })
      .addCase(fetchAttendanceStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.statusError = action.payload as string;
      })
      // Attendance History
      .addCase(fetchAttendanceHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchAttendanceHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.historyData = action.payload?.data || action.payload;
      })
      .addCase(fetchAttendanceHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload as string;
      })
      // Attendance Summary
      .addCase(fetchAttendanceSummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchAttendanceSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summaryData = action.payload?.data || action.payload;
      })
      .addCase(fetchAttendanceSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError = action.payload as string;
      })
      // Punch In
      .addCase(postPunchIn.pending, (state) => {
        state.punchInLoading = true;
        state.punchInError = null;
      })
      .addCase(postPunchIn.fulfilled, (state) => {
        state.punchInLoading = false;
      })
      .addCase(postPunchIn.rejected, (state, action) => {
        state.punchInLoading = false;
        state.punchInError = action.payload as string;
      })
      // Punch Out
      .addCase(postPunchOut.pending, (state) => {
        state.punchOutLoading = true;
        state.punchOutError = null;
      })
      .addCase(postPunchOut.fulfilled, (state) => {
        state.punchOutLoading = false;
      })
      .addCase(postPunchOut.rejected, (state, action) => {
        state.punchOutLoading = false;
        state.punchOutError = action.payload as string;
      });
  },
});

export const { clearAttendance } = attendanceSlice.actions;
export default attendanceSlice.reducer;
