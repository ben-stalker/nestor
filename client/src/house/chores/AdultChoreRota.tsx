import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, EmptyState } from '../../shared/ui';
import { getAdultChores } from '../api';
import { completeChore } from '../../family/api';

export default function AdultChoreRota() {
  const qc = useQueryClient();

  const { data: chores = [], isLoading } = useQuery({
    queryKey: ['chores', 'adult'],
    queryFn: getAdultChores,
    staleTime: 60_000,
  });

  const completeMutation = useMutation({
    mutationFn: completeChore,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chores', 'adult'] });
    },
  });

  if (isLoading) {
    return <p className="text-secondary text-body p-4">Loading chores...</p>;
  }

  if (chores.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          heading="No adult chores"
          body="Adult chores will appear here once assigned to adult profiles."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-h2 font-semibold text-primary">Adult Chores</h2>
      <ul className="space-y-3" role="list">
        {chores.map((chore) => (
          <li key={chore.id}>
            <Card>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-primary">{chore.name}</p>
                  {chore.description && (
                    <p className="text-caption text-secondary mt-0.5">{chore.description}</p>
                  )}
                  <p className="text-caption text-secondary mt-1">
                    {chore.frequency.charAt(0).toUpperCase() + chore.frequency.slice(1)} ·{' '}
                    {chore.points} {chore.points === 1 ? 'point' : 'points'}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => completeMutation.mutate(chore.id)}
                  loading={completeMutation.isPending}
                  aria-label={`Complete ${chore.name}`}
                >
                  Done
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
