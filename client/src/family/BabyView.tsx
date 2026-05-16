import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBabySummary, createHealthLog } from './api';
import type { Profile } from '../api/profiles';

interface Props {
  profile: Profile;
}

function msAgo(ms: number | null): string {
  if (ms === null) return 'never';
  const diff = Date.now() - ms;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

export default function BabyView({ profile }: Props) {
  const qc = useQueryClient();
  const [sleepActive, setSleepActive] = useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['baby-summary', profile.id],
    queryFn: () => getBabySummary(profile.id),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const log = useMutation({
    mutationFn: (input: object) => createHealthLog(profile.id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['baby-summary', profile.id] });
    },
  });

  function logFeed(side: 'left' | 'right' | 'bottle') {
    log.mutate({ log_type: 'feed', side });
  }

  function logNappy(type: 'wet' | 'dirty' | 'both') {
    log.mutate({ log_type: 'nappy', type });
  }

  function toggleSleep() {
    if (sleepActive) {
      log.mutate({ log_type: 'sleep', start_ms: Date.now() - 3_600_000, end_ms: Date.now() });
      setSleepActive(false);
    } else {
      log.mutate({ log_type: 'sleep', start_ms: Date.now() });
      setSleepActive(true);
    }
  }

  if (isLoading) {
    return (
      <main className="baby-view">
        <div aria-live="polite">Loading…</div>
      </main>
    );
  }

  return (
    <main className="baby-view">
      <header className="baby-view__header">
        <div className="baby-view__avatar" style={{ background: profile.colour }}>
          <span className="baby-view__initials">{profile.name.slice(0, 2).toUpperCase()}</span>
        </div>
        <h1 className="baby-view__name">{profile.name}</h1>
      </header>

      <section className="baby-view__summary" aria-label="Today's summary">
        <div className="baby-view__stat">
          <span className="baby-view__stat-value">{summary?.todayFeedCount ?? 0}</span>
          <span className="baby-view__stat-label">feeds today</span>
        </div>
        <div className="baby-view__stat">
          <span className="baby-view__stat-value">{summary?.todayNappyCount ?? 0}</span>
          <span className="baby-view__stat-label">nappies today</span>
        </div>
        <div className="baby-view__stat">
          <span className="baby-view__stat-label">Last feed</span>
          <span className="baby-view__stat-value baby-view__stat-value--sm">
            {msAgo(summary?.lastFeedMs ?? null)}
          </span>
        </div>
      </section>

      <section className="baby-view__quick-log" aria-label="Quick log">
        <div className="baby-view__group">
          <h2 className="baby-view__group-title">Feed</h2>
          <div className="baby-view__btn-row">
            <button type="button" className="baby-view__btn" onClick={() => logFeed('left')}>
              Left
            </button>
            <button type="button" className="baby-view__btn" onClick={() => logFeed('right')}>
              Right
            </button>
            <button type="button" className="baby-view__btn" onClick={() => logFeed('bottle')}>
              Bottle
            </button>
          </div>
        </div>

        <div className="baby-view__group">
          <h2 className="baby-view__group-title">Nappy</h2>
          <div className="baby-view__btn-row">
            <button type="button" className="baby-view__btn" onClick={() => logNappy('wet')}>
              Wet
            </button>
            <button type="button" className="baby-view__btn" onClick={() => logNappy('dirty')}>
              Dirty
            </button>
            <button type="button" className="baby-view__btn" onClick={() => logNappy('both')}>
              Both
            </button>
          </div>
        </div>

        <div className="baby-view__group">
          <h2 className="baby-view__group-title">Sleep</h2>
          <button
            type="button"
            className={`baby-view__btn baby-view__btn--sleep${sleepActive ? ' baby-view__btn--active' : ''}`}
            onClick={toggleSleep}
          >
            {sleepActive ? 'Stop Sleep' : 'Start Sleep'}
          </button>
        </div>
      </section>

      <section className="baby-view__timeline" aria-label="Recent activity">
        <h2 className="baby-view__group-title">Recent</h2>
        {(summary?.recentEntries ?? []).length === 0 ? (
          <p className="baby-view__empty">Nothing logged yet today.</p>
        ) : (
          <ol className="baby-view__feed-list">
            {(summary?.recentEntries ?? []).map((entry) => (
              <li key={entry.id} className="baby-view__feed-item">
                <time
                  className="baby-view__feed-time"
                  dateTime={new Date(entry.logged_at).toISOString()}
                >
                  {new Date(entry.logged_at).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
                <span className="baby-view__feed-type">{entry.log_type}</span>
                {entry.log_type === 'feed' && Boolean(entry.data_json.side) && (
                  <span className="baby-view__feed-detail">{String(entry.data_json.side)}</span>
                )}
                {entry.log_type === 'nappy' && Boolean(entry.data_json.type) && (
                  <span className="baby-view__feed-detail">{String(entry.data_json.type)}</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
