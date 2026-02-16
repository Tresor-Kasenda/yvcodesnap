import { useEffect, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';

export function useKeyboardShortcuts() {
    const {
        selectedElementIds,
        deleteElement,
        duplicateElement,
        undo,
        redo,
        setZoom,
        zoom,
        showGrid,
        setShowGrid,
        setTool,
    } = useCanvasStore();

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            const target = e.target as HTMLElement | null;
            if (!target) return;

            // Allow native shortcuts (copy/paste, select all, etc.) inside form fields or editable blocks
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMeta = e.metaKey || e.ctrlKey;

      // Delete selected element (Backspace or Delete)
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedElementIds.length > 0) {
        e.preventDefault();
        deleteElement();
        return;
      }

      // Undo: Cmd+Z
      if (isMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Shift+Cmd+Z or Cmd+Y
      if ((isMeta && e.key === 'z' && e.shiftKey) || (isMeta && e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }

      // Duplicate: Cmd+D
      if (isMeta && e.key === 'd' && selectedElementIds.length > 0) {
        e.preventDefault();
        duplicateElement();
        return;
      }

      // Zoom In: Cmd+Plus or Cmd+=
      if (isMeta && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setZoom(Math.min(256, zoom + 0.1));
        return;
      }

      // Zoom Out: Cmd+Minus
      if (isMeta && e.key === '-') {
        e.preventDefault();
        setZoom(Math.max(0.25, zoom - 0.1));
        return;
      }

      // Reset Zoom: Cmd+0
      if (isMeta && e.key === '0') {
        e.preventDefault();
        setZoom(1);
        return;
      }

      // Toggle Grid: Cmd+' (or Cmd+G as alternative)
      if (isMeta && (e.key === "'" || e.key === 'g') && !e.shiftKey) {
        e.preventDefault();
        setShowGrid(!showGrid);
        return;
      }

      // Tool shortcuts (without modifier)
      if (!isMeta && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
          case 'escape':
            setTool('select');
            break;
          case 'c':
            setTool('code');
            break;
          case 't':
            setTool('text');
            break;
          case 'a':
            setTool('arrow');
            break;
        }
      }
    },
    [
      selectedElementIds,
      deleteElement,
      duplicateElement,
      undo,
      redo,
      setZoom,
      zoom,
      showGrid,
      setShowGrid,
      setTool,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
