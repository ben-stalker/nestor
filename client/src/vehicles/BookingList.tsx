import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBooking } from './api';
import type { VehicleBooking } from './types';

interface Props {
  vehicleId: number;
  bookings: VehicleBooking[];
  activeProfileId: number | null;
  isAdmin: boolean;
  onEdit: (booking: VehicleBooking) => void;
}

function formatDatetime(epochMs: number): string {
  return new Date(epochMs).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function BookingList({
  vehicleId,
  bookings,
  activeProfileId,
  isAdmin,
  onEdit,
}: Props) {
  const qc = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (bookingId: number) => deleteBooking(vehicleId, bookingId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vehicle-bookings', vehicleId] });
    },
  });

  if (bookings.length === 0) {
    return <p className="text-body text-secondary py-4 text-center">No upcoming bookings</p>;
  }

  return (
    <ul className="space-y-2" aria-label="Upcoming bookings">
      {bookings.map((b) => {
        const canEdit = isAdmin || b.profile_id === activeProfileId;
        return (
          <li
            key={b.id}
            className="rounded-card border border-surface-elev bg-surface p-3 flex justify-between items-start"
          >
            <div>
              <p className="text-body font-medium text-primary">
                {formatDatetime(b.start_datetime)} → {formatDatetime(b.end_datetime)}
              </p>
              {b.notes && <p className="text-sm text-secondary mt-0.5">{b.notes}</p>}
            </div>
            {canEdit && (
              <div className="flex gap-1 ml-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit(b)}
                  className="rounded border border-surface-elev px-2 py-1 text-xs text-secondary hover:text-primary transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(b.id)}
                  disabled={deleteMutation.isPending}
                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
