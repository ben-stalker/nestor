import apiFetch from '../api/client';
import type { Vehicle, VehicleBooking } from './types';

// ─── Vehicles ────────────────────────────────────────────────────────────────

export function getVehicles(): Promise<Vehicle[]> {
  return apiFetch<Vehicle[]>('/api/v1/vehicles');
}

export function getVehicle(id: number): Promise<Vehicle> {
  return apiFetch<Vehicle>(`/api/v1/vehicles/${id}`);
}

export function createVehicle(input: object): Promise<Vehicle> {
  return apiFetch<Vehicle>('/api/v1/vehicles', { method: 'POST', body: input });
}

export function updateVehicle(id: number, input: object): Promise<Vehicle> {
  return apiFetch<Vehicle>(`/api/v1/vehicles/${id}`, { method: 'PATCH', body: input });
}

export function deleteVehicle(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/vehicles/${id}`, { method: 'DELETE' });
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export function getBookings(
  vehicleId: number,
  from?: number,
  to?: number,
): Promise<VehicleBooking[]> {
  const params = new URLSearchParams();
  if (from !== undefined) params.set('from', String(from));
  if (to !== undefined) params.set('to', String(to));
  const qs = params.toString();
  return apiFetch<VehicleBooking[]>(`/api/v1/vehicles/${vehicleId}/bookings${qs ? `?${qs}` : ''}`);
}

export function createBooking(vehicleId: number, input: object): Promise<VehicleBooking> {
  return apiFetch<VehicleBooking>(`/api/v1/vehicles/${vehicleId}/bookings`, {
    method: 'POST',
    body: input,
  });
}

export function updateBooking(
  vehicleId: number,
  bookingId: number,
  input: object,
): Promise<VehicleBooking> {
  return apiFetch<VehicleBooking>(`/api/v1/vehicles/${vehicleId}/bookings/${bookingId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteBooking(vehicleId: number, bookingId: number): Promise<void> {
  return apiFetch<void>(`/api/v1/vehicles/${vehicleId}/bookings/${bookingId}`, {
    method: 'DELETE',
  });
}
