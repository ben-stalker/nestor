import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookings, createBooking, updateBooking } from './api';
import BookingList from './BookingList';
import BookingModal, { type BookingFormValues } from './BookingModal';
import FuelLog from './FuelLog';
import type { Vehicle, VehicleBooking } from './types';
import { useActiveProfile } from '../core/hooks/useActiveProfile';

const TYPE_ICON: Record<string, string> = {
  car: '🚗',
  van: '🚐',
  motorcycle: '🏍️',
  bicycle: '🚲',
  ev: '⚡',
};

function daysUntil(epochMs: number): number {
  return Math.ceil((epochMs - Date.now()) / 86_400_000);
}

function renewalColour(days: number): string {
  if (days <= 7) return 'text-red-600';
  if (days <= 30) return 'text-amber-600';
  return 'text-secondary';
}

function RenewalRow({ label, dueMs }: { label: string; dueMs: number | null }) {
  if (dueMs === null) return null;
  const days = daysUntil(dueMs);
  const colour = renewalColour(days);
  return (
    <div className="flex justify-between text-sm">
      <span className="text-secondary">{label}</span>
      <span className={`font-medium ${colour}`}>
        {new Date(dueMs).toLocaleDateString()}{' '}
        <span className="font-normal">({days < 0 ? 'overdue' : `${days}d`})</span>
      </span>
    </div>
  );
}

interface Props {
  vehicle: Vehicle;
  onBack: () => void;
  onEdit?: () => void;
}

export default function VehicleDetail({ vehicle, onBack, onEdit }: Props) {
  const qc = useQueryClient();
  const activeProfile = useActiveProfile();
  const isAdmin = activeProfile?.type === 'admin';
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<VehicleBooking | null>(null);

  const now = Date.now();
  const thirtyDaysMs = 30 * 86_400_000;

  const { data: bookings = [] } = useQuery({
    queryKey: ['vehicle-bookings', vehicle.id],
    queryFn: () => getBookings(vehicle.id, now, now + thirtyDaysMs),
    staleTime: 60_000,
  });

  function handleCloseModal() {
    setShowBookingModal(false);
    setEditingBooking(null);
  }

  const createMutation = useMutation({
    mutationFn: (values: BookingFormValues) => createBooking(vehicle.id, values),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vehicle-bookings', vehicle.id] });
      handleCloseModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ bookingId, values }: { bookingId: number; values: BookingFormValues }) =>
      updateBooking(vehicle.id, bookingId, values),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vehicle-bookings', vehicle.id] });
      handleCloseModal();
    },
  });

  const showMot = vehicle.type !== 'bicycle' && vehicle.type !== 'ev';

  function handleEditBooking(booking: VehicleBooking) {
    setEditingBooking(booking);
    setShowBookingModal(true);
  }

  function handleBookingSubmit(values: BookingFormValues) {
    if (editingBooking) {
      updateMutation.mutate({ bookingId: editingBooking.id, values });
    } else {
      createMutation.mutate(values);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-elev">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to vehicles"
          className="rounded-lg p-2 text-secondary hover:bg-surface-elev transition-colors"
        >
          ←
        </button>
        <h1 className="text-h2 font-semibold text-primary flex-1 truncate">{vehicle.nickname}</h1>
        {isAdmin && onEdit && (
          <button type="button" onClick={onEdit} className="text-sm text-accent hover:underline">
            Edit
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Hero card */}
        <div className="rounded-card bg-surface border border-surface-elev overflow-hidden">
          {vehicle.photo_path ? (
            <img
              src={`/api/v1/vehicles/${vehicle.id}/photo`}
              alt={vehicle.nickname}
              className="w-full h-40 object-cover"
            />
          ) : (
            <div className="w-full h-40 bg-surface-elev flex items-center justify-center text-6xl">
              <span aria-hidden="true">{TYPE_ICON[vehicle.type] ?? '🚗'}</span>
            </div>
          )}
          <div className="p-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-h2 font-semibold text-primary">{vehicle.nickname}</span>
              {vehicle.registration && (
                <span className="rounded bg-surface-elev px-1.5 py-0.5 text-xs font-mono text-secondary">
                  {vehicle.registration}
                </span>
              )}
            </div>
            {(vehicle.make || vehicle.model) && (
              <p className="text-body text-secondary">
                {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ')}
              </p>
            )}
          </div>
        </div>

        {/* Renewal dates */}
        {(vehicle.mot_due || vehicle.tax_due || vehicle.insurance_due || vehicle.service_due) && (
          <div className="rounded-card bg-surface border border-surface-elev p-4 space-y-2">
            <p className="text-sm font-medium text-secondary">Renewal dates</p>
            {showMot && <RenewalRow label="MOT" dueMs={vehicle.mot_due} />}
            <RenewalRow label="Tax" dueMs={vehicle.tax_due} />
            <RenewalRow label="Insurance" dueMs={vehicle.insurance_due} />
            <RenewalRow label="Service" dueMs={vehicle.service_due} />
          </div>
        )}

        {/* Bookings */}
        <div className="rounded-card bg-surface border border-surface-elev p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-secondary">Upcoming bookings (next 30 days)</p>
            <button
              type="button"
              onClick={() => {
                setEditingBooking(null);
                setShowBookingModal(true);
              }}
              className="rounded-button bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Book
            </button>
          </div>
          <BookingList
            vehicleId={vehicle.id}
            bookings={bookings}
            activeProfileId={activeProfile?.id ?? null}
            isAdmin={isAdmin}
            onEdit={handleEditBooking}
          />
        </div>

        {/* Fuel log */}
        <FuelLog vehicle={vehicle} />
      </div>

      {showBookingModal && (
        <BookingModal
          vehicleId={vehicle.id}
          booking={editingBooking}
          existingBookings={bookings}
          submitting={isSubmitting}
          onSubmit={handleBookingSubmit}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
