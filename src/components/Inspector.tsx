import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { BringToFront, SendToBack } from 'lucide-react';
import { useCanvasStore } from '../store/canvasStore';
import HoverTooltip, { HoverTooltipProvider } from './ui/HoverTooltip';

import BackgroundPanel from './inspector/BackgroundPanel';
import CanvasSizePanel from './inspector/CanvasSizePanel';
import BrandingPanel from './inspector/BrandingPanel';
import CodeInspector from './inspector/CodeInspector';
import TextInspector from './inspector/TextInspector';
import ArrowInspector from './inspector/ArrowInspector';
import ShapeInspector from './inspector/ShapeInspector';
import ImageInspector from './inspector/ImageInspector';
import PresetsPanel from './inspector/PresetsPanel';
import type { CodeElement, TextElement, ArrowElement, ShapeElement, ImageElement } from '../types';

const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 260;
const MAX_WIDTH = 520;
const EXPANDED_WIDTH = 420;
const MOBILE_WIDTH = 280;

const Inspector: React.FC = () => {
  const [width, setWidth] = useState<number>(() => {
    // Initialize with mobile width if on mobile
    return window.innerWidth < 768 ? MOBILE_WIDTH : DEFAULT_WIDTH;
  });
  const [activeTab, setActiveTab] = useState<'settings' | 'presets'>('settings');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const {
    snap,
    selectedElementIds,
    deleteElement,
    duplicateElement,
    moveElementUp,
    moveElementDown,
    alignSelection,
    distributeSelection,
  } = useCanvasStore();

  const dragStateRef = useRef({
    startX: 0,
    startWidth: DEFAULT_WIDTH,
    isDragging: false,
  });

  const selectedElement = useMemo(
    () => {
      if (selectedElementIds.length === 1) {
        return snap.elements.find(el => el.id === selectedElementIds[0]);
      }
      return null;
    },
    [snap.elements, selectedElementIds]
  );

  const handleResizeMove = useCallback((event: MouseEvent) => {
    if (!dragStateRef.current.isDragging) return;

    const delta = dragStateRef.current.startX - event.clientX;
    const nextWidth = Math.min(
      Math.max(dragStateRef.current.startWidth + delta, MIN_WIDTH),
      MAX_WIDTH
    );

    setWidth(nextWidth);
  }, []);

  const stopDragging = useCallback(() => {
    if (!dragStateRef.current.isDragging) return;

    dragStateRef.current.isDragging = false;
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', stopDragging);
  }, [handleResizeMove]);

  const handleResizeStart = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragStateRef.current = {
      startX: event.clientX,
      startWidth: width,
      isDragging: true,
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', stopDragging);
  }, [width, handleResizeMove, stopDragging]);

  const handleHandleDoubleClick = useCallback(() => {
    setWidth(prev => (prev < EXPANDED_WIDTH ? EXPANDED_WIDTH : DEFAULT_WIDTH));
  }, []);

  useEffect(() => (
    () => {
      stopDragging();
    }
  ), [stopDragging]);

  // Handle responsive width changes
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setWidth(MOBILE_WIDTH);
      } else if (width === MOBILE_WIDTH) {
        setWidth(DEFAULT_WIDTH);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width]);

  const handleDelete = useCallback(() => {
    if (selectedElementIds.length > 0) {
      deleteElement();
    }
  }, [selectedElementIds, deleteElement]);

  const handleDuplicate = useCallback(() => {
    if (selectedElementIds.length > 0) {
      duplicateElement();
    }
  }, [selectedElementIds, duplicateElement]);

  const handleMoveUp = useCallback(() => {
    selectedElementIds.forEach(id => moveElementUp(id));
  }, [selectedElementIds, moveElementUp]);

  const handleMoveDown = useCallback(() => {
    selectedElementIds.forEach(id => moveElementDown(id));
  }, [selectedElementIds, moveElementDown]);

  return (
    <HoverTooltipProvider>
      <div
        className="relative shrink-0 h-full overflow-x-hidden bg-white dark:bg-[#09090b] transition-[width] duration-150 ease-out w-full md:w-auto"
        style={{ width: isMobile ? '100vw' : width, maxWidth: isMobile ? '100vw' : MAX_WIDTH }}
      >
        {!isMobile && (
          <HoverTooltip label="Drag to resize inspector">
            <div
              className="absolute left-0 top-0 h-full w-2 cursor-col-resize group hidden md:block"
              onMouseDown={handleResizeStart}
              onDoubleClick={handleHandleDoubleClick}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize inspector"
            >
              <div className="h-full w-px bg-neutral-200 dark:bg-neutral-700 transition-all" />
            </div>
          </HoverTooltip>
        )}
        <div className="p-4 sm:p-6 h-full overflow-y-auto overflow-x-hidden inspector-scrollbar">
        {selectedElement ? (
          <div className="space-y-4">
            {/* Header with Title and Element Actions */}
            <div className="flex items-center justify-between">
              <h3 className="text-neutral-900 dark:text-white font-semibold text-sm uppercase tracking-wider">
                {selectedElement.type === 'shape'
                  ? (selectedElement as ShapeElement).props.kind
                  : selectedElement.type}
              </h3>
              <div className="flex items-center gap-1">
                <HoverTooltip label="Duplicate" shortcut="⌘D">
                  <button
                    onClick={handleDuplicate}
                    className="p-1.5 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-md text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    aria-label="Duplicate"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </HoverTooltip>
                <div className="w-px h-3 bg-neutral-200 dark:bg-white/10 mx-1" />
                <HoverTooltip label="Delete" shortcut="⌫">
                  <button
                    onClick={handleDelete}
                    className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-md text-neutral-500 dark:text-neutral-400 transition-colors"
                    aria-label="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </HoverTooltip>
              </div>
            </div>

            {/* Layer Controls */}
            <div className="grid grid-cols-2 gap-2">
              <HoverTooltip label="Send backward">
                <button
                  onClick={handleMoveDown}
                  className="flex items-center justify-center px-3 py-2 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  aria-label="Send backward"
                >
                  <SendToBack className="h-4 w-4" aria-hidden="true" />
                </button>
              </HoverTooltip>
              <HoverTooltip label="Bring forward">
                <button
                  onClick={handleMoveUp}
                  className="flex items-center justify-center px-3 py-2 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  aria-label="Bring forward"
                >
                  <BringToFront className="h-4 w-4" aria-hidden="true" />
                </button>
              </HoverTooltip>
            </div>

            <div className="h-px bg-neutral-200 dark:bg-white/5 w-full" />

            {/* Element-specific inspector */}
            <div className="inspector-content">
              {selectedElement.type === 'code' && (
                <CodeInspector element={selectedElement as CodeElement} />
              )}
              {selectedElement.type === 'text' && (
                <TextInspector element={selectedElement as TextElement} />
              )}
              {selectedElement.type === 'arrow' && (
                <ArrowInspector element={selectedElement as ArrowElement} />
              )}
              {selectedElement.type === 'shape' && (
                <ShapeInspector element={selectedElement as ShapeElement} />
              )}
              {selectedElement.type === 'image' && (
                <ImageInspector element={selectedElement as ImageElement} />
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedElementIds.length > 1 ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col items-center justify-center pt-2 pb-6 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/5">
                  <span className="font-medium text-neutral-900 dark:text-white">{selectedElementIds.length} elements selected</span>
                </div>

                <div className="space-y-4">
                  <h3 className="text-neutral-900 dark:text-white font-semibold text-[10px] uppercase tracking-wider">Alignment</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <HoverTooltip label="Align left"><button onClick={() => alignSelection('left')} className="flex flex-col items-center gap-2 p-3 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-xl group transition-all" aria-label="Align left">
                      <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20M8 6h10a2 2 0 012 2v2a2 2 0 01-2 2H8M8 14h6a2 2 0 012 2v2a2 2 0 01-2 2H8" /></svg>
                      <span className="text-[10px] uppercase tracking-tight text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">Left</span>
                    </button></HoverTooltip>
                    <HoverTooltip label="Align center"><button onClick={() => alignSelection('center')} className="flex flex-col items-center gap-2 p-3 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-xl group transition-all" aria-label="Align center">
                      <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v2m0 16v2M7 6h10a2 2 0 012 2v2a2 2 0 01-2 2H7M9 14h6a2 2 0 012 2v2a2 2 0 01-2 2H9" /></svg>
                      <span className="text-[10px] uppercase tracking-tight text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">Center</span>
                    </button></HoverTooltip>
                    <HoverTooltip label="Align right"><button onClick={() => alignSelection('right')} className="flex flex-col items-center gap-2 p-3 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-xl group transition-all" aria-label="Align right">
                      <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 2v20M16 6H6a2 2 0 00-2 2v2a2 2 0 002 2h10M16 14h-6a2 2 0 00-2 2v2a2 2 0 002 2h6" /></svg>
                      <span className="text-[10px] uppercase tracking-tight text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">Right</span>
                    </button></HoverTooltip>
                    <HoverTooltip label="Align top"><button onClick={() => alignSelection('top')} className="flex flex-col items-center gap-2 p-3 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-xl group transition-all" aria-label="Align top">
                      <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 4H2M6 8v10a2 2 0 002 2h2a2 2 0 002-2V8M14 8v6a2 2 0 002 2h2a2 2 0 002-2V8" /></svg>
                      <span className="text-[10px] uppercase tracking-tight text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">Top</span>
                    </button></HoverTooltip>
                    <HoverTooltip label="Align middle"><button onClick={() => alignSelection('middle')} className="flex flex-col items-center gap-2 p-3 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-xl group transition-all" aria-label="Align middle">
                      <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h2m16 0h2M6 7v10a2 2 0 002 2h2a2 2 0 002-2V7M14 9v6a2 2 0 002 2h2a2 2 0 002-2V9" /></svg>
                      <span className="text-[10px] uppercase tracking-tight text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">Middle</span>
                    </button></HoverTooltip>
                    <HoverTooltip label="Align bottom"><button onClick={() => alignSelection('bottom')} className="flex flex-col items-center gap-2 p-3 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-xl group transition-all" aria-label="Align bottom">
                      <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 20H2M6 16V6a2 2 0 012-2h2a2 2 0 012 2v10M14 16v-6a2 2 0 012-2h2a2 2 0 012 2v6" /></svg>
                      <span className="text-[10px] uppercase tracking-tight text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">Bottom</span>
                    </button></HoverTooltip>
                  </div>
                </div>

                {selectedElementIds.length > 2 && (
                  <div className="space-y-4">
                    <h3 className="text-neutral-900 dark:text-white font-semibold text-[10px] uppercase tracking-wider">Distribution</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <HoverTooltip label="Distribute horizontally"><button onClick={() => distributeSelection('horizontal')} className="flex items-center justify-center gap-2 py-3 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-xl group transition-all" aria-label="Distribute horizontally">
                        <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20M20 2v20M8 12h8" /></svg>
                        <span className="text-[10px] uppercase tracking-tight text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">Horizontal</span>
                      </button></HoverTooltip>
                      <HoverTooltip label="Distribute vertically"><button onClick={() => distributeSelection('vertical')} className="flex items-center justify-center gap-2 py-3 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-xl group transition-all" aria-label="Distribute vertically">
                        <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4h20M2 20h20M12 8v8" /></svg>
                        <span className="text-[10px] uppercase tracking-tight text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">Vertical</span>
                      </button></HoverTooltip>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tabs */}
                <div className="flex p-1 bg-neutral-100 dark:bg-white/5 rounded-xl">
                  <HoverTooltip label="Canvas settings"><button
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 py-2 text-[10px] font-semibold rounded-lg transition-all ${activeTab === 'settings' ? 'bg-white dark:bg-white/10 text-neutral-900 dark:text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                    aria-label="Canvas settings"
                  >
                    Canvas
                  </button></HoverTooltip>
                  <HoverTooltip label="Canvas presets"><button
                    onClick={() => setActiveTab('presets')}
                    className={`flex-1 py-2 text-[10px] font-semibold rounded-lg transition-all ${activeTab === 'presets' ? 'bg-white dark:bg-white/10 text-neutral-900 dark:text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                    aria-label="Canvas presets"
                  >
                    Presets
                  </button></HoverTooltip>
                </div>

                {activeTab === 'settings' ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <CanvasSizePanel />

                    <div className="h-px bg-neutral-200 dark:bg-white/5 w-full" />

                    <div>
                      <BackgroundPanel />
                    </div>

                    <div className="h-px bg-neutral-200 dark:bg-white/5 w-full" />

                    <div>
                      <h3 className="text-neutral-900 dark:text-white font-semibold text-[10px] uppercase tracking-wider">Branding</h3>
                      <BrandingPanel />
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <h3 className="text-neutral-900 dark:text-white font-semibold text-[10px] uppercase tracking-wider">Design Presets</h3>
                    <PresetsPanel />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </HoverTooltipProvider>
  );
};

export default memo(Inspector);
