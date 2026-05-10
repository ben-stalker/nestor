import { beforeEach, describe, expect, it } from 'vitest';
import useFiltersStore from '../../src/store/filtersStore';
import type { PluginFilterDef } from '../../src/store/filtersStore';

const PLUGIN_DEF: PluginFilterDef = {
  id: 'pets',
  label: 'Pets',
  items: [
    { id: 'dog-1', label: 'Buddy', colour: '#8b4513' },
    { id: 'cat-1', label: 'Whiskers' },
  ],
};

beforeEach(() => {
  useFiltersStore.setState({ filtersByProfile: {}, pluginFilterDefs: [] });
});

describe('filtersStore — initial state', () => {
  it('starts with empty filtersByProfile', () => {
    expect(useFiltersStore.getState().filtersByProfile).toEqual({});
  });

  it('getProfileFilters returns empty defaults for unknown profile', () => {
    const f = useFiltersStore.getState().getProfileFilters('unknown');
    expect(f.selectedProfiles).toEqual([]);
    expect(f.selectedPets).toEqual([]);
    expect(f.selectedVehicles).toEqual([]);
    expect(f.selectedPluginFilters).toEqual({});
  });
});

describe('filtersStore — toggleProfile', () => {
  it('adds a profile ID when toggled on', () => {
    useFiltersStore.getState().toggleProfile('p1', '2');
    expect(useFiltersStore.getState().getProfileFilters('p1').selectedProfiles).toEqual(['2']);
  });

  it('removes a profile ID when toggled off', () => {
    useFiltersStore.getState().toggleProfile('p1', '2');
    useFiltersStore.getState().toggleProfile('p1', '2');
    expect(useFiltersStore.getState().getProfileFilters('p1').selectedProfiles).toEqual([]);
  });

  it('profiles for different profileId keys are independent', () => {
    useFiltersStore.getState().toggleProfile('p1', '2');
    expect(useFiltersStore.getState().getProfileFilters('p2').selectedProfiles).toEqual([]);
  });
});

describe('filtersStore — togglePet', () => {
  it('adds and removes a pet ID', () => {
    useFiltersStore.getState().togglePet('p1', 'dog-1');
    expect(useFiltersStore.getState().getProfileFilters('p1').selectedPets).toEqual(['dog-1']);
    useFiltersStore.getState().togglePet('p1', 'dog-1');
    expect(useFiltersStore.getState().getProfileFilters('p1').selectedPets).toEqual([]);
  });
});

describe('filtersStore — toggleVehicle', () => {
  it('adds and removes a vehicle ID', () => {
    useFiltersStore.getState().toggleVehicle('p1', 'car-1');
    expect(useFiltersStore.getState().getProfileFilters('p1').selectedVehicles).toEqual(['car-1']);
    useFiltersStore.getState().toggleVehicle('p1', 'car-1');
    expect(useFiltersStore.getState().getProfileFilters('p1').selectedVehicles).toEqual([]);
  });
});

describe('filtersStore — resetAll', () => {
  it('clears all selections for a profile', () => {
    useFiltersStore.getState().toggleProfile('p1', '2');
    useFiltersStore.getState().togglePet('p1', 'dog-1');
    useFiltersStore.getState().resetAll('p1');
    const f = useFiltersStore.getState().getProfileFilters('p1');
    expect(f.selectedProfiles).toEqual([]);
    expect(f.selectedPets).toEqual([]);
    expect(f.selectedVehicles).toEqual([]);
    expect(f.selectedPluginFilters).toEqual({});
  });

  it('does not affect other profiles', () => {
    useFiltersStore.getState().toggleProfile('p1', '2');
    useFiltersStore.getState().toggleProfile('p2', '3');
    useFiltersStore.getState().resetAll('p1');
    expect(useFiltersStore.getState().getProfileFilters('p2').selectedProfiles).toEqual(['3']);
  });
});

describe('filtersStore — togglePluginFilter', () => {
  it('adds and removes plugin filter items', () => {
    useFiltersStore.getState().togglePluginFilter('p1', 'pets', 'dog-1');
    expect(useFiltersStore.getState().getProfileFilters('p1').selectedPluginFilters.pets).toEqual([
      'dog-1',
    ]);
    useFiltersStore.getState().togglePluginFilter('p1', 'pets', 'dog-1');
    expect(useFiltersStore.getState().getProfileFilters('p1').selectedPluginFilters.pets).toEqual(
      [],
    );
  });

  it('keeps multiple plugin namespaces independent', () => {
    useFiltersStore.getState().togglePluginFilter('p1', 'pets', 'dog-1');
    useFiltersStore.getState().togglePluginFilter('p1', 'vehicles', 'car-1');
    const f = useFiltersStore.getState().getProfileFilters('p1');
    expect(f.selectedPluginFilters.pets).toEqual(['dog-1']);
    expect(f.selectedPluginFilters.vehicles).toEqual(['car-1']);
  });
});

describe('filtersStore — plugin registry', () => {
  it('registers a plugin filter definition', () => {
    useFiltersStore.getState().registerPlugin(PLUGIN_DEF);
    expect(useFiltersStore.getState().pluginFilterDefs).toHaveLength(1);
    expect(useFiltersStore.getState().pluginFilterDefs[0].id).toBe('pets');
  });

  it('replaces an existing definition with same id', () => {
    useFiltersStore.getState().registerPlugin(PLUGIN_DEF);
    useFiltersStore.getState().registerPlugin({ ...PLUGIN_DEF, label: 'Updated Pets' });
    expect(useFiltersStore.getState().pluginFilterDefs).toHaveLength(1);
    expect(useFiltersStore.getState().pluginFilterDefs[0].label).toBe('Updated Pets');
  });

  it('unregisters a plugin filter definition', () => {
    useFiltersStore.getState().registerPlugin(PLUGIN_DEF);
    useFiltersStore.getState().unregisterPlugin('pets');
    expect(useFiltersStore.getState().pluginFilterDefs).toHaveLength(0);
  });

  it('unregistering unknown plugin is a no-op', () => {
    useFiltersStore.getState().unregisterPlugin('unknown');
    expect(useFiltersStore.getState().pluginFilterDefs).toHaveLength(0);
  });
});
