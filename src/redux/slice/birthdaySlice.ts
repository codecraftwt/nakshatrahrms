import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

interface BirthdayState {
  upcomingBirthdaysData: any | null;
  upcomingBirthdaysLoading: boolean;
  upcomingBirthdaysError: string | null;
}

const initialState: BirthdayState = {
  upcomingBirthdaysData: null,
  upcomingBirthdaysLoading: false,
  upcomingBirthdaysError: null,
};

export const fetchUpcomingBirthdays = createAsyncThunk(
  'birthday/fetchUpcomingBirthdays',
  async ({ month }: { month?: number | string } = {}, { rejectWithValue }) => {
    try {
      const url = month 
        ? `/employee/upcoming-birthdays?month=${month}`
        : `/employee/upcoming-birthdays`;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      console.log('Upcoming Birthdays Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch upcoming birthdays');
    }
  }
);

const birthdaySlice = createSlice({
  name: 'birthday',
  initialState,
  reducers: {
    clearBirthdayData: (state) => {
      state.upcomingBirthdaysData = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUpcomingBirthdays.pending, (state) => {
        state.upcomingBirthdaysLoading = true;
        state.upcomingBirthdaysError = null;
      })
      .addCase(fetchUpcomingBirthdays.fulfilled, (state, action) => {
        state.upcomingBirthdaysLoading = false;
        state.upcomingBirthdaysData = action.payload?.data || action.payload;
      })
      .addCase(fetchUpcomingBirthdays.rejected, (state, action) => {
        state.upcomingBirthdaysLoading = false;
        state.upcomingBirthdaysError = action.payload as string;
      });
  }
});

export const { clearBirthdayData } = birthdaySlice.actions;
export default birthdaySlice.reducer;
