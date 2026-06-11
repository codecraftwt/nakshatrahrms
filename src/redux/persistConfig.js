import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistReducer } from 'redux-persist';

export const getPersistedReducer = (key, reducer) =>
  persistReducer(
    {
      key,
      storage: AsyncStorage,
      whitelist: ['user', 'token', 'tokenType', 'isLoggedIn'],
    },
    reducer,
  );
