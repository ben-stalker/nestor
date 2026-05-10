import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FilterItem {
  id: string;
  label: string;
  colour?: string;
}

export interface PluginFilterDef {
  id: string;
  label: string;
  items: FilterItem[];
}

export interface ProfileFilters {
  selectedProfiles: string[];
  selectedPets: string[];
  selectedVehicles: string[];
  selectedPluginFilters: Record<string, string[]>;
}

const EMPTY_FILTERS: ProfileFilters = {
  selectedProfiles: [],
  selectedPets: [],
  selectedVehicles: [],
  selectedPluginFilters: {},
};

interface FiltersState {
  filtersByProfile: Record<string, ProfileFilters>;
  pluginFilterDefs: PluginFilterDef[];

  getProfileFilters: (profileId: string) => ProfileFilters;
  toggleProfile: (profileId: string, itemId: string) => void;
  togglePet: (profileId: string, itemId: string) => void;
  toggleVehicle: (profileId: string, itemId: string) => void;
  togglePluginFilter: (profileId: string, pluginId: string, itemId: string) => void;
  resetAll: (profileId: string) => void;
  registerPlugin: (def: PluginFilterDef) => void;
  unregisterPlugin: (pluginId: string) => void;
}

function toggle(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

function getFilters(state: FiltersState, profileId: string): ProfileFilters {
  return state.filtersByProfile[profileId] ?? { ...EMPTY_FILTERS };
}

function updateFilters(
  state: FiltersState,
  profileId: string,
  update: Partial<ProfileFilters>,
): Partial<FiltersState> {
  const current = getFilters(state, profileId);
  return {
    filtersByProfile: {
      ...state.filtersByProfile,
      [profileId]: { ...current, ...update },
    },
  };
}

const useFiltersStore = create<FiltersState>()(
  persist(
    (set, get) => ({
      filtersByProfile: {},
      pluginFilterDefs: [],

      getProfileFilters: (profileId) => getFilters(get(), profileId),

      toggleProfile: (profileId, itemId) =>
        set((s) => {
          const f = getFilters(s, profileId);
          return updateFilters(s, profileId, {
            selectedProfiles: toggle(f.selectedProfiles, itemId),
          });
        }),

      togglePet: (profileId, itemId) =>
        set((s) => {
          const f = getFilters(s, profileId);
          return updateFilters(s, profileId, { selectedPets: toggle(f.selectedPets, itemId) });
        }),

      toggleVehicle: (profileId, itemId) =>
        set((s) => {
          const f = getFilters(s, profileId);
          return updateFilters(s, profileId, {
            selectedVehicles: toggle(f.selectedVehicles, itemId),
          });
        }),

      togglePluginFilter: (profileId, pluginId, itemId) =>
        set((s) => {
          const f = getFilters(s, profileId);
          const existing = f.selectedPluginFilters[pluginId] ?? [];
          return updateFilters(s, profileId, {
            selectedPluginFilters: {
              ...f.selectedPluginFilters,
              [pluginId]: toggle(existing, itemId),
            },
          });
        }),

      resetAll: (profileId) =>
        set((s) =>
          updateFilters(s, profileId, {
            selectedProfiles: [],
            selectedPets: [],
            selectedVehicles: [],
            selectedPluginFilters: {},
          }),
        ),

      registerPlugin: (def) =>
        set((s) => ({
          pluginFilterDefs: [...s.pluginFilterDefs.filter((d) => d.id !== def.id), def],
        })),

      unregisterPlugin: (pluginId) =>
        set((s) => ({
          pluginFilterDefs: s.pluginFilterDefs.filter((d) => d.id !== pluginId),
        })),
    }),
    {
      name: 'nestor-filters',
      partialize: (s) => ({ filtersByProfile: s.filtersByProfile }),
    },
  ),
);

export default useFiltersStore;
