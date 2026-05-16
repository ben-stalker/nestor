import { FileText, Trash2, Calendar } from 'lucide-react';
import type { PetHealthLog } from '../types';
import { LOG_TYPE_LABELS, LOG_TYPE_COLOURS } from '../types';
import { Pill } from '../../shared/ui';

interface HealthLogEntryProps {
  log: PetHealthLog;
  petId: number;
  onDelete?: (logId: number) => void;
  onEdit?: (log: PetHealthLog) => void;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function nextDueLabel(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days}d`;
}

function NextDueChip({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  let cls = 'bg-emerald-100 text-emerald-700';
  if (days < 0) cls = 'bg-red-100 text-red-700';
  else if (days <= 7) cls = 'bg-amber-100 text-amber-700';
  return (
    <span
      className={`text-caption font-medium px-2 py-0.5 rounded-full ${cls}`}
      data-testid="next-due-chip"
    >
      {nextDueLabel(dateStr)}
    </span>
  );
}

export default function HealthLogEntry({ log, petId, onDelete, onEdit }: HealthLogEntryProps) {
  const colour = LOG_TYPE_COLOURS[log.log_type];
  const label = LOG_TYPE_LABELS[log.log_type];

  return (
    <div className="bg-surface rounded-card p-3 space-y-2" data-testid="health-log-entry">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Pill colour={colour}>{label}</Pill>
            {log.linked_calendar_event_id && (
              <span className="inline-flex items-center gap-1 text-caption text-accent">
                <Calendar size={12} />
                Added to calendar
              </span>
            )}
          </div>
          <p className="mt-1 text-body font-medium text-primary">{log.title}</p>
          {log.notes && <p className="text-caption text-secondary mt-0.5">{log.notes}</p>}
          <p className="text-caption text-secondary mt-1">{log.log_date}</p>
          {log.log_type === 'weight' && log.weight_kg != null && (
            <p className="text-caption font-medium text-accent">{log.weight_kg.toFixed(2)} kg</p>
          )}
          {log.log_type === 'document' && log.document_name && (
            <a
              href={`/api/v1/pets/${petId}/health-log/${log.id}/document`}
              className="inline-flex items-center gap-1 text-caption text-accent hover:underline mt-1"
              download={log.document_name}
            >
              <FileText size={12} />
              {log.document_name}
            </a>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(log)}
              className="text-secondary hover:text-primary text-caption px-1"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(log.id)}
              className="text-red-400 hover:text-red-600 p-1"
              aria-label="Delete entry"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      {log.next_due_date && (
        <div className="flex items-center gap-1.5">
          <NextDueChip dateStr={log.next_due_date} />
          <span className="text-caption text-secondary">{log.next_due_date}</span>
        </div>
      )}
    </div>
  );
}
