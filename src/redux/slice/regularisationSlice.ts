import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

interface RegularisationState {
  createRegularizationLoading: boolean;
  createRegularizationError: string | null;
}

const initialState: RegularisationState = {
  createRegularizationLoading: false,
  createRegularizationError: null,
};

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

const regularisationSlice = createSlice({
  name: 'regularisation',
  initialState,
  reducers: {
    clearRegularisationError: (state) => {
      state.createRegularizationError = null;
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
      });
  },
});

export const { clearRegularisationError } = regularisationSlice.actions;
export default regularisationSlice.reducer;
