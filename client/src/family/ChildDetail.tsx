import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChores, getRewardGrid, getHealthLog } from './api';
import type { HealthLogType } from './types';
import HealthLog from './HealthLog';
import GrowthChart from './GrowthChart';
import VaccinationSchedule from './VaccinationSchedule';
import RoutinesPanel from './RoutinesPanel';
import MoodCheckin from './MoodCheckin';
import MoodTrend from './MoodTrend';

interface Props {
  profileId: number;
  profileName: string;
  profileType?: string;
  isAdmin?: boolean;
  onClose: () => void;
}

type Tab = 'chores' | 'health' | 'rewards' | 'growth' | 'vaccinations' | 'routines' | 'mood';

export default function ChildDetail({
  profileId,
  profileName,
  profileType,
  isAdmin = false,
  onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>('chores');
  const [healthFilter, setHealthFilter] = useState<HealthLogType | undefined>(undefined);

  const isBaby = profileType === 'baby';
  const isTeen = profileType === 'teen';
  const availableTabs: Tab[] = [
    'chores',
    'rewards',
    'health',
    ...(isBaby ? (['growth', 'vaccinations'] as Tab[]) : []),
    'routines',
    ...(isTeen ? (['mood'] as Tab[]) : []),
  ];

  const { data: chores = [] } = useQuery({
    queryKey: ['chores', profileId],
    queryFn: () => getChores(profileId),
    staleTime: 30_000,
  });

  const { data: grid } = useQuery({
    queryKey: ['rewards', 'grid', profileId],
    queryFn: () => getRewardGrid(profileId),
    staleTime: 30_000,
  });

  const { data: healthEntries = [] } = useQuery({
    queryKey: ['health-log', profileId, healthFilter],
    queryFn: () => getHealthLog(profileId, healthFilter),
    staleTime: 30_000,
  });

  return (
    <div className="child-detail" role="dialog" aria-label={`${profileName} details`}>
      <div className="child-detail__header">
        <h2 className="child-detail__title">{profileName}</h2>
        <button type="button" className="child-detail__close" onClick={onClose} aria-label="Close">
          &times;
        </button>
      </div>

      <div className="child-detail__tabs" role="tablist">
        {availableTabs.map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            className={`child-detail__tab${tab === t ? ' child-detail__tab--active' : ''}`}
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="child-detail__body">
        {tab === 'chores' && (
          <ul className="child-detail__chore-list">
            {chores.length === 0 && <li className="child-detail__empty">No chores assigned</li>}
            {chores.map((chore) => (
              <li key={chore.id} className="child-detail__chore-item">
                <span className="child-detail__chore-name">{chore.name}</span>
                <span className="child-detail__chore-points">{chore.points} pts</span>
              </li>
            ))}
          </ul>
        )}

        {tab === 'rewards' && grid && (
          <div className="child-detail__rewards">
            <p className="child-detail__balance">
              Balance: <strong>{grid.totalEarned}</strong> stars
            </p>
            <p className="child-detail__streak">
              Streak: <strong>{grid.streak}</strong> day{grid.streak !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {tab === 'health' && (
          <HealthLog
            profileId={profileId}
            entries={healthEntries}
            filter={healthFilter}
            onFilterChange={setHealthFilter}
            isAdmin={isAdmin}
          />
        )}

        {tab === 'growth' && <GrowthChart profileId={profileId} />}

        {tab === 'vaccinations' && <VaccinationSchedule profileId={profileId} isAdmin={isAdmin} />}

        {tab === 'routines' && <RoutinesPanel profileName={profileName} />}

        {tab === 'mood' && (
          <div className="child-detail__mood">
            <MoodCheckin profileId={profileId} />
            <MoodTrend profileId={profileId} />
          </div>
        )}
      </div>
    </div>
  );
}
