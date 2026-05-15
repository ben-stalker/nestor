import { useState } from 'react';
import { exportHealthLogPdf } from './api';
import type { HealthLog as HealthLogEntry, HealthLogType } from './types';
import HealthLogAddModal from './HealthLogAddModal';

interface Props {
  profileId: number;
  entries: HealthLogEntry[];
  filter?: HealthLogType;
  onFilterChange: (t: HealthLogType | undefined) => void;
  isAdmin?: boolean;
}

const LOG_TYPE_LABELS: Record<HealthLogType, string> = {
  medicine: 'Medicine',
  temperature: 'Temperature',
  symptom: 'Symptom',
  vaccination: 'Vaccination',
  growth: 'Growth',
  feed: 'Feed',
  nappy: 'Nappy',
  sleep: 'Sleep',
  mood: 'Mood',
  weight: 'Weight',
};

const FILTER_TYPES: HealthLogType[] = ['medicine', 'temperature', 'symptom', 'vaccination'];

function formatEntry(entry: HealthLogEntry): string {
  const d = entry.data_json;
  switch (entry.log_type) {
    case 'medicine':
      return `${String(d.name ?? '')}${d.dose ? ` — ${String(d.dose)}` : ''}${d.reason ? ` (${String(d.reason)})` : ''}`;
    case 'temperature':
      return `${String(d.value ?? '')}°${String(d.unit ?? 'C').toUpperCase()}`;
    case 'symptom':
      return String(d.text ?? '');
    case 'vaccination':
      return `${String(d.name ?? '')}${d.lot_number ? ` — lot ${String(d.lot_number)}` : ''}`;
    default:
      return JSON.stringify(d);
  }
}

export default function HealthLog({
  profileId,
  entries,
  filter,
  onFilterChange,
  isAdmin = false,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="health-log">
      <div className="health-log__toolbar">
        <div className="health-log__filters" role="group" aria-label="Filter by type">
          <button
            type="button"
            className={`health-log__filter-chip${!filter ? ' health-log__filter-chip--active' : ''}`}
            onClick={() => onFilterChange(undefined)}
          >
            All
          </button>
          {FILTER_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`health-log__filter-chip${filter === t ? ' health-log__filter-chip--active' : ''}`}
              onClick={() => onFilterChange(t)}
            >
              {LOG_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="health-log__actions">
          <button type="button" className="health-log__add-btn" onClick={() => setShowAdd(true)}>
            Add entry
          </button>
          {isAdmin && (
            <a
              href={exportHealthLogPdf(profileId)}
              className="health-log__export-btn"
              target="_blank"
              rel="noreferrer"
            >
              Export PDF
            </a>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="health-log__empty">
          No entries{filter ? ` for ${LOG_TYPE_LABELS[filter]}` : ''}.
        </p>
      ) : (
        <ol className="health-log__timeline" reversed>
          {entries.map((entry) => (
            <li key={entry.id} className="health-log__entry">
              <time
                className="health-log__entry-time"
                dateTime={new Date(entry.logged_at).toISOString()}
              >
                {new Date(entry.logged_at).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
              <div className="health-log__entry-body">
                <span className="health-log__entry-type">
                  {LOG_TYPE_LABELS[entry.log_type] ?? entry.log_type}
                </span>
                <span className="health-log__entry-detail">{formatEntry(entry)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}

      {showAdd && <HealthLogAddModal profileId={profileId} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
