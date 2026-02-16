import React, { memo, useMemo, useCallback, useRef, useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import type { CanvasElement, GroupElement, ShapeElement } from '../types';
import { findElementById } from '../utils/elementTree';

const isGroupElement = (element: CanvasElement): element is GroupElement => element.type === 'group';

// Shared label helper so both layer items and footer rename can use it
const getElementLabel = (element: CanvasElement): string => {
    if (element.name && element.name.trim()) return element.name.trim();
    switch (element.type) {
        case 'code':
            return 'Code Block';
        case 'text':
            return element.props.text.slice(0, 20) + (element.props.text.length > 20 ? '...' : '');
        case 'arrow':
            return 'Arrow';
        case 'group':
            return `Group (${element.elements.length})`;
        case 'shape': {
            const kind = (element as ShapeElement).props.kind;
            switch (kind) {
                case 'rectangle':
                    return 'Rectangle';
                case 'ellipse':
                    return 'Ellipse';
                case 'line':
                    return 'Line';
                case 'polygon':
                    return 'Polygon';
                case 'star':
                    return 'Star';
                default:
                    return 'Shape';
            }
        }
        default:
            return 'Element';
    }
};

// Memoized layer item component for performance
const LayerItem = memo(({
                            element,
                            isSelected,
                            onSelect,
                            onToggleLock,
                            onToggleVisibility,
                            depth = 0,
                            canExpand = false,
                            isExpanded = false,
                            onToggleExpand,
                            showActions = true,
                        }: {
    element: CanvasElement;
    isSelected: boolean;
    onSelect: (event: React.MouseEvent<HTMLDivElement>) => void;
    onToggleLock?: () => void;
    onToggleVisibility?: () => void;
    depth?: number;
    canExpand?: boolean;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    showActions?: boolean;
}) => {
    const rowIndent = 8 + depth * 12;

    const getElementIcon = (element: CanvasElement) => {
        switch (element.type) {
            case 'code':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                );
            case 'text':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                    </svg>
                );
            case 'arrow':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                );
            case 'group':
                return (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
                    </svg>
                );
            case 'shape': {
                const kind = (element as ShapeElement).props.kind;
                switch (kind) {
                    case 'rectangle':
                        return (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="4" y="6" width="16" height="12" rx="2" />
                            </svg>
                        );
                    case 'ellipse':
                        return (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <ellipse cx="12" cy="12" rx="8" ry="6" />
                            </svg>
                        );
                    case 'line':
                        return (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 19 19 5" strokeLinecap="round" />
                            </svg>
                        );
                    case 'polygon':
                        return (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 3 21 9v6l-9 6-9-6V9z" />
                            </svg>
                        );
                    case 'star':
                        return (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="m12 3 2.6 6h6.4l-5.2 4.1 2 6.1L12 16.5l-5.8 2.7 2-6.1L3 9h6.4Z" />
                            </svg>
                        );
                    default:
                        return null;
                }
            }
            default:
                return null;
        }
    };

    return (
        <div
            onClick={onSelect}
            style={{ paddingLeft: `${rowIndent}px`, paddingRight: '8px' }}
            className={`group flex items-center gap-1.5 py-1.5 rounded-md cursor-pointer transition-all ${isSelected
                ? 'bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/50'
                : 'hover:bg-neutral-100 dark:hover:bg-white/5 border border-transparent'
            }`}
        >
            {canExpand ? (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand?.();
                    }}
                    className="shrink-0 p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 transition-colors"
                    title={isExpanded ? 'Collapse group' : 'Expand group'}
                    aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
                >
                    <svg
                        className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            ) : (
                depth > 0 ? <span className="w-3.5 h-3.5 shrink-0" /> : null
            )}

            {/* Element type icon */}
            <div className={`shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-neutral-400'}`}>
                {getElementIcon(element)}
            </div>

            {/* Element name */}
            <span className={`flex-1 text-[11px] truncate ${isSelected ? 'text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'
            } ${!element.visible ? 'opacity-50' : ''}`}>
        {getElementLabel(element)}
      </span>

            {/* Action buttons */}
            {showActions && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Lock toggle */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleLock?.();
                        }}
                        className={`p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors ${element.locked ? 'text-yellow-600 dark:text-yellow-400' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }`}
                        title={element.locked ? 'Unlock' : 'Lock'}
                    >
                        {element.locked ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>

                    {/* Visibility toggle */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility?.();
                        }}
                        className={`p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors ${element.visible ? 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300' : 'text-red-500 dark:text-red-400'
                        }`}
                        title={element.visible ? 'Hide' : 'Show'}
                    >
                        {element.visible ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
});

LayerItem.displayName = 'LayerItem';

