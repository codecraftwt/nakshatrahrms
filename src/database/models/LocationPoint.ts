import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class LocationPoint extends Model {
  static table = 'location_points';

  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('datetime') datetime!: string;
  @readonly @date('created_at') createdAt!: Date;
}
