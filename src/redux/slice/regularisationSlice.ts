import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

interface RegularisationState {
  createRegularizationLoading: boolean;
  createRegularizationError: string | null;
  approvalsData: any | null;
  approvalsLoading: boolean;
  approvalsError: string | null;
  actionLoading: boolean;
  actionError: string | null;
  myData: any | null;
  myLoading: boolean;
  myError: string | null;
}

const initialState: RegularisationState = {
  createRegularizationLoading: false,
  createRegularizationError: null,
  approvalsData: null,
  approvalsLoading: false,
  approvalsError: null,
  actionLoading: false,
  actionError: null,
  myData: null,
  myLoading: false,
  myError: null,
};

export const fetchMyRegularisations = createAsyncThunk(
  'regularisation/fetchMyRegularisations',
  async (params: { state?: string; page?: number; limit?: number } | void, { rejectWithValue }) => {
    try {
      const response = await api.get('/attendance/regularizations', { params });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my regularisations');
    }
  }
);

export const createRegularization = createAsyncThunk(
  'regularisation/createRegularization',
  async (data: { from: string; to: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/attendance/regularizations', data);
      return response.data;
    } catch (error: any) {
      console.log('Regularization Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to submit regularization');
    }
  }
);

export const fetchRegularisationApprovals = createAsyncThunk(
  'regularisation/fetchRegularisationApprovals',
  async (params: { state?: string; page?: number; limit?: number } | void, { rejectWithValue }) => {
    try {
      const response = await api.get('/attendance/regularizations/approvals', { params });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch regularisation approvals');
    }
  }
);

export const approveRegularisation = createAsyncThunk(
  'regularisation/approveRegularisation',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.post(`/attendance/regularizations/${id}/approve`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve regularisation');
    }
  }
);

export const rejectRegularisation = createAsyncThunk(
  'regularisation/rejectRegularisation',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.post(`/attendance/regularizations/${id}/reject`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject regularisation');
    }
  }
);

const regularisationSlice = createSlice({
  name: 'regularisation',
  initialState,
  reducers: {
    clearRegularisationError: (state) => {
      state.createRegularizationError = null;
      state.approvalsError = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRegularization.pending, (state) => {
        state.createRegularizationLoading = true;
        state.createRegularizationError = null;
      })
      .addCase(createRegularization.fulfilled, (state) => {
        state.createRegularizationLoading = false;
      })
      .addCase(createRegularization.rejected, (state, action) => {
        state.createRegularizationLoading = false;
        state.createRegularizationError = action.payload as string;
      })
      .addCase(fetchRegularisationApprovals.pending, (state) => {
        state.approvalsLoading = true;
        state.approvalsError = null;
      })
      .addCase(fetchRegularisationApprovals.fulfilled, (state, action) => {
        state.approvalsLoading = false;
        state.approvalsData = action.payload;
      })
      .addCase(fetchRegularisationApprovals.rejected, (state, action) => {
        state.approvalsLoading = false;
        state.approvalsError = action.payload as string;
      })
      .addCase(approveRegularisation.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(approveRegularisation.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(approveRegularisation.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      })
      .addCase(rejectRegularisation.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(rejectRegularisation.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(rejectRegularisation.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      })
      .addCase(fetchMyRegularisations.pending, (state) => {
        state.myLoading = true;
        state.myError = null;
      })
      .addCase(fetchMyRegularisations.fulfilled, (state, action) => {
        state.myLoading = false;
        state.myData = action.payload;
      })
      .addCase(fetchMyRegularisations.rejected, (state, action) => {
        state.myLoading = false;
        state.myError = action.payload as string;
      });
  },
});

export const { clearRegularisationError } = regularisationSlice.actions;
export default regularisationSlice.reducer;
