import { useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useSyncStore } from '../store/syncStore';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

const AUTO_SAVE_DELAY = 10000; // 10 secondes après le dernier changement
const getSnapSignature = (snap: any): string => JSON.stringify(snap);

export function useAutoSync() {
    const snap = useCanvasStore((state) => state.snap);
    const activeCloudSnapId = useCanvasStore((state) => state.activeCloudSnapId);
    const activeCloudSnapSignature = useCanvasStore((state) => state.activeCloudSnapSignature);
    const setCloudSyncState = useCanvasStore((state) => state.setCloudSyncState);

    const { user, subscription } = useAuthStore();
    const { updateCloudSnap, status } = useSyncStore();

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedSignatureRef = useRef<string | null>(null);
    const isSavingRef = useRef(false);

    const performAutoSave = useCallback(async () => {
        if (!user || !activeCloudSnapId || isSavingRef.current) {
            return;
        }

        const currentSignature = getSnapSignature(snap);

        // Ne sauvegarder que si le snap a changé
        if (currentSignature === lastSavedSignatureRef.current ||
            currentSignature === activeCloudSnapSignature) {
            return;
        }

        isSavingRef.current = true;

        try {
            const result = await updateCloudSnap(activeCloudSnapId, snap);

            if (!result.error) {
                lastSavedSignatureRef.current = currentSignature;
                setCloudSyncState(activeCloudSnapId, snap);
                // Pas de toast pour ne pas déranger l'utilisateur
                console.log('✓ Auto-saved to cloud');
            } else {
                console.error('Auto-save failed:', result.error);
                // Seulement notifier en cas d'erreur critique
                if (result.error.includes('introuvable')) {
                    toast.error('Cloud snap not found. Please save as a new snap.');
                    setCloudSyncState(null);
                }
            }
        } catch (error) {
            console.error('Auto-save error:', error);
        } finally {
            isSavingRef.current = false;
        }
    }, [user, activeCloudSnapId, snap, updateCloudSnap, activeCloudSnapSignature, setCloudSyncState]);

    useEffect(() => {
        // Ne synchroniser que si :
        // 1. L'utilisateur est authentifié
        // 2. Il y a un snap cloud actif
        // 3. L'utilisateur est en plan free (snap_limit !== -1)
        // 4. Le snap n'est pas déjà en cours de sauvegarde
        if (!user || !activeCloudSnapId || subscription.snap_limit === -1 || status === 'syncing') {
            return;
        }

        // Annuler le timeout précédent
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Planifier la sauvegarde automatique
        saveTimeoutRef.current = setTimeout(() => {
            performAutoSave();
        }, AUTO_SAVE_DELAY);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [snap, user, activeCloudSnapId, subscription.snap_limit, status, performAutoSave]);

    return {
        isAutoSyncEnabled: Boolean(user && activeCloudSnapId && subscription.snap_limit !== -1),
        isSaving: isSavingRef.current || status === 'syncing',
        activeCloudSnapId,
    };
}
