import type { PetHealthLog, PetLogType } from '../types';
import { LOG_TYPE_LABELS, PET_LOG_TYPES } from '../types';
import HealthLogEntry from './HealthLogEntry';

interface HealthLogListProps {
  logs: PetHealthLog[];
  petId: number;
  onDelete?: (logId: number) => void;
  onEdit?: (log: PetHealthLog) => void;
}

export default function HealthLogList({ logs, petId, onDelete, onEdit }: HealthLogListProps) {
  if (logs.length === 0) {
    return <p className="text-secondary text-body p-4 text-center">No health log entries yet.</p>;
  }

  // Group by log_type
  const grouped = new Map<PetLogType, PetHealthLog[]>();
  logs.forEach((log) => {
    const existing = grouped.get(log.log_type) ?? [];
    grouped.set(log.log_type, [...existing, log]);
  });

  return (
    <div className="space-y-6 p-4">
      {PET_LOG_TYPES.filter((t) => grouped.has(t)).map((type) => (
        <div key={type}>
          <h3 className="text-caption font-semibold text-secondary uppercase tracking-wider mb-2">
            {LOG_TYPE_LABELS[type]}
          </h3>
          <div className="space-y-2">
            {grouped.get(type)!.map((log) => (
              <HealthLogEntry
                key={log.id}
                log={log}
                petId={petId}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
