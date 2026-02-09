import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { useCanvasStore } from '../store/canvasStore';
import { useAppCommands } from '../hooks/useAppCommands';

type ToolId = 'select' | 'code' | 'text' | 'image' | 'arrow' | 'rectangle' | 'ellipse' | 'line' | 'polygon' | 'star';

interface ToolConfig {
  id: ToolId;
  label: string;
  shortcut?: string;
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
}

const Toolbar: React.FC = () => {
  const { tool, setTool, showGrid, setShowGrid, zoom, setZoom } = useCanvasStore();
  const { commands } = useAppCommands();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const tools: ToolConfig[] = [
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      icon: (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ) as React.ReactElement<React.SVGProps<SVGSVGElement>>
    },
    {
      id: 'code',
      label: 'Code Block',
      shortcut: 'C',
      icon: (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ) as React.ReactElement<React.SVGProps<SVGSVGElement>>
    },
    {
      id: 'text',
      label: 'Text',
      shortcut: 'T',
      icon: (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ) as React.ReactElement<React.SVGProps<SVGSVGElement>>
    },
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shapeTools: ToolConfig[] = [
    {
      id: 'rectangle',
      label: 'Rectangle',
      shortcut: 'R',
      icon: (
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="5" y="5" width="14" height="14" rx="2" />
        </svg>
      ) as React.ReactElement<React.SVGProps<SVGSVGElement>>
    },
    {
      id: 'line',
      label: 'Line',
      shortcut: 'L',
      icon: (
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 19 19 5" strokeLinecap="round" />
        </svg>
      ) as React.ReactElement<React.SVGProps<SVGSVGElement>>
    },
    {
      id: 'arrow',
      label: 'Arrow',
      shortcut: 'Shift+L',
      icon: (
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 19 19 5m0 0h-6m6 0v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) as React.ReactElement<React.SVGProps<SVGSVGElement>>
    },
    {
      id: 'ellipse',
      label: 'Ellipse',
      shortcut: 'O',
      icon: (
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="12" cy="12" rx="7" ry="9" />
        </svg>
      ) as React.ReactElement<React.SVGProps<SVGSVGElement>>
    },
    {
      id: 'polygon',
      label: 'Polygon',
      shortcut: 'Shift+O',
      icon: (
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3 20 8v8l-8 5-8-5V8z" />
        </svg>
      ) as React.ReactElement<React.SVGProps<SVGSVGElement>>
    },
    {
      id: 'star',
      label: 'Star',
      shortcut: '',
      icon: (
        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="m12 3 2.6 5.9 6.4.6-4.8 4.2 1.4 6.3L12 17.5 6.4 20l1.4-6.3L3 9.5l6.4-.6Z" />
        </svg>
      ) as React.ReactElement<React.SVGProps<SVGSVGElement>>
    },
  ];

  const activeDrawingTool = useMemo(() => {
    const found = shapeTools.find((t) => t.id === tool);
    return found || shapeTools[0];
  }, [shapeTools, tool]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!menuOpen) return;
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const updateMenuPos = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setMenuPos({
      left: rect.left + rect.width / 2 + window.scrollX,
      top: rect.top + window.scrollY - 8,
    });
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    updateMenuPos();
    window.addEventListener('resize', updateMenuPos);
    window.addEventListener('scroll', updateMenuPos, true);
    return () => {
      window.removeEventListener('resize', updateMenuPos);
      window.removeEventListener('scroll', updateMenuPos, true);
    };
  }, [menuOpen, updateMenuPos]);

  const renderTooltip = (label: string, shortcut?: string) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side="top"
        align="center"
        sideOffset={8}
        className="z-50 rounded-md bg-neutral-900 px-2 py-1 text-white text-xs shadow-lg flex items-center gap-1.5"
      >
        <span>{label}</span>
        {shortcut && <span className="text-white/50">{shortcut}</span>}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );

  // Figma-style button classes
  const getButtonClass = (isActive: boolean) =>
    `relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
      isActive
        ? 'bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
    }`;

  return (
    <TooltipPrimitive.Provider delayDuration={300} disableHoverableContent>
      {/* Main Toolbar - Figma style */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-1.5 rounded-xl bg-white dark:bg-neutral-900 shadow-lg shadow-black/10 dark:shadow-black/30 border border-neutral-200/50 dark:border-white/5 z-50">

        {/* Primary Tools */}
        <div className="flex items-center">
          {tools.map(({ id, icon, label, shortcut }) => (
            <TooltipPrimitive.Root key={id}>
              <TooltipPrimitive.Trigger asChild>
                <button
                  onClick={() => {
                    if (id === 'image') {
                      const cmd = commands.find(c => c.id === 'image');
                      if (cmd) cmd.action();
                    } else {
                      setTool(id);
                    }
                  }}
                  className={getButtonClass(tool === id)}
                  aria-label={label}
                >
                  {React.cloneElement<React.SVGProps<SVGSVGElement>>(icon, { className: 'w-[18px] h-[18px]' })}
                </button>
              </TooltipPrimitive.Trigger>
              {renderTooltip(label, shortcut)}
            </TooltipPrimitive.Root>
          ))}
        </div>

        {/* Subtle separator */}
        <div className="w-px h-5 bg-neutral-200 dark:bg-white/10 mx-1" />

        {/* Shape picker with dropdown */}
        <div className="flex items-center">
          <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger asChild>
              <button
                ref={triggerRef}
                onClick={() => {
                  if (!menuOpen) {
                    setTool(activeDrawingTool.id);
                  }
                  setMenuOpen((o) => !o);
                }}
                className={`relative h-8 px-1.5 rounded-lg flex items-center gap-0.5 transition-colors ${
                  shapeTools.some((t) => t.id === tool)
                    ? 'bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
                aria-label={activeDrawingTool.label}
                aria-expanded={menuOpen}
              >
                {React.cloneElement<React.SVGProps<SVGSVGElement>>(activeDrawingTool.icon, { className: 'w-[18px] h-[18px]' })}
                <svg className="w-2.5 h-2.5 opacity-60" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M5 7L2 4h6z" />
                </svg>
              </button>
            </TooltipPrimitive.Trigger>
            {renderTooltip(activeDrawingTool.label, activeDrawingTool.shortcut)}
          </TooltipPrimitive.Root>

          {menuOpen && createPortal(
            <div
              ref={menuRef}
              className="w-48 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xl py-1 z-[9999]"
              style={{
                position: 'absolute',
                left: menuPos.left,
                top: menuPos.top,
                transform: 'translate(-50%, -100%)',
              }}
            >
              {shapeTools.map(({ id, icon, label, shortcut }) => {
                const isActive = tool === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setTool(id);
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {React.cloneElement<React.SVGProps<SVGSVGElement>>(icon, { className: 'w-4 h-4' })}
                    <span className="flex-1 text-left">{label}</span>
                    {shortcut && <span className="text-xs text-neutral-400 dark:text-neutral-500">{shortcut}</span>}
                  </button>
                );
              })}
            </div>,
            document.body
          )}
        </div>

        {/* Subtle separator */}
        <div className="w-px h-5 bg-neutral-200 dark:bg-white/10 mx-1" />

        {/* Grid Toggle */}
        <TooltipPrimitive.Root>
          <TooltipPrimitive.Trigger asChild>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={getButtonClass(showGrid)}
              aria-label="Toggle Grid"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM9 4v16M15 4v16M4 9h16M4 15h16" />
              </svg>
            </button>
          </TooltipPrimitive.Trigger>
          {renderTooltip('Grid', '⌘;')}
        </TooltipPrimitive.Root>

        {/* Subtle separator */}
        <div className="w-px h-5 bg-neutral-200 dark:bg-white/10 mx-1" />

        {/* Zoom Controls - Clean style */}
        <div className="flex items-center gap-0.5">
          <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger asChild>
              <button
                onClick={() => setZoom(Math.max(zoom - 0.1, 0.1))}
                className="w-7 h-8 rounded-lg flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                aria-label="Zoom Out"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>
            </TooltipPrimitive.Trigger>
            {renderTooltip('Zoom Out', '⌘-')}
          </TooltipPrimitive.Root>

          <div className="w-10 text-center text-xs font-medium text-neutral-600 dark:text-neutral-300 select-none tabular-nums">
            {Math.round(zoom * 100)}%
          </div>

          <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger asChild>
              <button
                onClick={() => setZoom(Math.min(zoom + 0.1, 3))}
                className="w-7 h-8 rounded-lg flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                aria-label="Zoom In"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </TooltipPrimitive.Trigger>
            {renderTooltip('Zoom In', '⌘+')}
          </TooltipPrimitive.Root>
        </div>
      </div>
    </TooltipPrimitive.Provider>
  );
};

export default Toolbar;
