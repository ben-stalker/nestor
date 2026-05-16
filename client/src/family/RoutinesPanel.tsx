import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getChecklists, getChecklist, updateChecklistItem } from '../house/api';
import type { Checklist } from '../house/types';

interface Props {
  profileName: string;
}

function RoutineChecklist({ checklist }: { checklist: Checklist }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['checklist', checklist.id],
    queryFn: () => getChecklist(checklist.id),
    staleTime: 30_000,
  });

  const tick = useMutation({
    mutationFn: ({ itemId, ticked }: { itemId: number; ticked: boolean }) =>
      updateChecklistItem(checklist.id, itemId, { ticked }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['checklist', checklist.id] });
    },
  });

  if (!data) return null;

  const total = data.items.length;
  const done = data.items.filter((i) => i.ticked).length;

  return (
    <div className="routine-checklist">
      <div className="routine-checklist__header">
        <h3 className="routine-checklist__title">{checklist.name}</h3>
        <span className="routine-checklist__progress">
          {done}/{total}
        </span>
      </div>
      <ul className="routine-checklist__list">
        {data.items.map((item) => (
          <li key={item.id} className="routine-checklist__item">
            <button
              type="button"
              role="checkbox"
              aria-checked={item.ticked}
              className={`routine-checklist__step${item.ticked ? ' routine-checklist__step--done' : ''}`}
              onClick={() => tick.mutate({ itemId: item.id, ticked: !item.ticked })}
            >
              <span className="routine-checklist__tick" aria-hidden="true">
                {item.ticked ? '✓' : '○'}
              </span>
              <span className="routine-checklist__label">{item.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RoutinesPanel({ profileName }: Props) {
  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['checklists'],
    queryFn: getChecklists,
    staleTime: 60_000,
  });

  const routines = checklists.filter(
    (c) =>
      c.type === 'daily_reset' &&
      (c.name.toLowerCase().includes('morning') ||
        c.name.toLowerCase().includes('bedtime') ||
        c.name.toLowerCase().includes('routine')),
  );

  if (isLoading) return <div>Loading routines…</div>;

  if (routines.length === 0) {
    return (
      <div className="routines-panel__empty">
        <p>No routines found for {profileName}.</p>
        <p>Create a checklist named "Morning Routine" or "Bedtime Routine" in House settings.</p>
      </div>
    );
  }

  return (
    <div className="routines-panel">
      {routines.map((checklist) => (
        <RoutineChecklist key={checklist.id} checklist={checklist} />
      ))}
    </div>
  );
}
