import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../shared/ui';
import { getChecklist, updateChecklistItem, resetChecklist } from '../api';
import ChecklistComponent from './Checklist';

interface ChecklistDetailProps {
  checklistId: number;
}

export default function ChecklistDetail({ checklistId }: ChecklistDetailProps) {
  const qc = useQueryClient();

  const { data: checklist, isLoading } = useQuery({
    queryKey: ['checklist', checklistId],
    queryFn: () => getChecklist(checklistId),
    staleTime: 30_000,
  });

  const tickMutation = useMutation({
    mutationFn: ({ itemId, ticked }: { itemId: number; ticked: boolean }) =>
      updateChecklistItem(checklistId, itemId, { ticked }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['checklist', checklistId] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetChecklist(checklistId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['checklist', checklistId] });
      void qc.invalidateQueries({ queryKey: ['checklists'] });
    },
  });

  if (isLoading) {
    return <p className="text-secondary text-body">Loading...</p>;
  }

  if (!checklist) {
    return <p className="text-secondary text-body">Checklist not found.</p>;
  }

  const showReset = checklist.type === 'daily_reset' || checklist.type === 'recurring';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-primary">{checklist.name}</h2>
        {resetMutation.isPending && <p className="text-caption text-secondary">Resetting...</p>}
      </div>

      <Card>
        <ChecklistComponent
          items={checklist.items}
          onTick={(id, ticked) => tickMutation.mutate({ itemId: id, ticked })}
          onReset={() => resetMutation.mutate()}
          showReset={showReset}
        />
      </Card>
    </div>
  );
}
