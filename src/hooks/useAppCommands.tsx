import { useCallback, useMemo } from 'react';
import {
    Hand, Square, Circle, Triangle, Star as StarIcon,
    Minus, ArrowRight, Type, Code, Grid, ZoomIn,
    ZoomOut, Maximize, Copy, Clipboard, Copy as DuplicateIcon,
    CheckSquare, FilePlus, FileText, Download, RotateCcw, RotateCw, Trash2, Image as ImageIcon,
    Layers, Ungroup
} from 'lucide-react';
import { useCanvasStore, createImageElement } from '../store/canvasStore';
import { useRecentSnapsStore } from '../store/recentSnapsStore';
import { toast } from 'sonner';

// Detect platform to use correct shortcut prefix
const isMac = typeof window !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const SHORTCUT_PREFIX = isMac ? 'Cmd' : 'Ctrl';

export interface Command {
    id: string;
    label: string;
    shortcut?: string;
    icon?: React.ReactNode;
    action: () => void;
    group: 'tools' | 'actions' | 'edit' | 'file';
}

export const useAppCommands = () => {
    const {
        snap,
        setTool,
        setShowGrid,
        showGrid,
        setZoom,
        zoom,
        copyToClipboard,
        pasteFromClipboard,
        duplicateElement,
        selectAll,
        undo,
        redo,
        deleteElement,
        newSnap,
        exportSnap,
        importSnap,
        saveToHistory,
        addElement,
        groupSelection,
        ungroupSelection
    } = useCanvasStore();

    const { addRecentSnap } = useRecentSnapsStore();

    // File Operations
    const handleNewSnap = useCallback(() => {
        // Show confirmation toast instead of browser confirm()
        toast.custom(
            (t) => (
                <div className="flex flex-col gap-3">
                    <p className="font-medium">Create a new canvas?</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Unsaved changes will be lost.</p>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => toast.dismiss(t)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (snap.elements.length > 0) {
                                    addRecentSnap(snap);
                                }
                                newSnap({ title: 'Untitled', aspect: '16:9', width: 1920, height: 1080 });
                                toast.dismiss(t);
                                toast.success('New canvas created');
                            }}
                            className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                            Create
                        </button>
                    </div>
                </div>
            ),
            { duration: Infinity }
        );
    }, [snap, addRecentSnap, newSnap]);

    const handleImportFile = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.yvsnap';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                if (snap.elements.length > 0) {
                    addRecentSnap(snap);
                }
                saveToHistory();
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const json = evt.target?.result as string;
                    importSnap(json);
                    toast.success('Project imported');
                };
                reader.onerror = () => {
                    console.error('Failed to read file');
                    toast.error('Failed to import project');
                };
                reader.readAsText(file);
            }
        };
        input.click();
        // Cleanup: Remove input element from DOM to prevent memory leaks
        setTimeout(() => {
            if (input.parentNode) {
                input.parentNode.removeChild(input);
            }
        }, 0);
    }, [snap, addRecentSnap, saveToHistory, importSnap]);

    const handleExportFile = useCallback(() => {
        try {
            const json = exportSnap();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${snap.meta.title || 'canvas'}.yvsnap`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            addRecentSnap(snap);
            toast.success('Project exported');
        } catch (error) {
            console.error(error);
            toast.error('Export failed');
        }
    }, [exportSnap, snap, addRecentSnap]);

    const handleImageUpload = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const src = evt.target?.result as string;
                    const img = new Image();
                    img.onload = () => {
                        const x = (snap.meta.width - img.width) / 2;
                        const y = (snap.meta.height - img.height) / 2;
                        addElement(createImageElement(x, y, src, img.width, img.height));
                        toast.success('Image added');
                    };
                    img.onerror = () => {
                        console.error('Failed to load image');
                        toast.error('Failed to load image');
                    };
                    img.src = src;
                };
                reader.onerror = () => {
                    console.error('Failed to read file');
                    toast.error('Failed to read image file');
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
        // Cleanup: Remove input element from DOM to prevent memory leaks
        setTimeout(() => {
            if (input.parentNode) {
                input.parentNode.removeChild(input);
            }
        }, 0);
    }, [snap.meta, addElement]);

    const commands: Command[] = useMemo(() => [
        // File
        {
            id: 'new',
            label: 'New Canvas',
            shortcut: `${SHORTCUT_PREFIX}+N`,
            icon: <FilePlus className="w-4 h-4" />,
            action: handleNewSnap,
            group: 'file'
        },
        {
            id: 'open',
            label: 'Open File',
            shortcut: `${SHORTCUT_PREFIX}+O`,
            icon: <FileText className="w-4 h-4" />,
            action: handleImportFile,
            group: 'file'
        },
        {
            id: 'save',
            label: 'Save Project',
            shortcut: `${SHORTCUT_PREFIX}+S`,
            icon: <Download className="w-4 h-4" />,
            action: handleExportFile,
            group: 'file'
        },

        // Tools
        { id: 'select', label: 'Hand Tool', shortcut: 'H', icon: <Hand className="w-4 h-4" />, action: () => setTool('select'), group: 'tools' },
        { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: <Square className="w-4 h-4" />, action: () => setTool('rectangle'), group: 'tools' },
        { id: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: <Circle className="w-4 h-4" />, action: () => setTool('ellipse'), group: 'tools' },
        { id: 'polygon', label: 'Polygon', shortcut: 'P', icon: <Triangle className="w-4 h-4" />, action: () => setTool('polygon'), group: 'tools' },
        { id: 'star', label: 'Star', shortcut: 'S', icon: <StarIcon className="w-4 h-4" />, action: () => setTool('star'), group: 'tools' },
        { id: 'line', label: 'Line', shortcut: 'L', icon: <Minus className="w-4 h-4" />, action: () => setTool('line'), group: 'tools' },
        { id: 'arrow', label: 'Arrow', shortcut: 'A', icon: <ArrowRight className="w-4 h-4" />, action: () => setTool('arrow'), group: 'tools' },
        { id: 'text', label: 'Text', shortcut: 'T', icon: <Type className="w-4 h-4" />, action: () => setTool('text'), group: 'tools' },
        { id: 'code', label: 'Code Block', shortcut: 'C', icon: <Code className="w-4 h-4" />, action: () => setTool('code'), group: 'tools' },
        { id: 'image', label: 'Upload Image', shortcut: 'I', icon: <ImageIcon className="w-4 h-4" />, action: handleImageUpload, group: 'tools' },
        { id: 'group', label: 'Group Selection', shortcut: `${SHORTCUT_PREFIX}+G`, icon: <Layers className="w-4 h-4" />, action: groupSelection, group: 'tools' },
        { id: 'ungroup', label: 'Ungroup', shortcut: `${SHORTCUT_PREFIX}+Shift+G`, icon: <Ungroup className="w-4 h-4" />, action: ungroupSelection, group: 'tools' },

        // Edit
        { id: 'undo', label: 'Undo', shortcut: `${SHORTCUT_PREFIX}+Z`, icon: <RotateCcw className="w-4 h-4" />, action: undo, group: 'edit' },
        { id: 'redo', label: 'Redo', shortcut: `${SHORTCUT_PREFIX}+Shift+Z`, icon: <RotateCw className="w-4 h-4" />, action: redo, group: 'edit' },
        { id: 'copy', label: 'Copy', shortcut: `${SHORTCUT_PREFIX}+C`, icon: <Copy className="w-4 h-4" />, action: copyToClipboard, group: 'edit' },
        { id: 'paste', label: 'Paste', shortcut: `${SHORTCUT_PREFIX}+V`, icon: <Clipboard className="w-4 h-4" />, action: pasteFromClipboard, group: 'edit' },
        { id: 'duplicate', label: 'Duplicate', shortcut: `${SHORTCUT_PREFIX}+D`, icon: <DuplicateIcon className="w-4 h-4" />, action: duplicateElement, group: 'edit' },
        { id: 'select-all', label: 'Select All', shortcut: `${SHORTCUT_PREFIX}+A`, icon: <CheckSquare className="w-4 h-4" />, action: selectAll, group: 'edit' },
        { id: 'delete', label: 'Delete', shortcut: 'Del', icon: <Trash2 className="w-4 h-4" />, action: () => deleteElement(), group: 'edit' },

        // Actions
        {
            id: 'toggle-grid',
            label: showGrid ? 'Hide Grid' : 'Show Grid',
            shortcut: `${SHORTCUT_PREFIX}+'`,
            icon: <Grid className="w-4 h-4" />,
            action: () => setShowGrid(!showGrid),
            group: 'actions'
        },
        {
            id: 'zoom-in',
            label: 'Zoom In',
            shortcut: `${SHORTCUT_PREFIX}++`,
            icon: <ZoomIn className="w-4 h-4" />,
            action: () => setZoom(Math.min(zoom + 0.1, 3)),
            group: 'actions'
        },
        {
            id: 'zoom-out',
            label: 'Zoom Out',
            shortcut: `${SHORTCUT_PREFIX}+-`,
            icon: <ZoomOut className="w-4 h-4" />,
            action: () => setZoom(Math.max(zoom - 0.1, 0.1)),
            group: 'actions'
        },
        {
            id: 'reset-zoom',
            label: 'Reset Zoom',
            shortcut: `${SHORTCUT_PREFIX}+0`,
            icon: <Maximize className="w-4 h-4" />,
            action: () => setZoom(1),
            group: 'actions'
        }
    ], [handleNewSnap, handleImportFile, handleExportFile, setTool, groupSelection, ungroupSelection, undo, redo, copyToClipboard, pasteFromClipboard, duplicateElement, selectAll, deleteElement, showGrid, setShowGrid, zoom, setZoom, handleImageUpload]);

    return { commands, handleNewSnap, handleImportFile, handleExportFile };
};
