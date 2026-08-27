import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_SETTINGS, type Qso, type RunMode, type UserSettings } from '../types';

interface GameStore {
  settings: UserSettings;
  call: string;
  exch1: string;
  exch2: string;
  running: boolean;
  mode: RunMode;
  elapsed: number;
  qsoList: Qso[];
  setSettings: (patch: Partial<UserSettings>) => void;
  setExchange: (patch: Partial<Pick<GameStore, 'call' | 'exch1' | 'exch2'>>) => void;
  setRunning: (running: boolean, mode?: RunMode) => void;
  setElapsed: (elapsed: number) => void;
  addQso: (qso: Qso) => void;
  replaceQsoList: (qsos: Qso[]) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      call: '', exch1: '', exch2: '',
      running: false, mode: 'pileup', elapsed: 0, qsoList: [],
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setExchange: (patch) => set(patch),
      setRunning: (running, mode) => set((s) => ({ running, mode: mode ?? s.mode })),
      setElapsed: (elapsed) => set({ elapsed }),
      addQso: (qso) => set((s) => ({ qsoList: [...s.qsoList, qso], call: '', exch1: '', exch2: '' })),
      replaceQsoList: (qsos) => set({ qsoList: qsos, call: '', exch1: '', exch2: '' }),
      resetGame: () => set({ call: '', exch1: '', exch2: '', qsoList: [], elapsed: 0 }),
    }),
    {
      name: 'morse-runner-web-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ settings: state.settings }),
    },
  ),
);

