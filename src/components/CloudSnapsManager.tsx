import { useEffect, useState } from 'react';
import { useSyncStore } from '../store/syncStore';
import { useAuthStore } from '../store/authStore';
import { useCanvasStore } from '../store/canvasStore';
import { Cloud, Trash2, Download, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CloudSnapsManager() {
    const { user } = useAuthStore();
    const { cloudSnaps, fetchCloudSnaps, deleteCloudSnap, loadSnapFromCloud, status } = useSyncStore();
    const { importSnap } = useCanvasStore();
    const [isOpen, setIsOpen] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (user && isOpen) {
            fetchCloudSnaps();
        }
    }, [user, isOpen, fetchCloudSnaps]);

    if (!user) return null;

    const handleLoad = async (id: string) => {
        const result = await loadSnapFromCloud(id);
        if (result.snap) {
            importSnap(JSON.stringify(result.snap), { cloudSnapId: id });
            setIsOpen(false);
            toast.success('Snap loaded from cloud');
        } else {
            toast.error(result.error || 'Failed to load snap');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this snap from cloud? This action cannot be undone.')) {
            setDeleting(id);
            await deleteCloudSnap(id);
            setDeleting(null);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
                <Cloud className="w-5 h-5" />
                <span className="text-sm">Cloud ({cloudSnaps.length})</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-8 max-h-[80vh] overflow-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Cloud Snaps</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {status === 'syncing' && (
                            <div className="flex items-center justify-center py-12">
                                <p className="text-neutral-500">Loading snaps...</p>
                            </div>
                        )}

                        {status !== 'syncing' && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {cloudSnaps.map((snap) => (
                                        <div
                                            key={snap.id}
                                            className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg dark:hover:shadow-blue-500/10 transition-all"
                                        >
                                            {snap.thumbnail_url && (
                                                <img
                                                    src={snap.thumbnail_url}
                                                    alt={snap.title}
                                                    className="w-full h-32 object-cover rounded mb-2 bg-neutral-100 dark:bg-neutral-800"
                                                />
                                            )}
                                            <h3 className="font-semibold mb-2 truncate">{snap.title}</h3>
                                            <p className="text-xs text-neutral-500 mb-3">
                                                {new Date(snap.created_at).toLocaleDateString()}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleLoad(snap.id)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Load
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(snap.id)}
                                                    disabled={deleting === snap.id}
                                                    className="px-3 py-2 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {cloudSnaps.length === 0 && (
                                    <p className="text-center text-neutral-500 py-12">
                                        No cloud snaps yet. Save your first snap to get started!
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
