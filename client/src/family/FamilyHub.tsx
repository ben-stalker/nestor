import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFamilySummary } from './api';
import ChildCard from './ChildCard';
import ChildDetail from './ChildDetail';
import type { ChildSummary } from './types';

export const FAMILY_SUMMARY_KEY = ['family', 'summary'] as const;

export default function FamilyHub() {
  const [selected, setSelected] = useState<ChildSummary | null>(null);

  const { data: summaries = [], isLoading } = useQuery({
    queryKey: FAMILY_SUMMARY_KEY,
    queryFn: getFamilySummary,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <main className="family-hub">
        <div className="family-hub__loading" aria-live="polite">
          Loading family…
        </div>
      </main>
    );
  }

  if (summaries.length === 0) {
    return (
      <main className="family-hub">
        <div className="family-hub__empty">
          <p>No children yet.</p>
          <a href="/settings/profiles" className="family-hub__add-link">
            Add a profile
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="family-hub">
      <h1 className="family-hub__title">Family</h1>

      <div className="family-hub__grid">
        {summaries.map((summary) => (
          <ChildCard
            key={summary.profile.id}
            summary={summary}
            onClick={() => setSelected(summary)}
          />
        ))}
      </div>

      {selected && (
        <div className="family-hub__detail-overlay">
          <ChildDetail
            profileId={selected.profile.id}
            profileName={selected.profile.name}
            onClose={() => setSelected(null)}
          />
        </div>
      )}
    </main>
  );
}
