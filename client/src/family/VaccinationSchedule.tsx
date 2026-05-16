import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getVaccinations, createHealthLog } from './api';
import type { VaccinationItem } from './api';

interface Props {
  profileId: number;
  isAdmin?: boolean;
}

function statusLabel(item: VaccinationItem): string {
  if (item.completed) return 'Done';
  const daysUntil = Math.ceil((item.dueAt - Date.now()) / 86_400_000);
  if (daysUntil < 0) return `Overdue by ${Math.abs(daysUntil)}d`;
  if (daysUntil === 0) return 'Due today';
  return `Due in ${daysUntil}d`;
}

function ageLabel(weeks: number): string {
  if (weeks < 8) return `${weeks} weeks`;
  if (weeks < 52) return `${Math.round(weeks / 4.33)} months`;
  const years = Math.round(weeks / 52);
  return `${years} year${years !== 1 ? 's' : ''}`;
}

export default function VaccinationSchedule({ profileId, isAdmin = false }: Props) {
  const qc = useQueryClient();
  const { data: schedule = [], isLoading } = useQuery({
    queryKey: ['vaccinations', profileId],
    queryFn: () => getVaccinations(profileId),
    staleTime: 60_000,
  });

  const markDone = useMutation({
    mutationFn: (item: VaccinationItem) =>
      createHealthLog(profileId, { log_type: 'vaccination', name: item.name }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vaccinations', profileId] });
      void qc.invalidateQueries({ queryKey: ['health-log', profileId] });
    },
  });

  if (isLoading) return <div>Loading vaccination schedule…</div>;

  if (schedule.length === 0) {
    return (
      <p className="vaccination-schedule__empty">
        No vaccination schedule — add a date of birth to this profile to generate it.
      </p>
    );
  }

  const upcoming = schedule.filter((v) => !v.completed);
  const completed = schedule.filter((v) => v.completed);

  return (
    <div className="vaccination-schedule">
      {upcoming.length > 0 && (
        <section aria-label="Upcoming vaccinations">
          <h3 className="vaccination-schedule__heading">Upcoming</h3>
          <ul className="vaccination-schedule__list">
            {upcoming.map((item) => {
              const overdue = item.dueAt < Date.now();
              return (
                <li
                  key={item.id}
                  className={`vaccination-schedule__item${overdue ? ' vaccination-schedule__item--overdue' : ''}`}
                >
                  <div className="vaccination-schedule__info">
                    <strong className="vaccination-schedule__name">{item.name}</strong>
                    <span className="vaccination-schedule__age">{ageLabel(item.age_weeks)}</span>
                    <span className="vaccination-schedule__desc">{item.description}</span>
                  </div>
                  <div className="vaccination-schedule__status">
                    <span
                      className={`vaccination-schedule__badge${overdue ? ' vaccination-schedule__badge--overdue' : ''}`}
                    >
                      {statusLabel(item)}
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        className="vaccination-schedule__done-btn"
                        onClick={() => markDone.mutate(item)}
                        disabled={markDone.isPending}
                      >
                        Mark done
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {completed.length > 0 && (
        <section aria-label="Completed vaccinations">
          <h3 className="vaccination-schedule__heading">Completed</h3>
          <ul className="vaccination-schedule__list vaccination-schedule__list--done">
            {completed.map((item) => (
              <li
                key={item.id}
                className="vaccination-schedule__item vaccination-schedule__item--done"
              >
                <span className="vaccination-schedule__name">{item.name}</span>
                <span className="vaccination-schedule__age">{ageLabel(item.age_weeks)}</span>
                <span className="vaccination-schedule__badge vaccination-schedule__badge--done">
                  Done
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
