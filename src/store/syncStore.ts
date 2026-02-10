import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Snap, CloudSnap, SyncState } from '../types';
import { useAuthStore } from './authStore';
import { useCanvasStore } from './canvasStore';
import { useRecentSnapsStore } from './recentSnapsStore';
import { toast } from 'sonner';

const LOCAL_PENDING_ID_PREFIX = 'local-pending:';
const SYNC_STORE_STORAGE_KEY = 'yvcode-sync-store-v1';

let detachNetworkListeners: (() => void) | null = null;
let hasShownOfflineQueueToast = false;

const isBrowserOnline = (): boolean => {
  if (typeof navigator === 'undefined') {
    return true;
  }
  return navigator.onLine;
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return 'Unknown sync error';
};

const isLocalPendingId = (id: string | null | undefined): id is string =>
  typeof id === 'string' && id.startsWith(LOCAL_PENDING_ID_PREFIX);

const isOfflineLikeError = (error: unknown): boolean => {
  if (!isBrowserOnline()) {
    return true;
  }

  const message = toErrorMessage(error).toLowerCase();
  return (
    message.includes('failed to fetch')
    || message.includes('network')
    || message.includes('offline')
    || message.includes('load failed')
    || message.includes('fetch failed')
    || message.includes('request timed out')
  );
};

const createLocalPendingId = (): string =>
  `${LOCAL_PENDING_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createOperationId = (): string =>
  `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
        return;
      }
      reject(new Error('Unable to encode file for offline sync.'));
    };
    reader.onerror = () => reject(new Error('Unable to encode file for offline sync.'));
    reader.readAsDataURL(blob);
  });

const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const notifyOfflineQueue = () => {
  if (hasShownOfflineQueueToast) {
    return;
  }
  hasShownOfflineQueueToast = true;
  toast.info('Offline mode: changes are saved locally and will sync automatically once connection is restored.');
};

const clearOfflineQueueToastFlag = () => {
  hasShownOfflineQueueToast = false;
};

const getCurrentCloudSnapCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('snaps')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return count ?? 0;
};

