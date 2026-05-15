import type VehicleBookingRepository from '../repositories/VehicleBookingRepository';
import type { BookingInput, BookingUpdate, VehicleBooking } from '../types/vehicles';
import { ConflictError } from '../types/vehicles';

export { ConflictError };

export default class VehicleBookingService {
  constructor(private readonly bookingRepo: VehicleBookingRepository) {}

  create(vehicleId: number, input: BookingInput): Promise<VehicleBooking> {
    try {
      const conflicts = this.bookingRepo.findConflicts(
        vehicleId,
        input.start_datetime,
        input.end_datetime,
      );
      if (conflicts.length > 0) throw new ConflictError(conflicts);
      return Promise.resolve(this.bookingRepo.create(vehicleId, input));
    } catch (err) {
      return Promise.reject(err instanceof Error ? err : new Error(String(err)));
    }
  }

  update(vehicleId: number, bookingId: number, patch: BookingUpdate): Promise<VehicleBooking> {
    try {
      const existing = this.bookingRepo.get(bookingId);
      if (!existing) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });

      const start = patch.start_datetime ?? existing.start_datetime;
      const end = patch.end_datetime ?? existing.end_datetime;
      const conflicts = this.bookingRepo.findConflicts(vehicleId, start, end, bookingId);
      if (conflicts.length > 0) throw new ConflictError(conflicts);

      return Promise.resolve(this.bookingRepo.update(bookingId, patch)!);
    } catch (err) {
      return Promise.reject(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
