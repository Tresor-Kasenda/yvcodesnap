import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useRecentSnapsStore, formatRelativeTime, type RecentSnapEntry } from '../store/recentSnapsStore';
import { useCanvasStore } from '../store/canvasStore';

interface RecentSnapsDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLElement>;
}

const RecentSnapItem = memo(({
                                 entry,
                                 onOpen,
                                 onDelete
                             }: {
    entry: RecentSnapEntry;
    onOpen: (snap: RecentSnapEntry) => void;
    onDelete: (id: string) => void;
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onOpen(entry)}
        >
            {/* Thumbnail Preview */}
            <div
                className="w-12 h-9 rounded bg-neutral-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0"
                style={{
                    background: entry.snap.background.type === 'gradient'
                        ? `linear-gradient(${entry.snap.background.gradient.angle}deg, ${entry.snap.background.gradient.from}, ${entry.snap.background.gradient.to})`
                        : entry.snap.background.solid.color
                }}
            >
                <span className="text-[8px] text-white/40">{entry.snap.elements.length} el</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="text-sm text-neutral-200 truncate font-medium">{entry.title}</div>
                <div className="text-xs text-neutral-500">{formatRelativeTime(entry.savedAt)}</div>
            </div>

            {/* Actions */}
            {isHovered && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(entry.id);
                    }}
                    className="p-1 rounded hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition-colors"
                    title="Remove from recent"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
});

RecentSnapItem.displayName = 'RecentSnapItem';

const RecentSnapsDropdown: React.FC<RecentSnapsDropdownProps> = ({ isOpen, onClose, anchorRef }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { recentSnaps, removeRecentSnap, clearRecentSnaps } = useRecentSnapsStore();
    const { importSnap, saveToHistory } = useCanvasStore();

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                anchorRef.current &&
                !anchorRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose, anchorRef]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleOpenSnap = useCallback((entry: RecentSnapEntry) => {
        saveToHistory();
        importSnap(JSON.stringify(entry.snap), {
            cloudSnapId: entry.cloudSnapId ?? null,
        });
        onClose();
    }, [importSnap, saveToHistory, onClose]);

    const handleDeleteSnap = useCallback((id: string) => {
        removeRecentSnap(id);
    }, [removeRecentSnap]);

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="absolute left-0 top-full mt-2 w-72 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Recent Projects</span>
                {recentSnaps.length > 0 && (
                    <button
                        onClick={clearRecentSnaps}
                        className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
                    >
                        Clear all
                    </button>
                )}
            </div>

            <div className="max-h-80 overflow-y-auto">
                {recentSnaps.length === 0 ? (
                    <div className="p-6 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                            <svg className="w-6 h-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-sm text-neutral-500">No recent projects</p>
                        <p className="text-xs text-neutral-600 mt-1">Projects you save will appear here</p>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {recentSnaps.map((entry) => (
                            <RecentSnapItem
                                key={entry.id}
                                entry={entry}
                                onOpen={handleOpenSnap}
                                onDelete={handleDeleteSnap}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(RecentSnapsDropdown);