const uploadThumbnailForUser = async (userId: string, thumbnail: Blob): Promise<string> => {
  const fileName = `${userId}/thumbnails/${Date.now()}.png`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('snapshots')
    .upload(fileName, thumbnail, {
      contentType: 'image/png',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('snapshots')
    .getPublicUrl(uploadData.path);

  return publicUrl;
};

type PendingSyncOperation =
  | {
    id: string;
    kind: 'create';
    userId: string;
    localSnapId: string;
    snap: Snap;
    thumbnailDataUrl?: string;
    createdAt: number;
    updatedAt: number;
    attempts: number;
  }
  | {
    id: string;
    kind: 'update';
    userId: string;
    cloudSnapId?: string;
    localSnapId?: string;
    snap: Snap;
    createdAt: number;
    updatedAt: number;
    attempts: number;
  };

type SaveCloudResult = { id?: string; queued?: boolean; error?: string };
type UpdateCloudResult = { queued?: boolean; error?: string };

const enqueueCreateOperation = (
  queue: PendingSyncOperation[],
  operation: Extract<PendingSyncOperation, { kind: 'create' }>
): PendingSyncOperation[] => {
  const existingIndex = queue.findIndex(
    (entry) =>
      entry.kind === 'create'
      && entry.userId === operation.userId
      && entry.localSnapId === operation.localSnapId
  );

  if (existingIndex === -1) {
    return [...queue, operation];
  }

  const nextQueue = [...queue];
  const existing = nextQueue[existingIndex] as Extract<PendingSyncOperation, { kind: 'create' }>;
  nextQueue[existingIndex] = {
    ...existing,
    snap: operation.snap,
    thumbnailDataUrl: operation.thumbnailDataUrl ?? existing.thumbnailDataUrl,
    updatedAt: operation.updatedAt,
  };
  return nextQueue;
};

const enqueueUpdateOperation = (
  queue: PendingSyncOperation[],
  operation: Extract<PendingSyncOperation, { kind: 'update' }>
): PendingSyncOperation[] => {
  if (operation.localSnapId) {
    const createIndex = queue.findIndex(
      (entry) =>
        entry.kind === 'create'
        && entry.userId === operation.userId
        && entry.localSnapId === operation.localSnapId
    );
    if (createIndex !== -1) {
      const nextQueue = [...queue];
      const createEntry = nextQueue[createIndex] as Extract<PendingSyncOperation, { kind: 'create' }>;
      nextQueue[createIndex] = {
        ...createEntry,
        snap: operation.snap,
        updatedAt: operation.updatedAt,
      };
      return nextQueue.filter((entry) => entry.id !== operation.id);
    }
  }

  const existingIndex = queue.findIndex((entry) => {
    if (entry.kind !== 'update' || entry.userId !== operation.userId) {
      return false;
    }

    if (operation.cloudSnapId && !isLocalPendingId(operation.cloudSnapId)) {
      return entry.cloudSnapId === operation.cloudSnapId;
    }

    if (operation.localSnapId) {
      return entry.localSnapId === operation.localSnapId;
    }

    return false;
  });

  if (existingIndex === -1) {
    return [...queue, operation];
  }

  const nextQueue = [...queue];
  const existing = nextQueue[existingIndex] as Extract<PendingSyncOperation, { kind: 'update' }>;
  nextQueue[existingIndex] = {
    ...existing,
    snap: operation.snap,
    updatedAt: operation.updatedAt,
  };
  return nextQueue;
};

interface SyncStoreState extends SyncState {
  cloudSnaps: CloudSnap[];
  pendingQueue: PendingSyncOperation[];
  isOnline: boolean;

  // Actions
  fetchCloudSnaps: () => Promise<void>;
  saveSnapToCloud: (snap: Snap, thumbnail?: Blob) => Promise<SaveCloudResult>;
  updateCloudSnap: (id: string, snap: Snap) => Promise<UpdateCloudResult>;
  deleteCloudSnap: (id: string) => Promise<{ error?: string }>;
  loadSnapFromCloud: (id: string) => Promise<{ snap?: Snap; error?: string }>;
  initializeLocalFirstSync: () => (() => void);
  flushPendingChanges: () => Promise<void>;

  // Migration
  migrateLocalSnaps: (localSnaps: Snap[]) => Promise<{ migratedCount: number; skippedCount: number; error?: string }>;

  // Sync status
  setStatus: (status: SyncState['status']) => void;
}

export const useSyncStore = create<SyncStoreState>()(
  persist(
    (set, get) => ({
      status: isBrowserOnline() ? 'idle' : 'offline',
      cloudSnaps: [],
      pendingQueue: [],
      isOnline: isBrowserOnline(),
      lastSyncAt: undefined,
      pendingChanges: 0,
      error: undefined,

      setStatus: (status) => set({ status }),

      initializeLocalFirstSync: () => {
        if (typeof window === 'undefined') {
          return () => undefined;
        }

        if (detachNetworkListeners) {
          return detachNetworkListeners;
        }

        const handleConnectionChange = () => {
          const online = isBrowserOnline();
          if (!online) {
            set({ isOnline: false, status: 'offline' });
            return;
          }

          set({
            isOnline: true,
            status: get().pendingQueue.length > 0 ? 'syncing' : 'idle',
            error: undefined,
          });
          void get().flushPendingChanges();
        };

        window.addEventListener('online', handleConnectionChange);
        window.addEventListener('offline', handleConnectionChange);
        handleConnectionChange();

        detachNetworkListeners = () => {
          window.removeEventListener('online', handleConnectionChange);
          window.removeEventListener('offline', handleConnectionChange);
          detachNetworkListeners = null;
        };

        return detachNetworkListeners;
      },

      flushPendingChanges: async () => {
        const user = useAuthStore.getState().user;
        if (!user) {
          return;
        }

        if (!isBrowserOnline()) {
          set({ status: 'offline', isOnline: false });
          return;
        }

        let queue = get().pendingQueue;
        const hasUserPendingChanges = queue.some((entry) => entry.userId === user.id);
        if (!hasUserPendingChanges) {
          set({
            status: 'idle',
            isOnline: true,
            pendingChanges: queue.length,
            error: undefined,
          });
          clearOfflineQueueToastFlag();
          return;
        }

        set({
          status: 'syncing',
          isOnline: true,
          error: undefined,
        });

        const cloudIdByLocalId = new Map<string, string>();
        let syncedCount = 0;
        let shouldRefreshCloudSnaps = false;
        let shouldRefreshSubscription = false;

        while (true) {
          const nextOperation = queue
            .filter((entry) => entry.userId === user.id)
            .sort((a, b) => a.createdAt - b.createdAt)[0];

          if (!nextOperation) {
            break;
          }

          try {
            if (nextOperation.kind === 'create') {
              const { subscription } = useAuthStore.getState();
              if (subscription.snap_limit !== -1) {
                const currentCloudCount = await getCurrentCloudSnapCount(user.id);
                if (currentCloudCount >= subscription.snap_limit) {
                  const message = `Free plan limit reached (${subscription.snap_limit} snaps). Upgrade to Pro to sync pending project(s).`;
                  set({
                    pendingQueue: queue,
                    pendingChanges: queue.length,
                    status: 'error',
                    isOnline: true,
                    error: message,
                  });
                  toast.error(message);
                  return;
                }
              }

              let thumbnailUrl: string | undefined;
              if (nextOperation.thumbnailDataUrl) {
                const thumbnailBlob = await dataUrlToBlob(nextOperation.thumbnailDataUrl);
                thumbnailUrl = await uploadThumbnailForUser(user.id, thumbnailBlob);
              }

              const { data, error } = await supabase
                .from('snaps')
                .insert([
                  {
                    user_id: user.id,
                    title: nextOperation.snap.meta.title || 'Untitled',
                    data: nextOperation.snap,
                    thumbnail_url: thumbnailUrl,
                  },
                ])
                .select('id')
                .single();

              if (error) {
                throw error;
              }

              queue = queue.filter((entry) => entry.id !== nextOperation.id);
              cloudIdByLocalId.set(nextOperation.localSnapId, data.id);
              useRecentSnapsStore.getState().replaceCloudSnapId(nextOperation.localSnapId, data.id);

              const canvasState = useCanvasStore.getState();
              if (canvasState.activeCloudSnapId === nextOperation.localSnapId) {
                canvasState.setCloudSyncState(data.id, canvasState.snap);
              }

              syncedCount += 1;
              shouldRefreshCloudSnaps = true;
              shouldRefreshSubscription = true;
              continue;
            }

            let targetCloudSnapId = nextOperation.cloudSnapId;
            if (targetCloudSnapId && isLocalPendingId(targetCloudSnapId)) {
              targetCloudSnapId = cloudIdByLocalId.get(targetCloudSnapId);
            }

            if (!targetCloudSnapId && nextOperation.localSnapId) {
              targetCloudSnapId = cloudIdByLocalId.get(nextOperation.localSnapId);
            }

            if (!targetCloudSnapId) {
              // If linked create operation still exists, merge into it and continue.
              if (nextOperation.localSnapId) {
                const linkedCreateIndex = queue.findIndex(
                  (entry) =>
                    entry.kind === 'create'
                    && entry.userId === user.id
                    && entry.localSnapId === nextOperation.localSnapId
                );
                if (linkedCreateIndex !== -1) {
                  const nextQueue = [...queue];
                  const linkedCreate = nextQueue[linkedCreateIndex] as Extract<PendingSyncOperation, { kind: 'create' }>;
                  nextQueue[linkedCreateIndex] = {
                    ...linkedCreate,
                    snap: nextOperation.snap,
                    updatedAt: Date.now(),
                  };
                  queue = nextQueue.filter((entry) => entry.id !== nextOperation.id);
                  continue;
                }
              }

              // Convert orphan update to create to avoid data loss.
              const fallbackLocalSnapId = nextOperation.localSnapId ?? createLocalPendingId();
              const convertedCreate: Extract<PendingSyncOperation, { kind: 'create' }> = {
                id: nextOperation.id,
                kind: 'create',
                userId: nextOperation.userId,
                localSnapId: fallbackLocalSnapId,
                snap: nextOperation.snap,
                createdAt: nextOperation.createdAt,
                updatedAt: Date.now(),
                attempts: nextOperation.attempts,
              };
              queue = queue.map((entry) => (entry.id === nextOperation.id ? convertedCreate : entry));
              continue;
            }

            const { data, error } = await supabase
              .from('snaps')
              .update({
                title: nextOperation.snap.meta.title || 'Untitled',
                data: nextOperation.snap,
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetCloudSnapId)
              .eq('user_id', user.id)
              .select('id')
              .maybeSingle();

            if (error) {
              throw error;
            }
            if (!data) {
              throw new Error('Cloud snap introuvable. Sauvegardez comme nouveau snap.');
            }

            queue = queue.filter((entry) => entry.id !== nextOperation.id);
            syncedCount += 1;
            shouldRefreshCloudSnaps = true;
            continue;
          } catch (error: unknown) {
            const message = toErrorMessage(error);
            const offlineError = isOfflineLikeError(error);
            queue = queue.map((entry) =>
              entry.id === nextOperation.id
                ? { ...entry, attempts: entry.attempts + 1, updatedAt: Date.now() }
                : entry
            );

            set({
              pendingQueue: queue,
              pendingChanges: queue.length,
              status: offlineError ? 'offline' : 'error',
              isOnline: !offlineError && isBrowserOnline(),
              error: message,
            });

            if (offlineError) {
              notifyOfflineQueue();
            } else {
              toast.error(`Sync failed: ${message}`);
            }
            return;
          }
        }

        set({
          pendingQueue: queue,
          pendingChanges: queue.length,
          status: 'idle',
          isOnline: true,
          error: undefined,
          lastSyncAt: Date.now(),
        });

        if (shouldRefreshCloudSnaps) {
          await get().fetchCloudSnaps();
        }
        if (shouldRefreshSubscription) {
          await useAuthStore.getState().fetchSubscription();
        }

        if (syncedCount > 0) {
          clearOfflineQueueToastFlag();
          toast.success('Offline changes synced to cloud.');
        }
      },

      fetchCloudSnaps: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        if (!isBrowserOnline()) {
          set({ status: 'offline', isOnline: false });
          return;
        }

        set({ status: 'syncing', isOnline: true });

        try {
          const { data, error } = await supabase
            .from('snaps')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          set({
            cloudSnaps: data as CloudSnap[],
            status: 'idle',
            isOnline: true,
            lastSyncAt: Date.now(),
            error: undefined,
          });
        } catch (error: unknown) {
          const message = toErrorMessage(error);
          if (isOfflineLikeError(error)) {
            set({ status: 'offline', isOnline: false, error: undefined });
            return;
          }
          set({ status: 'error', isOnline: true, error: message });
          toast.error('Failed to fetch cloud snaps');
        }
      },

      saveSnapToCloud: async (snap, thumbnail) => {
        const user = useAuthStore.getState().user;
        if (!user) return { error: 'Not authenticated' };

        const queueCreateForLater = async (preferredLocalSnapId?: string): Promise<string> => {
          const localSnapId = preferredLocalSnapId ?? createLocalPendingId();
          let thumbnailDataUrl: string | undefined;
          if (thumbnail) {
            try {
              thumbnailDataUrl = await blobToDataUrl(thumbnail);
            } catch (error) {
              console.error('Failed to serialize thumbnail for offline sync:', error);
            }
          }

          const now = Date.now();
          const operation: Extract<PendingSyncOperation, { kind: 'create' }> = {
            id: createOperationId(),
            kind: 'create',
            userId: user.id,
            localSnapId,
            snap,
            thumbnailDataUrl,
            createdAt: now,
            updatedAt: now,
            attempts: 0,
          };

          set((state) => {
            const nextQueue = enqueueCreateOperation(state.pendingQueue, operation);
            return {
              pendingQueue: nextQueue,
              pendingChanges: nextQueue.length,
              status: 'offline',
              isOnline: false,
              error: undefined,
            };
          });
          notifyOfflineQueue();
          return localSnapId;
        };

        if (!isBrowserOnline()) {
          const localSnapId = await queueCreateForLater();
          return { id: localSnapId, queued: true };
        }

        // Check subscription limit while online.
        const { subscription } = useAuthStore.getState();
        if (subscription.snap_limit !== -1) {
          try {
            const liveSnapCount = await getCurrentCloudSnapCount(user.id);
            if (liveSnapCount >= subscription.snap_limit) {
              return { error: `You've reached your free limit of ${subscription.snap_limit} snaps. Upgrade to Pro for unlimited snaps!` };
            }
          } catch (error: unknown) {
            if (isOfflineLikeError(error)) {
              const localSnapId = await queueCreateForLater();
              return { id: localSnapId, queued: true };
            }
            return { error: `Unable to verify your snap limit right now: ${toErrorMessage(error)}` };
          }
        }

        set({ status: 'syncing', isOnline: true });

        try {
          let thumbnailUrl: string | undefined;
          if (thumbnail) {
            thumbnailUrl = await uploadThumbnailForUser(user.id, thumbnail);
          }

          const { data, error } = await supabase
            .from('snaps')
            .insert([{
              user_id: user.id,
              title: snap.meta.title || 'Untitled',
              data: snap,
              thumbnail_url: thumbnailUrl,
            }])
            .select('id')
            .single();

          if (error) throw error;

          await get().fetchCloudSnaps();
          await useAuthStore.getState().fetchSubscription();

          set({ status: 'idle', isOnline: true, lastSyncAt: Date.now(), error: undefined });
          return { id: data.id };
        } catch (error: unknown) {
          if (isOfflineLikeError(error)) {
            const localSnapId = await queueCreateForLater();
            return { id: localSnapId, queued: true };
          }

          const message = toErrorMessage(error);
          set({ status: 'error', isOnline: true, error: message });
          toast.error(`Failed to save snap to cloud: ${message}`);
          return { error: message };
        }
      },

      updateCloudSnap: async (id, snap) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          return { error: 'Not authenticated' };
        }

        const queueUpdateForLater = (targetId: string): UpdateCloudResult => {
          const now = Date.now();
          const operation: Extract<PendingSyncOperation, { kind: 'update' }> = {
            id: createOperationId(),
            kind: 'update',
            userId: user.id,
            cloudSnapId: isLocalPendingId(targetId) ? undefined : targetId,
            localSnapId: isLocalPendingId(targetId) ? targetId : undefined,
            snap,
            createdAt: now,
            updatedAt: now,
            attempts: 0,
          };

          const online = isBrowserOnline();
          set((state) => {
            const nextQueue = enqueueUpdateOperation(state.pendingQueue, operation);
            return {
              pendingQueue: nextQueue,
              pendingChanges: nextQueue.length,
              status: online ? 'syncing' : 'offline',
              isOnline: online,
              error: undefined,
            };
          });

          if (!online) {
            notifyOfflineQueue();
          } else {
            void get().flushPendingChanges();
          }

          return { queued: true };
        };

        // Local pending IDs represent cloud create operations waiting to be synced.
        if (isLocalPendingId(id)) {
          return queueUpdateForLater(id);
        }

        if (!isBrowserOnline()) {
          return queueUpdateForLater(id);
        }

        set({ status: 'syncing', isOnline: true });

        try {
          const { data, error } = await supabase
            .from('snaps')
            .update({
              title: snap.meta.title || 'Untitled',
              data: snap,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select('id')
            .maybeSingle();

          if (error) throw error;
          if (!data) {
            throw new Error('Cloud snap introuvable. Sauvegardez comme nouveau snap.');
          }

          await get().fetchCloudSnaps();
          set({ status: 'idle', isOnline: true, lastSyncAt: Date.now(), error: undefined });

          return {};
        } catch (error: unknown) {
          if (isOfflineLikeError(error)) {
            return queueUpdateForLater(id);
          }

          const message = toErrorMessage(error);
          set({ status: 'error', isOnline: true, error: message });
          toast.error(`Failed to update snap: ${message}`);
          return { error: message };
        }
      },

      deleteCloudSnap: async (id) => {
        if (!isBrowserOnline()) {
          set({ status: 'offline', isOnline: false });
          return { error: 'You are offline. Deletion will be available once connection is restored.' };
        }

        try {
          const { error } = await supabase
            .from('snaps')
            .delete()
            .eq('id', id);

          if (error) throw error;

          await get().fetchCloudSnaps();
          await useAuthStore.getState().fetchSubscription();
          toast.success('Snap deleted');

          return {};
        } catch (error: unknown) {
          const message = toErrorMessage(error);
          if (isOfflineLikeError(error)) {
            set({ status: 'offline', isOnline: false });
            return { error: 'You are offline. Deletion will be available once connection is restored.' };
          }
          toast.error(`Failed to delete snap: ${message}`);
          return { error: message };
        }
      },

      loadSnapFromCloud: async (id) => {
        if (!isBrowserOnline()) {
          set({ status: 'offline', isOnline: false });
          return { error: 'You are offline. Unable to load cloud snap.' };
        }

        try {
          const { data, error } = await supabase
            .from('snaps')
            .select('data')
            .eq('id', id)
            .single();

          if (error) throw error;

          return { snap: data.data as Snap };
        } catch (error: unknown) {
          const message = toErrorMessage(error);
          if (isOfflineLikeError(error)) {
            set({ status: 'offline', isOnline: false });
            return { error: 'You are offline. Unable to load cloud snap.' };
          }
          toast.error(`Failed to load snap: ${message}`);
          return { error: message };
        }
      },

      migrateLocalSnaps: async (localSnaps) => {
        const user = useAuthStore.getState().user;
        if (!user || localSnaps.length === 0) {
          return { migratedCount: 0, skippedCount: 0 };
        }

        if (!isBrowserOnline()) {
          set({ status: 'offline', isOnline: false });
          return {
            migratedCount: 0,
            skippedCount: localSnaps.length,
            error: 'You are offline. Local migration will run when connection is restored.',
          };
        }

        set({ status: 'syncing', isOnline: true });
        toast.info(`Migrating ${localSnaps.length} local projects...`);

        try {
          const buildSignature = (item: Snap, titleOverride?: string) => {
            const title = titleOverride ?? item.meta.title ?? 'Untitled';
            return `${title}::${JSON.stringify(item)}`;
          };

          // Deduplicate against existing cloud snaps and duplicates in local batch.
          const { data: existingRows, error: existingRowsError } = await supabase
            .from('snaps')
            .select('title, data')
            .eq('user_id', user.id);

          if (existingRowsError) {
            throw existingRowsError;
          }

          const existingSignatures = new Set<string>(
            ((existingRows ?? []) as Array<{ title: string; data: Snap }>).map((row) => buildSignature(row.data, row.title))
          );

          const uniqueLocalSnaps: Snap[] = [];
          for (const item of localSnaps) {
            const signature = buildSignature(item);
            if (existingSignatures.has(signature)) {
              continue;
            }
            existingSignatures.add(signature);
            uniqueLocalSnaps.push(item);
          }

          if (uniqueLocalSnaps.length === 0) {
            set({ status: 'idle', isOnline: true, lastSyncAt: Date.now(), error: undefined });
            toast.info('No new local projects to migrate.');
            return { migratedCount: 0, skippedCount: localSnaps.length };
          }

          // Upload local snaps while respecting the current plan and existing cloud count.
          const { subscription } = useAuthStore.getState();
          let availableSlots = uniqueLocalSnaps.length;
          if (subscription.snap_limit !== -1) {
            const currentCloudCount = await getCurrentCloudSnapCount(user.id);
            availableSlots = Math.max(0, subscription.snap_limit - currentCloudCount);
          }

          const snapsToMigrate = uniqueLocalSnaps.slice(0, availableSlots);
          if (snapsToMigrate.length === 0) {
            set({ status: 'idle', isOnline: true, lastSyncAt: Date.now(), error: undefined });
            toast.info(`Free plan limit reached (${subscription.snap_limit} snaps). Upgrade to Pro to migrate more projects.`);
            return { migratedCount: 0, skippedCount: localSnaps.length };
          }

          const insertData = snapsToMigrate.map((item) => ({
            user_id: user.id,
            title: item.meta.title || 'Untitled',
            data: item,
          }));

          const { error } = await supabase
            .from('snaps')
            .insert(insertData);

          if (error) throw error;

          await get().fetchCloudSnaps();
          await useAuthStore.getState().fetchSubscription();

          set({ status: 'idle', isOnline: true, lastSyncAt: Date.now(), error: undefined });
          const skippedCount = localSnaps.length - snapsToMigrate.length;
          if (skippedCount > 0) {
            toast.success(`${snapsToMigrate.length} projects migrated (${skippedCount} skipped).`);
          } else {
            toast.success(`${snapsToMigrate.length} projects migrated to cloud`);
          }

          return { migratedCount: snapsToMigrate.length, skippedCount };
        } catch (error: unknown) {
          const message = toErrorMessage(error);
          if (isOfflineLikeError(error)) {
            set({ status: 'offline', isOnline: false, error: undefined });
            return {
              migratedCount: 0,
              skippedCount: localSnaps.length,
              error: 'You are offline. Local migration will run when connection is restored.',
            };
          }
          set({ status: 'error', isOnline: true, error: message });
          toast.error(`Migration failed: ${message}`);
          return { migratedCount: 0, skippedCount: localSnaps.length, error: message };
        }
      },
    }),
    {
      name: SYNC_STORE_STORAGE_KEY,
      partialize: (state) => ({
        pendingQueue: state.pendingQueue,
        pendingChanges: state.pendingQueue.length,
        lastSyncAt: state.lastSyncAt,
      }),
      merge: (persistedState, currentState) => {
        const typedPersisted = persistedState as Partial<SyncStoreState>;
        const pendingQueue = Array.isArray(typedPersisted.pendingQueue) ? typedPersisted.pendingQueue : [];
        return {
          ...currentState,
          ...typedPersisted,
          pendingQueue,
          pendingChanges: pendingQueue.length,
          isOnline: isBrowserOnline(),
          status: isBrowserOnline() ? 'idle' : 'offline',
          error: undefined,
        };
      },
    }
  )
);
