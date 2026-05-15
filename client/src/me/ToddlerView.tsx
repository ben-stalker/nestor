import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getChores, completeChore } from '../family/api';
import RewardStarGrid from './RewardStarGrid';
import type { Profile } from '../api/profiles';

interface Props {
  profile: Profile;
}

export default function ToddlerView({ profile }: Props) {
  const queryClient = useQueryClient();
  const [tapped, setTapped] = useState(false);

  const { data: chores = [] } = useQuery({
    queryKey: ['chores', profile.id],
    queryFn: () => getChores(profile.id),
    staleTime: 30_000,
  });

  const firstChore = chores[0];

  const mutation = useMutation({
    mutationFn: () => completeChore(firstChore?.id ?? 0),
    onSuccess: () => {
      setTapped(true);
      void queryClient.invalidateQueries({ queryKey: ['rewards', 'grid', profile.id] });
      setTimeout(() => setTapped(false), 2000);
    },
  });

  return (
    <div className="toddler-view" aria-label={`${profile.name}'s view`}>
      <div className="toddler-view__avatar" style={{ background: profile.colour }}>
        <span className="toddler-view__initials">{profile.name.slice(0, 2).toUpperCase()}</span>
      </div>

      <RewardStarGrid profileId={profile.id} />

      {firstChore && (
        <button
          type="button"
          className={`toddler-view__tap-btn${tapped ? ' toddler-view__tap-btn--tapped' : ''}`}
          onClick={() => !tapped && mutation.mutate()}
          disabled={mutation.isPending || tapped}
          aria-label="I helped!"
        >
          {tapped ? 'Well done!' : 'I helped!'}
        </button>
      )}
    </div>
  );
}
