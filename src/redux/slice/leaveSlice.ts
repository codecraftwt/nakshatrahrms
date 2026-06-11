import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

interface LeaveState {
  balanceData: any | null;
  balanceLoading: boolean;
  balanceError: string | null;
  typesData: any | null;
  typesLoading: boolean;
  typesError: string | null;
  applyLoading: boolean;
  applyError: string | null;
  applySuccess: boolean;
  requestsData: any | null;
  requestsLoading: boolean;
  requestsError: string | null;
  leaveDetailData: any | null;
  leaveDetailLoading: boolean;
  leaveDetailError: string | null;
  cancelLoading: boolean;
  cancelError: string | null;
  cancelSuccess: boolean;
}

const initialState: LeaveState = {
  balanceData: null,
  balanceLoading: false,
  balanceError: null,
  typesData: null,
  typesLoading: false,
  typesError: null,
  applyLoading: false,
  applyError: null,
  applySuccess: false,
  requestsData: null,
  requestsLoading: false,
  requestsError: null,
  leaveDetailData: null,
  leaveDetailLoading: false,
  leaveDetailError: null,
  cancelLoading: false,
  cancelError: null,
  cancelSuccess: false,
};

export const fetchLeaveBalances = createAsyncThunk(
  'leave/fetchLeaveBalances',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/leave/balance');
      return response.data;
    } catch (error: any) {
      console.log('Leave Balance Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave balances');
    }
  }
);

export const fetchLeaveTypes = createAsyncThunk(
  'leave/fetchLeaveTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/leave/types');
      return response.data;
    } catch (error: any) {
      console.log('Leave Types Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave types');
    }
  }
);

export const applyLeave = createAsyncThunk(
  'leave/applyLeave',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/leave/apply', payload);
      return response.data;
    } catch (error: any) {
      console.log('Apply Leave Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to apply leave');
    }
  }
);

export const fetchLeaveRequests = createAsyncThunk(
  'leave/fetchLeaveRequests',
  async ({ status = 'all', page = 1, limit = 20 }: { status?: string, page?: number, limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/leave/requests?status=${status}&page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.log('Leave Requests Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave requests');
    }
  }
);

export const fetchLeaveDetail = createAsyncThunk(
  'leave/fetchLeaveDetail',
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/leave/requests/${id}`);
      return response.data;
    } catch (error: any) {
      console.log('Leave Detail Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave details');
    }
  }
);

export const cancelLeave = createAsyncThunk(
  'leave/cancelLeave',
  async ({ id, reason }: { id: string | number, reason: string }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/leave/requests/${id}`, { data: { reason } });
      return response.data;
    } catch (error: any) {
      console.log('Cancel Leave Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel leave');
    }
  }
);

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {
    clearLeave: (state) => {
      state.balanceData = null;
      state.balanceError = null;
      state.typesData = null;
      state.typesError = null;
      state.requestsData = null;
      state.requestsError = null;
      state.leaveDetailData = null;
      state.leaveDetailError = null;
    },
    resetApplySuccess: (state) => {
      state.applySuccess = false;
      state.applyError = null;
    },
    resetCancelSuccess: (state) => {
      state.cancelSuccess = false;
      state.cancelError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Leave Balances
      .addCase(fetchLeaveBalances.pending, (state) => {
        state.balanceLoading = true;
        state.balanceError = null;
      })
      .addCase(fetchLeaveBalances.fulfilled, (state, action) => {
        state.balanceLoading = false;
        state.balanceData = action.payload?.data || action.payload;
      })
      .addCase(fetchLeaveBalances.rejected, (state, action) => {
        state.balanceLoading = false;
        state.balanceError = action.payload as string;
      })
      // Leave Types
      .addCase(fetchLeaveTypes.pending, (state) => {
        state.typesLoading = true;
        state.typesError = null;
      })
      .addCase(fetchLeaveTypes.fulfilled, (state, action) => {
        state.typesLoading = false;
        state.typesData = action.payload?.data || action.payload;
      })
      .addCase(fetchLeaveTypes.rejected, (state, action) => {
        state.typesLoading = false;
        state.typesError = action.payload as string;
      })
      // Apply Leave
      .addCase(applyLeave.pending, (state) => {
        state.applyLoading = true;
        state.applyError = null;
        state.applySuccess = false;
      })
      .addCase(applyLeave.fulfilled, (state, action) => {
        state.applyLoading = false;
        state.applySuccess = true;
      })
      .addCase(applyLeave.rejected, (state, action) => {
        state.applyLoading = false;
        state.applyError = action.payload as string;
      })
      // Leave Requests
      .addCase(fetchLeaveRequests.pending, (state) => {
        state.requestsLoading = true;
        state.requestsError = null;
      })
      .addCase(fetchLeaveRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        state.requestsData = action.payload?.data || action.payload;
      })
      .addCase(fetchLeaveRequests.rejected, (state, action) => {
        state.requestsLoading = false;
        state.requestsError = action.payload as string;
      })
      // Leave Detail
      .addCase(fetchLeaveDetail.pending, (state) => {
        state.leaveDetailLoading = true;
        state.leaveDetailError = null;
      })
      .addCase(fetchLeaveDetail.fulfilled, (state, action) => {
        state.leaveDetailLoading = false;
        state.leaveDetailData = action.payload?.data || action.payload;
      })
      .addCase(fetchLeaveDetail.rejected, (state, action) => {
        state.leaveDetailLoading = false;
        state.leaveDetailError = action.payload as string;
      })
      // Cancel Leave
      .addCase(cancelLeave.pending, (state) => {
        state.cancelLoading = true;
        state.cancelError = null;
        state.cancelSuccess = false;
      })
      .addCase(cancelLeave.fulfilled, (state, action) => {
        state.cancelLoading = false;
        state.cancelSuccess = true;
      })
      .addCase(cancelLeave.rejected, (state, action) => {
        state.cancelLoading = false;
        state.cancelError = action.payload as string;
      });
  },
});

export const { clearLeave, resetApplySuccess, resetCancelSuccess } = leaveSlice.actions;
export default leaveSlice.reducer;
