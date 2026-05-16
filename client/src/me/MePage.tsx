import { useQuery } from '@tanstack/react-query';
import { getChores } from '../family/api';
import type { Profile } from '../api/profiles';
import MyDayCard from './MyDayCard';
import ChoreTile from './ChoreTile';
import RewardStarGrid from './RewardStarGrid';
import ToddlerView from './ToddlerView';
import BabyView from '../family/BabyView';

interface Props {
  profile: Profile;
}

export default function MePage({ profile }: Props) {
  const { data: chores = [] } = useQuery({
    queryKey: ['chores', profile.id],
    queryFn: () => getChores(profile.id),
    staleTime: 30_000,
  });

  if (profile.type === 'baby') {
    return <BabyView profile={profile} />;
  }

  if (profile.type === 'toddler') {
    return <ToddlerView profile={profile} />;
  }

  return (
    <main className="me-page" data-simplified-nav="true">
      <header className="me-page__header">
        <div className="me-page__avatar" style={{ background: profile.colour }}>
          <span className="me-page__initials">{profile.name.slice(0, 2).toUpperCase()}</span>
        </div>
        <h1 className="me-page__name">{profile.name}</h1>
      </header>

      <MyDayCard profileId={profile.id} name={profile.name} />

      <section className="me-page__chores" aria-labelledby="chores-heading">
        <h2 id="chores-heading" className="me-page__section-title">
          My Chores
        </h2>
        {chores.length === 0 ? (
          <p className="me-page__empty">No chores today!</p>
        ) : (
          <ul className="me-page__chore-list">
            {chores.map((chore) => (
              <li key={chore.id}>
                <ChoreTile chore={chore} profileId={profile.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="me-page__rewards" aria-labelledby="rewards-heading">
        <h2 id="rewards-heading" className="me-page__section-title">
          My Stars
        </h2>
        <RewardStarGrid profileId={profile.id} />
      </section>
    </main>
  );
}
