import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

interface HolidayState {
  publicHolidaysData: any | null;
  publicHolidaysLoading: boolean;
  publicHolidaysError: string | null;
}

const initialState: HolidayState = {
  publicHolidaysData: null,
  publicHolidaysLoading: false,
  publicHolidaysError: null,
};

export const fetchPublicHolidays = createAsyncThunk(
  'holiday/fetchPublicHolidays',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/public-holidays');
      return response.data;
    } catch (error: any) {
      console.log('Public Holidays Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch public holidays');
    }
  }
);

const holidaySlice = createSlice({
  name: 'holiday',
  initialState,
  reducers: {
    clearHolidayData: (state) => {
      state.publicHolidaysData = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicHolidays.pending, (state) => {
        state.publicHolidaysLoading = true;
        state.publicHolidaysError = null;
      })
      .addCase(fetchPublicHolidays.fulfilled, (state, action) => {
        state.publicHolidaysLoading = false;
        state.publicHolidaysData = action.payload?.data || action.payload;
      })
      .addCase(fetchPublicHolidays.rejected, (state, action) => {
        state.publicHolidaysLoading = false;
        state.publicHolidaysError = action.payload as string;
      });
  }
});

export const { clearHolidayData } = holidaySlice.actions;
export default holidaySlice.reducer;
