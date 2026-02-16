import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
    elementExistsById,
    findElementById,
    removeElementsByIds,
    updateElementById,
} from '../utils/elementTree';
import type {
    Snap,
    CanvasElement,
    CodeElement,
    TextElement,
    ArrowElement,
    Background,
    CanvasMeta,
    Shadow,
    ShapeElement,
    ShapeKind,
    ImageElement,
    GroupElement,
} from '../types';

interface HistoryState {
    past: Snap[];
    future: Snap[];
}

export type ToolId = 'select' | 'code' | 'text' | 'image' | 'arrow' | 'rectangle' | 'ellipse' | 'line' | 'polygon' | 'star';
export type LineEndpoint = 'start' | 'end';

interface CanvasState {
    snap: Snap;
    activeCloudSnapId: string | null;
    activeCloudSnapSignature: string | null;
    selectedElementIds: string[];
    lineEndpointSelection: { elementId: string; endpoint: LineEndpoint } | null;
    arrowEndpointSelection: { elementId: string; endpoint: LineEndpoint } | null;
    zoom: number;
    showGrid: boolean;
    tool: ToolId;
    clipboard: CanvasElement[] | null;
    history: HistoryState;
    contextMenu: {
        isOpen: boolean;
        x: number;
        y: number;
        canvasX: number;
        canvasY: number;
        targetId: string | null;
    };

    // Actions
    setSnap: (snap: Snap) => void;
    setCloudSyncState: (id: string | null, snap?: Snap) => void;
    updateMeta: (meta: Partial<CanvasMeta>) => void;
    setBackground: (background: Partial<Background>) => void;

    addElement: (element: CanvasElement) => void;
    updateElement: (id: string, updates: Partial<CanvasElement>) => void;
    deleteElement: (id?: string) => void;
    duplicateElement: (id?: string) => void;

    selectElement: (id: string | null, multi?: boolean) => void;
    setSelectedElementIds: (ids: string[]) => void;
    setLineEndpointSelection: (elementId: string | null, endpoint?: LineEndpoint) => void;
    setArrowEndpointSelection: (elementId: string | null, endpoint?: LineEndpoint) => void;
    selectAll: () => void;
    setZoom: (zoom: number) => void;
    setShowGrid: (show: boolean) => void;
    setTool: (tool: ToolId) => void;

    moveElementUp: (id: string) => void;
    moveElementDown: (id: string) => void;
    bringToFront: () => void;
    sendToBack: () => void;

    undo: () => void;
    redo: () => void;
    saveToHistory: () => void;
    copyToClipboard: () => void;
    pasteFromClipboard: (x?: number, y?: number) => void;

    newSnap: (meta: CanvasMeta) => void;
    exportSnap: () => string;
    importSnap: (json: string, options?: { cloudSnapId?: string | null }) => void;
    groupSelection: () => void;
    ungroupSelection: () => void;
    alignSelection: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
    distributeSelection: (direction: 'horizontal' | 'vertical') => void;
    applyPreset: (preset: { background: Partial<Background>; shadow?: Shadow; cornerRadius?: number }) => void;
    setContextMenu: (contextMenu: Partial<CanvasState['contextMenu']>) => void;
}

const MAX_PERSISTED_AVATAR_LENGTH = 350000;
const getSnapSignature = (snap: Snap): string => JSON.stringify(snap);

const defaultSnap: Snap = {
    version: '1.0.0',
    meta: {
        title: 'Untitled',
        aspect: '16:9',
        width: 1920,
        height: 1080,
    },
    background: {
        type: 'gradient',
        solid: { color: '#101022' },
        gradient: { from: '#101022', to: '#1f1f3a', angle: 135 },
        brandStrip: {
            enabled: false,
            position: 'bottom',
            height: 60,
            color: '#000000',
            text: '',
            textColor: '#ffffff',
            fontSize: 16,
            fontFamily: 'Inter',
        },
        branding: {
            enabled: false,
            position: 'bottom-right',
            name: '',
            website: '',
            social: {},
            avatarUrl: '',
            showName: true,
            showWebsite: true,
            showSocial: true,
            showAvatar: false,
            fontSize: 14,
            fontFamily: 'Inter',
            color: '#ffffff',
            opacity: 0.8,
            padding: 24,
            socialIconSize: 20,
            socialLayout: 'horizontal',
            avatarSize: 56,
        },
    },
    elements: [],
};

