import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

interface PayrollState {
  syncData: any | null;
  syncLoading: boolean;
  syncError: string | null;
  syncSuccess: boolean;
  syncLeaveData: any | null;
  syncLeaveLoading: boolean;
  syncLeaveError: string | null;
  syncLeaveSuccess: boolean;
  shiftDetailsData: any | null;
  shiftDetailsLoading: boolean;
  shiftDetailsError: string | null;
}

const initialState: PayrollState = {
  syncData: null,
  syncLoading: false,
  syncError: null,
  syncSuccess: false,
  syncLeaveData: null,
  syncLeaveLoading: false,
  syncLeaveError: null,
  syncLeaveSuccess: false,
  shiftDetailsData: null,
  shiftDetailsLoading: false,
  shiftDetailsError: null,
};

export const syncAttendance = createAsyncThunk(
  'payroll/syncAttendance',
  async (payload: any = {}, { rejectWithValue }) => {
    try {
      const response = await api.post('/payroll/sync/attendance', payload);
      return response.data;
    } catch (error: any) {
      console.log('Payroll Sync Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to sync attendance to payroll');
    }
  }
);

export const syncLeave = createAsyncThunk(
  'payroll/syncLeave',
  async (payload: { leave_id: number | string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/payroll/sync/leave', payload);
      return response.data;
    } catch (error: any) {
      console.log('Leave Sync Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to sync leave to payroll');
    }
  }
);

export const fetchPayrollShiftDetails = createAsyncThunk(
  'payroll/fetchPayrollShiftDetails',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payroll/shift-details');
      return response.data;
    } catch (error: any) {
      console.log('Payroll Shift Details Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payroll shift details');
    }
  }
);

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    clearPayroll: (state) => {
      state.syncData = null;
      state.syncError = null;
      state.syncSuccess = false;
      state.syncLeaveData = null;
      state.syncLeaveError = null;
      state.syncLeaveSuccess = false;
      state.shiftDetailsData = null;
      state.shiftDetailsError = null;
    },
    resetSyncSuccess: (state) => {
      state.syncSuccess = false;
      state.syncError = null;
    },
    resetSyncLeaveSuccess: (state) => {
      state.syncLeaveSuccess = false;
      state.syncLeaveError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncAttendance.pending, (state) => {
        state.syncLoading = true;
        state.syncError = null;
        state.syncSuccess = false;
      })
      .addCase(syncAttendance.fulfilled, (state, action) => {
        state.syncLoading = false;
        state.syncSuccess = true;
        state.syncData = action.payload?.data || action.payload;
      })
      .addCase(syncAttendance.rejected, (state, action) => {
        state.syncLoading = false;
        state.syncError = action.payload as string;
      })
      .addCase(syncLeave.pending, (state) => {
        state.syncLeaveLoading = true;
        state.syncLeaveError = null;
        state.syncLeaveSuccess = false;
      })
      .addCase(syncLeave.fulfilled, (state, action) => {
        state.syncLeaveLoading = false;
        state.syncLeaveSuccess = true;
        state.syncLeaveData = action.payload?.data || action.payload;
      })
      .addCase(syncLeave.rejected, (state, action) => {
        state.syncLeaveLoading = false;
        state.syncLeaveError = action.payload as string;
      })
      .addCase(fetchPayrollShiftDetails.pending, (state) => {
        state.shiftDetailsLoading = true;
        state.shiftDetailsError = null;
      })
      .addCase(fetchPayrollShiftDetails.fulfilled, (state, action) => {
        state.shiftDetailsLoading = false;
        state.shiftDetailsData = action.payload?.data || action.payload;
      })
      .addCase(fetchPayrollShiftDetails.rejected, (state, action) => {
        state.shiftDetailsLoading = false;
        state.shiftDetailsError = action.payload as string;
      });
  },
});

export const { clearPayroll, resetSyncSuccess, resetSyncLeaveSuccess } = payrollSlice.actions;
export default payrollSlice.reducer;
