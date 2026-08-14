import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

interface ExpenseState {
  requestsData: any | null;
  requestsLoading: boolean;
  requestsError: string | null;
  
  approvalsData: any | null;
  approvalsLoading: boolean;
  approvalsError: string | null;
  
  expenseDetailData: any | null;
  expenseDetailLoading: boolean;
  expenseDetailError: string | null;
  
  productsData: any | null;
  productsLoading: boolean;
  productsError: string | null;
  
  taxesData: any | null;
  taxesLoading: boolean;
  taxesError: string | null;
  
  vendorsData: any | null;
  vendorsLoading: boolean;
  vendorsError: string | null;
  
  createLoading: boolean;
  createError: string | null;
  createSuccess: boolean;
  createdExpenseId: number | null;
  
  attachmentLoading: boolean;
  attachmentError: string | null;
  attachmentSuccess: boolean;
  
  submitLoading: boolean;
  submitError: string | null;
  submitSuccess: boolean;
}

const initialState: ExpenseState = {
  requestsData: null,
  requestsLoading: false,
  requestsError: null,
  
  approvalsData: null,
  approvalsLoading: false,
  approvalsError: null,
  
  expenseDetailData: null,
  expenseDetailLoading: false,
  expenseDetailError: null,
  
  productsData: null,
  productsLoading: false,
  productsError: null,
  
  taxesData: null,
  taxesLoading: false,
  taxesError: null,
  
  vendorsData: null,
  vendorsLoading: false,
  vendorsError: null,
  
  createLoading: false,
  createError: null,
  createSuccess: false,
  createdExpenseId: null,
  
  attachmentLoading: false,
  attachmentError: null,
  attachmentSuccess: false,
  
  submitLoading: false,
  submitError: null,
  submitSuccess: false,
};

export const fetchExpenseRequests = createAsyncThunk(
  'expense/fetchExpenseRequests',
  async ({ status = 'all', page = 1, limit = 20 }: { status?: string, page?: number, limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/expense/requests?status=${status}&page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.log('Expense Requests Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expense requests');
    }
  }
);

export const fetchExpenseApprovals = createAsyncThunk(
  'expense/fetchExpenseApprovals',
  async ({ page = 1, limit = 20 }: { page?: number, limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/expense/approvals?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.log('Expense Approvals Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expense approvals');
    }
  }
);

export const fetchExpenseDetail = createAsyncThunk(
  'expense/fetchExpenseDetail',
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/expense/requests/${id}`);
      return response.data;
    } catch (error: any) {
      console.log('Expense Detail Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expense details');
    }
  }
);

export const fetchExpenseProducts = createAsyncThunk(
  'expense/fetchExpenseProducts',
  async ({ page = 1, limit = 20 }: { page?: number, limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/expense/products?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.log('Expense Products Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expense products');
    }
  }
);

export const fetchExpenseTaxes = createAsyncThunk(
  'expense/fetchExpenseTaxes',
  async ({ page = 1, limit = 20 }: { page?: number, limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/expense/taxes?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.log('Expense Taxes Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expense taxes');
    }
  }
);

export const fetchExpenseVendors = createAsyncThunk(
  'expense/fetchExpenseVendors',
  async ({ page = 1, limit = 20 }: { page?: number, limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/expense/vendors?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.log('Expense Vendors Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expense vendors');
    }
  }
);

export const createExpenseRequest = createAsyncThunk(
  'expense/createExpenseRequest',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/expense/requests', payload);
      return response.data;
    } catch (error: any) {
      console.log('Create Expense Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to create expense request');
    }
  }
);

export const uploadExpenseAttachment = createAsyncThunk(
  'expense/uploadExpenseAttachment',
  async ({ id, payload }: { id: string | number, payload: { attachment: string, filename: string, mimetype: string } }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/expense/requests/${id}/attachments`, payload);
      return response.data;
    } catch (error: any) {
      console.log('Upload Attachment Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to upload attachment');
    }
  }
);

export const submitExpenseRequest = createAsyncThunk(
  'expense/submitExpenseRequest',
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await api.post(`/expense/requests/${id}/submit`);
      return response.data;
    } catch (error: any) {
      console.log('Submit Expense Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to submit expense request');
    }
  }
);

export const approveExpenseRequest = createAsyncThunk(
  'expense/approveExpenseRequest',
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await api.post(`/expense/approvals/${id}/approve`);
      return response.data;
    } catch (error: any) {
      console.log('Approve Expense Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to approve expense request');
    }
  }
);

export const refuseExpenseRequest = createAsyncThunk(
  'expense/refuseExpenseRequest',
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await api.post(`/expense/approvals/${id}/refuse`);
      return response.data;
    } catch (error: any) {
      console.log('Refuse Expense Error:', error?.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to refuse expense request');
    }
  }
);