const LayersPanel: React.FC = () => {
    const {
        snap,
        selectedElementIds,
        setSelectedElementIds,
        setTool,
        updateElement,
        moveElementUp,
        moveElementDown,
        deleteElement,
    } = useCanvasStore();
    const lastSelectedIdRef = useRef<string | null>(null);
    const [expandedGroupIds, setExpandedGroupIds] = useState<Record<string, boolean>>({});

    const elements = useMemo(() => [...snap.elements].reverse(), [snap.elements]); // Show top layers first

    const handleToggleLock = useCallback((id: string, locked: boolean) => {
        updateElement(id, { locked: !locked });
    }, [updateElement]);

    const handleToggleVisibility = useCallback((id: string, visible: boolean) => {
        updateElement(id, { visible: !visible });
    }, [updateElement]);

    const handleMoveUp = useCallback(() => {
        selectedElementIds.forEach(id => moveElementUp(id));
    }, [selectedElementIds, moveElementUp]);

    const handleMoveDown = useCallback(() => {
        selectedElementIds.forEach(id => moveElementDown(id));
    }, [selectedElementIds, moveElementDown]);

    const handleDelete = useCallback(() => {
        if (selectedElementIds.length > 0) {
            deleteElement();
        }
    }, [selectedElementIds, deleteElement]);

    const selectedElement = useMemo(
        () => (selectedElementIds.length === 1 ? findElementById(snap.elements, selectedElementIds[0]) : null),
        [snap.elements, selectedElementIds]
    );

    const handleLayerSelect = useCallback(
        (event: React.MouseEvent<HTMLDivElement>, id: string) => {
            setTool('select');

            const isRangeSelection = event.shiftKey;
            const isToggleSelection = event.metaKey || event.ctrlKey;
            const orderedIds = elements.map((element) => element.id);

            if (isRangeSelection) {
                const fallbackAnchor = selectedElementIds[selectedElementIds.length - 1] ?? id;
                const anchorId = lastSelectedIdRef.current ?? fallbackAnchor;
                const anchorIndex = orderedIds.indexOf(anchorId);
                const currentIndex = orderedIds.indexOf(id);

                if (anchorIndex === -1 || currentIndex === -1) {
                    setSelectedElementIds([id]);
                    lastSelectedIdRef.current = id;
                    return;
                }

                const start = Math.min(anchorIndex, currentIndex);
                const end = Math.max(anchorIndex, currentIndex);
                const rangeIds = orderedIds.slice(start, end + 1);
                const nextIds = isToggleSelection
                    ? Array.from(new Set([...selectedElementIds, ...rangeIds]))
                    : rangeIds;

                setSelectedElementIds(nextIds);
                lastSelectedIdRef.current = id;
                return;
            }

            if (isToggleSelection) {
                const nextIds = selectedElementIds.includes(id)
                    ? selectedElementIds.filter((selectedId) => selectedId !== id)
                    : [...selectedElementIds, id];

                setSelectedElementIds(nextIds);
                lastSelectedIdRef.current = id;
                return;
            }

            setSelectedElementIds([id]);
            lastSelectedIdRef.current = id;
        },
        [elements, selectedElementIds, setSelectedElementIds, setTool]
    );

    const handleToggleGroupExpanded = useCallback((id: string) => {
        setExpandedGroupIds((previous) => ({
            ...previous,
            [id]: !(previous[id] ?? true),
        }));
    }, []);

    const renderLayerNode = useCallback(
        (element: CanvasElement, depth = 0, selectableId = element.id): React.ReactNode => {
            const isGroup = isGroupElement(element);
            const hasChildren = isGroup && element.elements.length > 0;
            const isExpanded = hasChildren ? (expandedGroupIds[element.id] ?? true) : false;

            return (
                <React.Fragment key={`${element.id}-${depth}`}>
                    <LayerItem
                        element={element}
                        depth={depth}
                        isSelected={selectedElementIds.includes(selectableId)}
                        onSelect={(event) => handleLayerSelect(event, selectableId)}
                        onToggleLock={() => handleToggleLock(element.id, element.locked)}
                        onToggleVisibility={() => handleToggleVisibility(element.id, element.visible)}
                        canExpand={hasChildren}
                        isExpanded={isExpanded}
                        onToggleExpand={hasChildren ? () => handleToggleGroupExpanded(element.id) : undefined}
                        showActions
                    />
                    {hasChildren && isExpanded && (
                        <div className="space-y-1">
                            {[...element.elements].reverse().map((child) =>
                                renderLayerNode(child, depth + 1, child.id)
                            )}
                        </div>
                    )}
                </React.Fragment>
            );
        },
        [
            expandedGroupIds,
            selectedElementIds,
            handleLayerSelect,
            handleToggleLock,
            handleToggleVisibility,
            handleToggleGroupExpanded,
        ]
    );

    return (
        <div className="w-64 sm:w-56 bg-white dark:bg-[#09090b] border-r border-neutral-200 dark:border-white/5 flex flex-col h-full shadow-2xl md:shadow-none">
            <div className="p-2 sm:p-2.5 border-b border-neutral-200 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-neutral-900 dark:text-white font-semibold text-[10px] uppercase tracking-wider">Layers</h3>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{elements.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 overscroll-contain">
                {elements.length === 0 ? (
                    <div className="text-neutral-400 dark:text-neutral-500 text-[10px] text-center py-6">
                        No elements yet.
                        <br />
                        Click on the canvas to add elements.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {elements.map((element) => renderLayerNode(element))}
                    </div>
                )}
            </div>

            {/* Layer actions footer */}
            {selectedElement && (
                <div className="p-1.5 sm:p-2 border-t border-neutral-200 dark:border-white/5 space-y-1.5 sm:space-y-2 bg-neutral-50 dark:bg-[#09090b]/80 backdrop-blur-sm">
                    <input
                        type="text"
                        value={selectedElement.name ?? getElementLabel(selectedElement)}
                        onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-[10px] text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500/60 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                        placeholder="Layer name"
                    />
                    <div className="flex items-center justify-between gap-1.5">
                        <div className="flex gap-1">
                            <button
                                onClick={handleMoveDown}
                                className="p-1.5 sm:p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors active:scale-95"
                                title="Move Down (Back)"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            </button>
                            <button
                                onClick={handleMoveUp}
                                className="p-1.5 sm:p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors active:scale-95"
                                title="Move Up (Front)"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                            </button>
                        </div>
                        <button
                            onClick={handleDelete}
                            className="p-1.5 sm:p-1 rounded-md hover:bg-red-500/10 text-neutral-600 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors active:scale-95"
                            title="Delete"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(LayersPanel);
