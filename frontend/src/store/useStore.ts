import create from 'zustand';

export type Priority = 'high' | 'medium' | 'low';

export interface Transfer {
  transferId: string;
  fileName: string;
  size: number;
  progress: number;
  speed: number;
  etaSecs: number | null;
  priority: Priority;
  transport: 'wifi' | 'cell' | 'bluetooth';
  chunkBitmap: boolean[];
  agentBadge?: string;
}

interface AppState {
  transfers: Record<string, Transfer>;
  selectedId: string | null;
  activity: string[];
  addActivity: (msg: string) => void;
  upsertTransfer: (t: Partial<Transfer> & { transferId: string }) => void;
  select: (id: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  transfers: {},
  selectedId: null,
  activity: [],
  addActivity: (msg) =>
    set((s) => ({
      activity: [`${new Date().toLocaleTimeString()} ${msg}`, ...s.activity].slice(0, 200)
    })),
  upsertTransfer: (t) =>
    set((s) => {
      const prev = s.transfers[t.transferId] || {
        transferId: t.transferId,
        fileName: t.fileName || 'file',
        size: t.size || 0,
        progress: 0,
        speed: 0,
        etaSecs: null,
        priority: (t.priority as Priority) || 'medium',
        transport: (t.transport as any) || 'wifi',
        chunkBitmap: t.chunkBitmap || []
      };
      const merged = { ...prev, ...t };
      return { transfers: { ...s.transfers, [t.transferId]: merged } };
    }),
  select: (id) => set(() => ({ selectedId: id }))
}));


