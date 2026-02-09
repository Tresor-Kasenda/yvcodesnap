import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Snap, CloudSnap, SyncState } from '../types';
import { useAuthStore } from './authStore';
import { toast } from 'sonner';

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

interface SyncStoreState extends SyncState {
  cloudSnaps: CloudSnap[];

  // Actions
  fetchCloudSnaps: () => Promise<void>;
  saveSnapToCloud: (snap: Snap, thumbnail?: Blob) => Promise<{ id?: string; error?: string }>;
  updateCloudSnap: (id: string, snap: Snap) => Promise<{ error?: string }>;
  deleteCloudSnap: (id: string) => Promise<{ error?: string }>;
  loadSnapFromCloud: (id: string) => Promise<{ snap?: Snap; error?: string }>;

  // Migration
  migrateLocalSnaps: (localSnaps: Snap[]) => Promise<{ migratedCount: number; skippedCount: number; error?: string }>;

  // Sync status
  setStatus: (status: SyncState['status']) => void;
}

export const useSyncStore = create<SyncStoreState>((set, get) => ({
  status: 'idle',
  cloudSnaps: [],
  lastSyncAt: undefined,
  pendingChanges: 0,
  error: undefined,

  setStatus: (status) => set({ status }),

  fetchCloudSnaps: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ status: 'syncing' });

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
        lastSyncAt: Date.now(),
        error: undefined,
      });
    } catch (error: any) {
      set({ status: 'error', error: error.message });
      toast.error('Failed to fetch cloud snaps');
    }
  },

  saveSnapToCloud: async (snap, thumbnail) => {
    const user = useAuthStore.getState().user;
    if (!user) return { error: 'Not authenticated' };

    // Check subscription limit
    const { subscription } = useAuthStore.getState();
    if (subscription.snap_limit !== -1) {
      try {
        const liveSnapCount = await getCurrentCloudSnapCount(user.id);
        if (liveSnapCount >= subscription.snap_limit) {
          return { error: `You've reached your free limit of ${subscription.snap_limit} snaps. Upgrade to Pro for unlimited snaps!` };
        }
      } catch (error: any) {
        return { error: `Unable to verify your snap limit right now: ${error.message}` };
      }
    }

    set({ status: 'syncing' });

    try {
      let thumbnail_url: string | undefined;

      // Upload thumbnail if provided
      if (thumbnail) {
        const fileName = `${user.id}/thumbnails/${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('snapshots')
          .upload(fileName, thumbnail, {
            contentType: 'image/png',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('snapshots')
          .getPublicUrl(uploadData.path);

        thumbnail_url = publicUrl;
      }

      // Insert snap
      const { data, error } = await supabase
        .from('snaps')
        .insert([{
          user_id: user.id,
          title: snap.meta.title || 'Untitled',
          data: snap,
          thumbnail_url,
        }])
        .select()
        .single();

      if (error) throw error;

      // Refresh cloud snaps
      await get().fetchCloudSnaps();

      // Update subscription count
      await useAuthStore.getState().fetchSubscription();

      set({ status: 'idle', lastSyncAt: Date.now(), error: undefined });
      toast.success('Snap saved to cloud');

      return { id: data.id };
    } catch (error: any) {
      set({ status: 'error', error: error.message });
      toast.error('Failed to save snap to cloud: ' + error.message);
      return { error: error.message };
    }
  },

  updateCloudSnap: async (id, snap) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      return { error: 'Not authenticated' };
    }

    set({ status: 'syncing' });

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
      set({ status: 'idle', lastSyncAt: Date.now(), error: undefined });
      toast.success('Snap updated');

      return {};
    } catch (error: any) {
      set({ status: 'error', error: error.message });
      toast.error('Failed to update snap: ' + error.message);
      return { error: error.message };
    }
  },

  deleteCloudSnap: async (id) => {
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
    } catch (error: any) {
      toast.error('Failed to delete snap: ' + error.message);
      return { error: error.message };
    }
  },

  loadSnapFromCloud: async (id) => {
    try {
      const { data, error } = await supabase
        .from('snaps')
        .select('data')
        .eq('id', id)
        .single();

      if (error) throw error;

      return { snap: data.data as Snap };
    } catch (error: any) {
      toast.error('Failed to load snap: ' + error.message);
      return { error: error.message };
    }
  },

  migrateLocalSnaps: async (localSnaps) => {
    const user = useAuthStore.getState().user;
    if (!user || localSnaps.length === 0) {
      return { migratedCount: 0, skippedCount: 0 };
    }

    set({ status: 'syncing' });
    toast.info(`Migrating ${localSnaps.length} local projects...`);

    try {
      const buildSignature = (snap: Snap, titleOverride?: string) => {
        const title = titleOverride ?? snap.meta.title ?? 'Untitled';
        return `${title}::${JSON.stringify(snap)}`;
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
      for (const snap of localSnaps) {
        const signature = buildSignature(snap);
        if (existingSignatures.has(signature)) {
          continue;
        }
        existingSignatures.add(signature);
        uniqueLocalSnaps.push(snap);
      }

      if (uniqueLocalSnaps.length === 0) {
        set({ status: 'idle', lastSyncAt: Date.now(), error: undefined });
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
        set({ status: 'idle', lastSyncAt: Date.now(), error: undefined });
        toast.info(`Free plan limit reached (${subscription.snap_limit} snaps). Upgrade to Pro to migrate more projects.`);
        return { migratedCount: 0, skippedCount: localSnaps.length };
      }

      const insertData = snapsToMigrate.map(snap => ({
        user_id: user.id,
        title: snap.meta.title || 'Untitled',
        data: snap,
      }));

      const { error } = await supabase
        .from('snaps')
        .insert(insertData);

      if (error) throw error;

      await get().fetchCloudSnaps();
      await useAuthStore.getState().fetchSubscription();

      set({ status: 'idle', lastSyncAt: Date.now(), error: undefined });
      const skippedCount = localSnaps.length - snapsToMigrate.length;
      if (skippedCount > 0) {
        toast.success(`${snapsToMigrate.length} projects migrated (${skippedCount} skipped).`);
      } else {
        toast.success(`${snapsToMigrate.length} projects migrated to cloud`);
      }

      return { migratedCount: snapsToMigrate.length, skippedCount };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown migration error';
      set({ status: 'error', error: message });
      toast.error('Migration failed: ' + message);
      return { migratedCount: 0, skippedCount: localSnaps.length, error: message };
    }
  },
}));
