import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';
import { getPersistedReducer } from './persistConfig';
import authReducer from './slice/authSlice';
import dashboardReducer from './slice/dashboardSlice';
import profileReducer from './slice/profileSlice';
import shiftReducer from './slice/shiftSlice';
import attendanceReducer from './slice/attendanceSlice';
import leaveReducer from './slice/leaveSlice';
import payrollReducer from './slice/payrollSlice';
import trackingReducer from './slice/trackingSlice';


const rootReducer = combineReducers({
  auth: getPersistedReducer('auth', authReducer),
  dashboard: dashboardReducer,
  profile: profileReducer,
  shift: shiftReducer,
  attendance: attendanceReducer,
  leave: leaveReducer,
  payroll: payrollReducer,
  tracking: trackingReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

