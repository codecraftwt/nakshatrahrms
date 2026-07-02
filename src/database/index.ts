import { Platform } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema';
import LocationPoint from './models/LocationPoint';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'hrms_tracking_db',
  jsi: Platform.OS === 'ios',
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [LocationPoint],
});

export { LocationPoint };
