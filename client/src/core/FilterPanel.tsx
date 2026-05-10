import clsx from 'clsx';
import { useOrientation } from './hooks/useOrientation';
import { useProfiles } from './hooks/useProfiles';
import useAppStore from '../store/appStore';
import useFiltersStore from '../store/filtersStore';

function isAllActive(
  selectedProfiles: string[],
  selectedPets: string[],
  selectedVehicles: string[],
  selectedPluginFilters: Record<string, string[]>,
): boolean {
  return (
    selectedProfiles.length === 0 &&
    selectedPets.length === 0 &&
    selectedVehicles.length === 0 &&
    Object.values(selectedPluginFilters).every((arr) => arr.length === 0)
  );
}

export default function FilterPanel() {
  const orientation = useOrientation();
  const { data: profiles } = useProfiles();
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  const profileKey = activeProfileId ?? 'default';

  const rawFilters = useFiltersStore((s) => s.filtersByProfile[profileKey]);
  const pluginFilterDefs = useFiltersStore((s) => s.pluginFilterDefs);
  const toggleProfile = useFiltersStore((s) => s.toggleProfile);
  const togglePluginFilter = useFiltersStore((s) => s.togglePluginFilter);
  const resetAll = useFiltersStore((s) => s.resetAll);

  const selectedProfiles = rawFilters?.selectedProfiles ?? [];
  const selectedPets = rawFilters?.selectedPets ?? [];
  const selectedVehicles = rawFilters?.selectedVehicles ?? [];
  const selectedPluginFilters = rawFilters?.selectedPluginFilters ?? {};
  const allActive = isAllActive(
    selectedProfiles,
    selectedPets,
    selectedVehicles,
    selectedPluginFilters,
  );

  const isPortrait = orientation === 'portrait';
  const panelClass = clsx(
    'filters filter-panel',
    isPortrait ? 'filter-panel--portrait' : 'filter-panel--landscape',
  );

  return (
    <aside className={panelClass} aria-label="Filters">
      {/* All toggle */}
      <button
        type="button"
        aria-pressed={allActive}
        onClick={() => resetAll(profileKey)}
        className={clsx('filter-pill filter-pill--all', allActive && 'filter-pill--active')}
        style={
          allActive
            ? { background: 'var(--color-primary)', color: 'var(--color-warm)' }
            : { background: 'var(--color-surface-elev)', color: 'var(--color-secondary)' }
        }
      >
        All
      </button>

      {/* Profile pills */}
      {profiles?.map((profile) => {
        const active = selectedProfiles.includes(String(profile.id));
        return (
          <button
            key={profile.id}
            type="button"
            aria-label={isPortrait ? profile.name : undefined}
            aria-pressed={active}
            onClick={() => toggleProfile(profileKey, String(profile.id))}
            className={clsx('filter-pill', active && 'filter-pill--active')}
            style={{ background: `${profile.colour}33`, color: profile.colour }}
            title={profile.name}
          >
            {isPortrait ? (
              <span aria-hidden="true">{profile.name.slice(0, 2).toUpperCase()}</span>
            ) : (
              profile.name
            )}
          </button>
        );
      })}

      {/* Plugin filter sections */}
      {pluginFilterDefs.map((def) =>
        def.items.length === 0 ? null : (
          <div
            key={def.id}
            className={clsx(
              'filter-section',
              isPortrait ? 'filter-section--portrait' : 'filter-section--landscape',
            )}
            role="group"
            aria-label={def.label}
          >
            {def.items.map((item) => {
              const active = (selectedPluginFilters[def.id] ?? []).includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={isPortrait ? item.label : undefined}
                  aria-pressed={active}
                  onClick={() => togglePluginFilter(profileKey, def.id, item.id)}
                  className={clsx('filter-pill', active && 'filter-pill--active')}
                  style={
                    item.colour
                      ? { background: `${item.colour}33`, color: item.colour }
                      : { background: 'var(--color-surface-elev)', color: 'var(--color-secondary)' }
                  }
                  title={item.label}
                >
                  {isPortrait ? (
                    <span aria-hidden="true">{item.label.slice(0, 2).toUpperCase()}</span>
                  ) : (
                    item.label
                  )}
                </button>
              );
            })}
          </div>
        ),
      )}
    </aside>
  );
}
