import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Snap } from '../types';

export interface RecentSnapEntry {
  id: string;
  title: string;
  thumbnail?: string;
  cloudSnapId?: string | null;
  savedAt: number;
  snap: Snap;
}

interface RecentSnapsState {
  recentSnaps: RecentSnapEntry[];
  maxRecent: number;
  
  // Actions
  addRecentSnap: (snap: Snap, thumbnail?: string, cloudSnapId?: string | null) => void;
  removeRecentSnap: (id: string) => void;
  clearRecentSnaps: () => void;
  getRecentSnaps: () => RecentSnapEntry[];
}

export const useRecentSnapsStore = create<RecentSnapsState>()(
  persist(
    (set, get) => ({
      recentSnaps: [],
      maxRecent: 10,
      
      addRecentSnap: (snap: Snap, thumbnail?: string, cloudSnapId?: string | null) => {
        const id = `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const entry: RecentSnapEntry = {
          id,
          title: snap.meta.title || 'Untitled',
          thumbnail,
          cloudSnapId: cloudSnapId ?? null,
          savedAt: Date.now(),
          snap: JSON.parse(JSON.stringify(snap)), // Deep clone
        };
        
        set((state) => {
          // Remove duplicates with same title and similar content
          const filtered = state.recentSnaps.filter((s) => {
            if (entry.cloudSnapId) {
              return s.cloudSnapId !== entry.cloudSnapId;
            }
            return s.title !== snap.meta.title;
          });
          
          // Add new entry at the beginning
          const updated = [entry, ...filtered];
          
          // Keep only maxRecent entries
          return {
            recentSnaps: updated.slice(0, state.maxRecent),
          };
        });
      },
      
      removeRecentSnap: (id: string) => {
        set((state) => ({
          recentSnaps: state.recentSnaps.filter((s) => s.id !== id),
        }));
      },
      
      clearRecentSnaps: () => {
        set({ recentSnaps: [] });
      },
      
      getRecentSnaps: () => {
        return get().recentSnaps;
      },
    }),
    {
      name: 'code-canvas-recent-snaps',
      // Only persist essential data to keep storage size reasonable
      partialize: (state) => ({
        recentSnaps: state.recentSnaps.map((entry) => ({
          ...entry,
          thumbnail: undefined, // Don't persist thumbnails to save space
        })),
      }),
    }
  )
);

// Helper to format relative time
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'Just now';
};