const expenseSlice = createSlice({
  name: 'expense',
  initialState,
  reducers: {
    clearExpenseData: (state) => {
      state.requestsData = null;
      state.expenseDetailData = null;
    },
    resetCreateSuccess: (state) => {
      state.createSuccess = false;
      state.createError = null;
      state.createdExpenseId = null;
      state.attachmentSuccess = false;
      state.attachmentError = null;
      state.submitSuccess = false;
      state.submitError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Requests
      .addCase(fetchExpenseRequests.pending, (state) => {
        state.requestsLoading = true;
        state.requestsError = null;
      })
      .addCase(fetchExpenseRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        state.requestsData = action.payload?.data || action.payload;
      })
      .addCase(fetchExpenseRequests.rejected, (state, action) => {
        state.requestsLoading = false;
        state.requestsError = action.payload as string;
      })
      // Fetch Approvals
      .addCase(fetchExpenseApprovals.pending, (state) => {
        state.approvalsLoading = true;
        state.approvalsError = null;
      })
      .addCase(fetchExpenseApprovals.fulfilled, (state, action) => {
        state.approvalsLoading = false;
        state.approvalsData = action.payload?.data || action.payload;
      })
      .addCase(fetchExpenseApprovals.rejected, (state, action) => {
        state.approvalsLoading = false;
        state.approvalsError = action.payload as string;
      })
      // Fetch Detail
      .addCase(fetchExpenseDetail.pending, (state) => {
        state.expenseDetailLoading = true;
        state.expenseDetailError = null;
      })
      .addCase(fetchExpenseDetail.fulfilled, (state, action) => {
        state.expenseDetailLoading = false;
        state.expenseDetailData = action.payload?.data || action.payload;
      })
      .addCase(fetchExpenseDetail.rejected, (state, action) => {
        state.expenseDetailLoading = false;
        state.expenseDetailError = action.payload as string;
      })
      // Fetch Products
      .addCase(fetchExpenseProducts.pending, (state) => {
        state.productsLoading = true;
        state.productsError = null;
      })
      .addCase(fetchExpenseProducts.fulfilled, (state, action) => {
        state.productsLoading = false;
        state.productsData = action.payload?.data || action.payload;
      })
      .addCase(fetchExpenseProducts.rejected, (state, action) => {
        state.productsLoading = false;
        state.productsError = action.payload as string;
      })
      // Fetch Taxes
      .addCase(fetchExpenseTaxes.pending, (state) => {
        state.taxesLoading = true;
        state.taxesError = null;
      })
      .addCase(fetchExpenseTaxes.fulfilled, (state, action) => {
        state.taxesLoading = false;
        state.taxesData = action.payload?.data || action.payload;
      })
      .addCase(fetchExpenseTaxes.rejected, (state, action) => {
        state.taxesLoading = false;
        state.taxesError = action.payload as string;
      })
      // Fetch Vendors
      .addCase(fetchExpenseVendors.pending, (state) => {
        state.vendorsLoading = true;
        state.vendorsError = null;
      })
      .addCase(fetchExpenseVendors.fulfilled, (state, action) => {
        state.vendorsLoading = false;
        state.vendorsData = action.payload?.data || action.payload;
      })
      .addCase(fetchExpenseVendors.rejected, (state, action) => {
        state.vendorsLoading = false;
        state.vendorsError = action.payload as string;
      })
      // Create Expense
      .addCase(createExpenseRequest.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
        state.createSuccess = false;
        state.createdExpenseId = null;
      })
      .addCase(createExpenseRequest.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createSuccess = true;
        state.createdExpenseId = action.payload?.data?.id || action.payload?.id;
      })
      .addCase(createExpenseRequest.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload as string;
      })
      // Upload Attachment
      .addCase(uploadExpenseAttachment.pending, (state) => {
        state.attachmentLoading = true;
        state.attachmentError = null;
        state.attachmentSuccess = false;
      })
      .addCase(uploadExpenseAttachment.fulfilled, (state) => {
        state.attachmentLoading = false;
        state.attachmentSuccess = true;
      })
      .addCase(uploadExpenseAttachment.rejected, (state, action) => {
        state.attachmentLoading = false;
        state.attachmentError = action.payload as string;
      })
      // Submit Expense
      .addCase(submitExpenseRequest.pending, (state) => {
        state.submitLoading = true;
        state.submitError = null;
        state.submitSuccess = false;
      })
      .addCase(submitExpenseRequest.fulfilled, (state) => {
        state.submitLoading = false;
        state.submitSuccess = true;
      })
      .addCase(submitExpenseRequest.rejected, (state, action) => {
        state.submitLoading = false;
        state.submitError = action.payload as string;
      })
      // Approve Expense
      .addCase(approveExpenseRequest.fulfilled, (state, action) => {
        // Optimistically remove or update the approved item from the requests list
        if (state.requestsData?.records) {
          state.requestsData.records = state.requestsData.records.filter(
            (item: any) => item.id !== action.meta.arg
          );
        }
        if (state.approvalsData?.records) {
          state.approvalsData.records = state.approvalsData.records.filter(
            (item: any) => item.id !== action.meta.arg
          );
        }
      })
      // Refuse Expense
      .addCase(refuseExpenseRequest.fulfilled, (state, action) => {
        // Optimistically remove or update the refused item from the requests list
        if (state.requestsData?.records) {
          state.requestsData.records = state.requestsData.records.filter(
            (item: any) => item.id !== action.meta.arg
          );
        }
        if (state.approvalsData?.records) {
          state.approvalsData.records = state.approvalsData.records.filter(
            (item: any) => item.id !== action.meta.arg
          );
        }
      });
  }
});

export const { clearExpenseData, resetCreateSuccess } = expenseSlice.actions;
export default expenseSlice.reducer;