const getElementBBox = (el: CanvasElement) => {
    if (el.type === 'arrow' || (el.type === 'shape' && (el as ShapeElement).props.kind === 'line' && (el as ShapeElement).points)) {
        const pts = (el as any).points || [];
        if (pts.length === 0) return { x: el.x, y: el.y, width: 0, height: 0 };
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        pts.forEach((p: any) => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    const width = (el as any).width || 0;
    const height = (el as any).height || 0;
    return { x: el.x, y: el.y, width, height };
};

export const useCanvasStore = create<CanvasState>()(
    persist(
        immer((set, get) => ({
            snap: defaultSnap,
            activeCloudSnapId: null,
            activeCloudSnapSignature: null,
            selectedElementIds: [],
            lineEndpointSelection: null,
            arrowEndpointSelection: null,
            zoom: 0.5,
            showGrid: false,
            tool: 'select',
            clipboard: null,
            history: { past: [], future: [] },
            contextMenu: {
                isOpen: false,
                x: 0,
                y: 0,
                canvasX: 0,
                canvasY: 0,
                targetId: null,
            },

            setSnap: (snap) => set((state) => {
                state.snap = snap;
                state.activeCloudSnapId = null;
                state.activeCloudSnapSignature = null;
                state.selectedElementIds = [];
                state.lineEndpointSelection = null;
                state.arrowEndpointSelection = null;
            }),

            setCloudSyncState: (id, snapToSync) => set((state) => {
                state.activeCloudSnapId = id;
                state.activeCloudSnapSignature = id ? getSnapSignature(snapToSync ?? state.snap) : null;
            }),

            updateMeta: (meta) => set((state) => {
                state.snap.meta = { ...state.snap.meta, ...meta };
            }),

            setBackground: (background) => set((state) => {
                state.snap.background = { ...state.snap.background, ...background };
            }),

            addElement: (element) => set((state) => {
                get().saveToHistory();
                state.snap.elements.push(element);
                state.selectedElementIds = [element.id];
                state.lineEndpointSelection =
                    element.type === 'shape' && element.props.kind === 'line'
                        ? { elementId: element.id, endpoint: 'end' }
                        : null;
                state.arrowEndpointSelection =
                    element.type === 'arrow'
                        ? { elementId: element.id, endpoint: 'end' }
                        : null;
            }),

            updateElement: (id, updates) => set((state) => {
                if (elementExistsById(state.snap.elements, id)) {
                    // record history before mutating
                    state.history.past.push(JSON.parse(JSON.stringify(state.snap)));
                    state.history.future = [];
                    if (state.history.past.length > 50) state.history.past.shift();

                    updateElementById(state.snap.elements, id, updates);
                }
            }),

            deleteElement: (id) => set((state) => {
                const idsToDelete = id ? [id] : state.selectedElementIds;
                if (idsToDelete.length === 0) return;

                const idsSet = new Set(idsToDelete);
                const hasAnyTarget = idsToDelete.some((targetId) =>
                    elementExistsById(state.snap.elements, targetId)
                );

                if (!hasAnyTarget) return;

                get().saveToHistory();
                removeElementsByIds(state.snap.elements, idsSet);
                state.selectedElementIds = state.selectedElementIds.filter((selectedId) =>
                    elementExistsById(state.snap.elements, selectedId)
                );
                if (
                    state.lineEndpointSelection &&
                    idsToDelete.includes(state.lineEndpointSelection.elementId)
                ) {
                    state.lineEndpointSelection = null;
                }
                if (
                    state.arrowEndpointSelection &&
                    idsToDelete.includes(state.arrowEndpointSelection.elementId)
                ) {
                    state.arrowEndpointSelection = null;
                }
            }),

            duplicateElement: (id) => set((state) => {
                const idsToDuplicate = id ? [id] : state.selectedElementIds;
                if (idsToDuplicate.length === 0) return;

                get().saveToHistory();
                const newIds: string[] = [];

                idsToDuplicate.forEach((targetId) => {
                    const element = state.snap.elements.find((el) => el.id === targetId);
                    if (element) {
                        const newElement = {
                            ...JSON.parse(JSON.stringify(element)),
                            id: uuidv4(),
                            x: element.x + 20,
                            y: element.y + 20,
                        };

                        // Ensure width and height are present for text elements, if they were somehow missing
                        if (newElement.type === 'text') {
                            newElement.width = (newElement as TextElement).width || 200; // Default width for text
                            newElement.height = (newElement as TextElement).height || 40; // Default height for text
                        }

                        state.snap.elements.push(newElement);
                        newIds.push(newElement.id);
                    }
                });

                state.selectedElementIds = newIds;
                state.lineEndpointSelection = null;
                state.arrowEndpointSelection = null;
            }),

            selectElement: (id, multi = false) => set((state) => {
                if (id === null) {
                    if (!multi) {
                        state.selectedElementIds = [];
                        state.lineEndpointSelection = null;
                        state.arrowEndpointSelection = null;
                    }
                    return;
                }

                if (!elementExistsById(state.snap.elements, id)) {
                    return;
                }

                if (multi) {
                    if (state.selectedElementIds.includes(id)) {
                        state.selectedElementIds = state.selectedElementIds.filter((selId) => selId !== id);
                    } else {
                        state.selectedElementIds.push(id);
                    }
                } else {
                    state.selectedElementIds = [id];
                    if (state.lineEndpointSelection?.elementId !== id) {
                        state.lineEndpointSelection = null;
                    }
                    if (state.arrowEndpointSelection?.elementId !== id) {
                        state.arrowEndpointSelection = null;
                    }
                }

                if (state.selectedElementIds.length !== 1) {
                    state.lineEndpointSelection = null;
                    state.arrowEndpointSelection = null;
                }
            }),

            setSelectedElementIds: (ids) => set((state) => {
                const uniqueIds = Array.from(new Set(ids));
                state.selectedElementIds = uniqueIds.filter((id) =>
                    elementExistsById(state.snap.elements, id)
                );
                if (state.selectedElementIds.length !== 1) {
                    state.lineEndpointSelection = null;
                    state.arrowEndpointSelection = null;
                } else if (state.lineEndpointSelection?.elementId !== state.selectedElementIds[0]) {
                    state.lineEndpointSelection = null;
                }
                if (state.selectedElementIds.length !== 1) {
                    state.arrowEndpointSelection = null;
                } else if (state.arrowEndpointSelection?.elementId !== state.selectedElementIds[0]) {
                    state.arrowEndpointSelection = null;
                }
            }),

            setLineEndpointSelection: (elementId, endpoint = 'end') => set((state) => {
                if (!elementId) {
                    state.lineEndpointSelection = null;
                    return;
                }

                const element = findElementById(state.snap.elements, elementId);
                if (!element || element.type !== 'shape' || element.props.kind !== 'line') {
                    state.lineEndpointSelection = null;
                    return;
                }

                state.lineEndpointSelection = { elementId, endpoint };
            }),

            setArrowEndpointSelection: (elementId, endpoint = 'end') => set((state) => {
                if (!elementId) {
                    state.arrowEndpointSelection = null;
                    return;
                }

                const element = findElementById(state.snap.elements, elementId);
                if (!element || element.type !== 'arrow') {
                    state.arrowEndpointSelection = null;
                    return;
                }

                state.arrowEndpointSelection = { elementId, endpoint };
            }),

            selectAll: () => set((state) => {
                state.selectedElementIds = state.snap.elements.map((el) => el.id);
                state.lineEndpointSelection = null;
                state.arrowEndpointSelection = null;
            }),

            setZoom: (zoom) => set((state) => {
                state.zoom = Math.max(0.25, Math.min(256, zoom));
            }),

            setShowGrid: (show) => set((state) => {
                state.showGrid = show;
            }),

            setTool: (tool) => set((state) => {
                state.tool = tool;
            }),

            moveElementUp: (id) => set((state) => {
                const index = state.snap.elements.findIndex((el) => el.id === id);
                if (index < state.snap.elements.length - 1) {
                    const temp = state.snap.elements[index];
                    state.snap.elements[index] = state.snap.elements[index + 1];
                    state.snap.elements[index + 1] = temp;
                }
            }),

            moveElementDown: (id) => set((state) => {
                const index = state.snap.elements.findIndex((el) => el.id === id);
                if (index > 0) {
                    const temp = state.snap.elements[index];
                    state.snap.elements[index] = state.snap.elements[index - 1];
                    state.snap.elements[index - 1] = temp;
                }
            }),

            bringToFront: () => set((state) => {
                const selectedIds = state.selectedElementIds;
                if (selectedIds.length === 0) return;

                get().saveToHistory();

                const selectedElements = state.snap.elements.filter(el => selectedIds.includes(el.id));
                const remainingElements = state.snap.elements.filter(el => !selectedIds.includes(el.id));
                state.snap.elements = [...remainingElements, ...selectedElements];
            }),

            sendToBack: () => set((state) => {
                const selectedIds = state.selectedElementIds;
                if (selectedIds.length === 0) return;

                get().saveToHistory();

                const selectedElements = state.snap.elements.filter(el => selectedIds.includes(el.id));
                const remainingElements = state.snap.elements.filter(el => !selectedIds.includes(el.id));
                state.snap.elements = [...selectedElements, ...remainingElements];
            }),

            saveToHistory: () => set((state) => {
                state.history.past.push(JSON.parse(JSON.stringify(state.snap)));
                state.history.future = [];
                if (state.history.past.length > 50) {
                    state.history.past.shift();
                }
            }),

            undo: () => set((state) => {
                if (state.history.past.length > 0) {
                    const previous = state.history.past.pop()!;
                    state.history.future.push(JSON.parse(JSON.stringify(state.snap)));
                    state.snap = previous;
                    state.selectedElementIds = [];
                    state.lineEndpointSelection = null;
                    state.arrowEndpointSelection = null;
                }
            }),

            redo: () => set((state) => {
                if (state.history.future.length > 0) {
                    const next = state.history.future.pop()!;
                    state.history.past.push(JSON.parse(JSON.stringify(state.snap)));
                    state.snap = next;
                    state.selectedElementIds = [];
                    state.lineEndpointSelection = null;
                    state.arrowEndpointSelection = null;
                }
            }),

            copyToClipboard: () => set((state) => {
                if (state.selectedElementIds.length > 0) {
                    state.clipboard = state.snap.elements.filter((el) => state.selectedElementIds.includes(el.id));
                }
            }),

            pasteFromClipboard: (x, y) => set((state) => {
                if (state.clipboard && state.clipboard.length > 0) {
                    get().saveToHistory();
                    const newIds: string[] = [];

                    let offsetX = 20;
                    let offsetY = 20;

                    if (x !== undefined && y !== undefined) {
                        // Find min x and min y from clipboard items to calculate offset properly
                        let minX = Infinity;
                        let minY = Infinity;

                        state.clipboard.forEach(el => {
                            if (el.x < minX) minX = el.x;
                            if (el.y < minY) minY = el.y;
                        });

                        // If it's a single element, we use its coordinate to calculate absolute shift to x,y
                        // If it's a bunch of elements, they stay relative but the group top-left moves to x,y
                        offsetX = x - minX;
                        offsetY = y - minY;
                    }

                    state.clipboard.forEach((clipElement) => {
                        const newElement = {
                            ...JSON.parse(JSON.stringify(clipElement)),
                            id: uuidv4(),
                            x: clipElement.x + offsetX,
                            y: clipElement.y + offsetY,
                        };

                        // Ensure width and height are present for text elements
                        if (newElement.type === 'text') {
                            newElement.width = (newElement as TextElement).width || 200;
                            newElement.height = (newElement as TextElement).height || 40;
                        }

                        state.snap.elements.push(newElement);
                        newIds.push(newElement.id);
                    });

                    state.selectedElementIds = newIds;
                    state.lineEndpointSelection = null;
                    state.arrowEndpointSelection = null;
                }
            }),

            newSnap: (meta) => set((state) => {
                state.snap = {
                    ...defaultSnap,
                    meta: { ...defaultSnap.meta, ...meta },
                };
                state.activeCloudSnapId = null;
                state.activeCloudSnapSignature = null;
                state.selectedElementIds = [];
                state.lineEndpointSelection = null;
                state.arrowEndpointSelection = null;
                state.history = { past: [], future: [] };
            }),

            exportSnap: () => {
                return JSON.stringify(get().snap, null, 2);
            },

            importSnap: (json, options) => {
                try {
                    const snap = JSON.parse(json) as Snap;
                    const cloudSnapId = options?.cloudSnapId ?? null;
                    set((state) => {
                        state.snap = snap;
                        state.activeCloudSnapId = cloudSnapId;
                        state.activeCloudSnapSignature = cloudSnapId ? getSnapSignature(snap) : null;
                        state.selectedElementIds = [];
                        state.lineEndpointSelection = null;
                        state.arrowEndpointSelection = null;
                        state.history = { past: [], future: [] };
                    });
                } catch (e) {
                    console.error('Failed to import snap:', e);
                }
            },

            groupSelection: () => set((state) => {
                const selectedIds = state.selectedElementIds;
                if (selectedIds.length < 2) return;

                get().saveToHistory();

                // Find elements to group
                const groupElements = state.snap.elements.filter((el) => selectedIds.includes(el.id));

                // Remove from main list
                state.snap.elements = state.snap.elements.filter((el) => !selectedIds.includes(el.id));

                // Calculate bounding box of the selection
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                groupElements.forEach(el => {
                    let elWidth = 0;
                    let elHeight = 0;

                    if (el.type === 'code' || el.type === 'image' || el.type === 'group') {
                        elWidth = (el as any).width || 0;
                        elHeight = (el as any).height || 0;
                        minX = Math.min(minX, el.x);
                        minY = Math.min(minY, el.y);
                        maxX = Math.max(maxX, el.x + elWidth);
                        maxY = Math.max(maxY, el.y + elHeight);
                    } else if (el.type === 'text') {
                        elWidth = (el as any).width || 200;
                        elHeight = (el as any).height || 40;
                        minX = Math.min(minX, el.x);
                        minY = Math.min(minY, el.y);
                        maxX = Math.max(maxX, el.x + elWidth);
                        maxY = Math.max(maxY, el.y + elHeight);
                    } else if (el.type === 'arrow' || (el.type === 'shape' && el.points)) {
                        const points = el.points || [];
                        points.forEach(p => {
                            minX = Math.min(minX, p.x);
                            minY = Math.min(minY, p.y);
                            maxX = Math.max(maxX, p.x);
                            maxY = Math.max(maxY, p.y);
                        });
                    } else if (el.type === 'shape') {
                        elWidth = (el as any).width || 100;
                        elHeight = (el as any).height || 100;
                        minX = Math.min(minX, el.x);
                        minY = Math.min(minY, el.y);
                        maxX = Math.max(maxX, el.x + elWidth);
                        maxY = Math.max(maxY, el.y + elHeight);
                    }
                });

                // Handle case where no elements were found or dimensions are invalid
                if (minX === Infinity) return;

                // Make coordinates relative to the group origin (minX, minY)
                const adjustedElements = groupElements.map(el => {
                    const cloned = JSON.parse(JSON.stringify(el));
                    cloned.x -= minX;
                    cloned.y -= minY;
                    if (cloned.points) {
                        cloned.points = cloned.points.map((p: any) => ({
                            x: p.x - minX,
                            y: p.y - minY
                        }));
                    }
                    return cloned;
                });

                const newGroup: GroupElement = {
                    id: uuidv4(),
                    type: 'group',
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY,
                    rotation: 0,
                    locked: false,
                    visible: true,
                    elements: adjustedElements
                };

                state.snap.elements.push(newGroup);
                state.selectedElementIds = [newGroup.id];
                state.lineEndpointSelection = null;
                state.arrowEndpointSelection = null;
            }),

            ungroupSelection: () => set((state) => {
                const selectedIds = state.selectedElementIds;
                const groupsToUngroup = state.snap.elements.filter(el =>
                    el.type === 'group' && selectedIds.includes(el.id)
                ) as GroupElement[];

                if (groupsToUngroup.length === 0) return;

                get().saveToHistory();

                groupsToUngroup.forEach(group => {
                    // Remove group
                    state.snap.elements = state.snap.elements.filter(el => el.id !== group.id);

                    // Add children back with adjusted coordinates
                    group.elements.forEach(el => {
                        const restored = JSON.parse(JSON.stringify(el));
                        restored.x += group.x;
                        restored.y += group.y;
                        if (restored.points) {
                            restored.points = restored.points.map((p: any) => ({
                                x: p.x + group.x,
                                y: p.y + group.y
                            }));
                        }
                        state.snap.elements.push(restored);
                    });
                });

                state.selectedElementIds = [];
                state.lineEndpointSelection = null;
                state.arrowEndpointSelection = null;
            }),

            alignSelection: (alignment) => set((state) => {
                const selectedIds = state.selectedElementIds;
                if (selectedIds.length < 1) return;

                get().saveToHistory();

                const selectedElements = state.snap.elements.filter(el => selectedIds.includes(el.id));

                // Calculate bounding box of all selected elements
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                const bboxes = selectedElements.map(el => {
                    const bbox = getElementBBox(el);
                    minX = Math.min(minX, bbox.x);
                    minY = Math.min(minY, bbox.y);
                    maxX = Math.max(maxX, bbox.x + bbox.width);
                    maxY = Math.max(maxY, bbox.y + bbox.height);
                    return { id: el.id, ...bbox };
                });

                selectedElements.forEach((el, index) => {
                    const bbox = bboxes[index];
                    const elementIndex = state.snap.elements.findIndex(e => e.id === el.id);

                    let dx = 0;
                    let dy = 0;

                    if (alignment === 'left') dx = minX - bbox.x;
                    else if (alignment === 'center') dx = (minX + maxX) / 2 - (bbox.x + bbox.width / 2);
                    else if (alignment === 'right') dx = maxX - (bbox.x + bbox.width);
                    else if (alignment === 'top') dy = minY - bbox.y;
                    else if (alignment === 'middle') dy = (minY + maxY) / 2 - (bbox.y + bbox.height / 2);
                    else if (alignment === 'bottom') dy = maxY - (bbox.y + bbox.height);

                    if (dx !== 0 || dy !== 0) {
                        state.snap.elements[elementIndex].x += dx;
                        state.snap.elements[elementIndex].y += dy;

                        // Adjust points for arrows/lines
                        if ('points' in state.snap.elements[elementIndex]) {
                            const elWithPoints = state.snap.elements[elementIndex] as any;
                            elWithPoints.points = elWithPoints.points.map((p: any) => ({
                                x: p.x + dx,
                                y: p.y + dy
                            }));
                        }
                    }
                });
            }),

            distributeSelection: (direction) => set((state) => {
                const selectedIds = state.selectedElementIds;
                if (selectedIds.length < 3) return; // Need at least 3 for distribution

                get().saveToHistory();

                const selectedElements = [...state.snap.elements.filter(el => selectedIds.includes(el.id))];

                if (direction === 'horizontal') {
                    // Sort by x
                    selectedElements.sort((a, b) => a.x - b.x);
                    const first = getElementBBox(selectedElements[0]);
                    const last = getElementBBox(selectedElements[selectedElements.length - 1]);

                    // Calculate space between elements
                    // We want equal gaps between edges
                    const minLeft = first.x;
                    const maxRight = last.x + last.width;
                    const totalItemsWidth = selectedElements.reduce((sum, el) => sum + getElementBBox(el).width, 0);
                    const gap = (maxRight - minLeft - totalItemsWidth) / (selectedElements.length - 1);

                    let currentX = minLeft;
                    selectedElements.forEach((el) => {
                        const bbox = getElementBBox(el);
                        const dx = currentX - bbox.x;
                        const elementIndex = state.snap.elements.findIndex(e => e.id === el.id);

                        state.snap.elements[elementIndex].x += dx;
                        if ('points' in state.snap.elements[elementIndex]) {
                            const elWithPoints = state.snap.elements[elementIndex] as any;
                            elWithPoints.points = elWithPoints.points.map((p: any) => ({
                                x: p.x + dx,
                                y: p.y
                            }));
                        }
                        currentX += bbox.width + gap;
                    });
                } else {
                    // Vertical
                    selectedElements.sort((a, b) => a.y - b.y);
                    const first = getElementBBox(selectedElements[0]);
                    const last = getElementBBox(selectedElements[selectedElements.length - 1]);

                    const minTop = first.y;
                    const maxBottom = last.y + last.height;
                    const totalItemsHeight = selectedElements.reduce((sum, el) => sum + getElementBBox(el).height, 0);
                    const gap = (maxBottom - minTop - totalItemsHeight) / (selectedElements.length - 1);

                    let currentY = minTop;
                    selectedElements.forEach((el) => {
                        const bbox = getElementBBox(el);
                        const dy = currentY - bbox.y;
                        const elementIndex = state.snap.elements.findIndex(e => e.id === el.id);

                        state.snap.elements[elementIndex].y += dy;
                        if ('points' in state.snap.elements[elementIndex]) {
                            const elWithPoints = state.snap.elements[elementIndex] as any;
                            elWithPoints.points = elWithPoints.points.map((p: any) => ({
                                x: p.x,
                                y: p.y + dy
                            }));
                        }
                        currentY += bbox.height + gap;
                    });
                }
            }),

            applyPreset: (preset) => set((state) => {
                get().saveToHistory();

                if (preset.background) {
                    state.snap.background = { ...state.snap.background, ...preset.background };
                }

                if (preset.shadow || preset.cornerRadius !== undefined) {
                    state.snap.elements.forEach((el, index) => {
                        if (el.type === 'group') return;
                        const target = state.snap.elements[index] as any;
                        if (!target.props) return;

                        if (preset.shadow && (el.type === 'code' || el.type === 'image')) {
                            target.props.shadow = { ...preset.shadow };
                        }
                        if (preset.cornerRadius !== undefined && (el.type === 'code' || el.type === 'image' || el.type === 'text')) {
                            target.props.cornerRadius = preset.cornerRadius;
                        }
                    });
                }
            }),

            setContextMenu: (updates) => set((state) => {
                state.contextMenu = { ...state.contextMenu, ...updates };
            }),
        })),
        {
            name: 'code-canvas-storage',
            storage: createJSONStorage(() => {
                if (typeof window === 'undefined') {
                    return {
                        getItem: () => null,
                        setItem: () => { },
                        removeItem: () => { },
                    };
                }

                return {
                    getItem: (name: string) => window.localStorage.getItem(name),
                    setItem: (name: string, value: string) => {
                        try {
                            window.localStorage.setItem(name, value);
                        } catch (error) {
                            console.warn('Failed to persist canvas state (quota exceeded).', error);
                        }
                    },
                    removeItem: (name: string) => window.localStorage.removeItem(name),
                };
            }),
            partialize: (state) => {
                const snap = JSON.parse(JSON.stringify(state.snap)) as Snap;
                if (snap.background?.branding?.avatarUrl && snap.background.branding.avatarUrl.length > MAX_PERSISTED_AVATAR_LENGTH) {
                    snap.background.branding.avatarUrl = '';
                    snap.background.branding.showAvatar = false;
                }
                return {
                    snap,
                    activeCloudSnapId: state.activeCloudSnapId,
                    activeCloudSnapSignature: state.activeCloudSnapSignature,
                };
            },
        }
    )
);

// Helper functions to create elements
export const createCodeElement = (x: number, y: number): CodeElement => ({
    id: uuidv4(),
    type: 'code',
    x,
    y,
    width: 600,
    height: 300,
    rotation: 0,
    locked: false,
    visible: true,
    props: {
        code: `@Composable
fun Greeting(name: String) {
    Text(
        text = "Hello, $name!",
        modifier = Modifier.padding(16.dp)
    )
}`,
        language: 'kotlin',
        theme: 'dracula',
        fontFamily: 'JetBrains Mono',
        fontSize: 14,
        lineHeight: 1.5,
        lineNumbers: true,
        highlights: [],
        padding: 24,
        cornerRadius: 12,
        shadow: { blur: 24, spread: 0, color: 'rgba(0,0,0,0.4)' },
    },
});

export const createTextElement = (x: number, y: number): TextElement => ({
    id: uuidv4(),
    type: 'text',
    x,
    y,
    rotation: 0,
    width: 200,
    height: 40,
    locked: false,
    visible: true,
    props: {
        text: 'Your text here',
        fontFamily: 'Inter',
        fontSize: 24,
        color: '#ffffff',
        bold: false,
        italic: false,
        underline: false,
        align: 'left',
        background: null,
        padding: 8,
        cornerRadius: 4,
    },
});

export const createArrowElement = (x: number, y: number): ArrowElement => ({
    id: uuidv4(),
    type: 'arrow',
    x: 0,
    y: 0,
    rotation: 0,
    locked: false,
    visible: true,
    points: [
        { x, y },
        { x: x + 150, y: y + 80 },
    ],
    props: {
        style: 'straight',
        color: '#60a5fa',
        thickness: 3,
        radius: 12,
        padding: 0,
        head: 'filled',
    },
});

export const createShapeElement = (kind: ShapeKind, x: number, y: number): ShapeElement => ({
    id: uuidv4(),
    type: 'shape',
    x: 0,
    y: 0,
    rotation: 0,
    locked: false,
    visible: true,
    width: 0,
    height: 0,
    points: kind === 'line' ? [{ x, y }, { x, y }] : undefined,
    props: {
        kind,
        stroke: '#60a5fa',
        strokeWidth: 3,
        cornerRadius: kind === 'rectangle' ? 6 : 0,
        padding: 0,
        fill: kind === 'rectangle' || kind === 'ellipse' ? '#60a5f4' : 'transparent',
        sides: kind === 'polygon' ? 5 : kind === 'star' ? 5 : undefined,
    },
});

export const createImageElement = (x: number, y: number, src: string, width: number, height: number): ImageElement => ({
    id: uuidv4(),
    type: 'image',
    x,
    y,
    rotation: 0,
    locked: false,
    visible: true,
    width,
    height,
    props: {
        src,
        width,
        height,
        opacity: 1,
        cornerRadius: 0,
        shadow: { blur: 0, spread: 0, color: 'rgba(0,0,0,0.4)' },
        rotate: 0,
        fit: 'contain',
    },
});
