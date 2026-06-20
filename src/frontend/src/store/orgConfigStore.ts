import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OrgConfig } from '../types/orgConfig';

interface OrgConfigState {
  config: OrgConfig | null;
  isConfigured: boolean;
  saveConfig: (config: OrgConfig) => void;
  resetConfig: () => void;
}

export const useOrgConfigStore = create<OrgConfigState>()(
  persist(
    (set) => ({
      config: null,
      isConfigured: false,
      saveConfig: (config) => set({ config, isConfigured: true }),
      resetConfig: () => set({ config: null, isConfigured: false }),
    }),
    { name: 'teamfit-org-config' },
  ),
);
