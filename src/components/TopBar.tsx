import React, { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import { Cloud } from 'lucide-react';
import { useCanvasStore } from '../store/canvasStore';
import { useRecentSnapsStore } from '../store/recentSnapsStore';
import { useAuthStore } from '../store/authStore';
import { useSyncStore } from '../store/syncStore';
import { ASPECT_RATIOS } from '../types';
import type Konva from 'konva';
import { useNavigate } from 'react-router-dom';
import RecentSnapsDropdown from './RecentSnapsDropdown';
import UserMenu from './auth/UserMenu';
import { toast } from 'sonner';
import SelectField from './ui/SelectField';
import ThemeToggle from './ThemeToggle';
import UpgradeModal from './UpgradeModal';

interface TopBarProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  onGoHome?: () => void;
  onToggleLayers?: () => void;
  onToggleInspector?: () => void;
  showLayersPanel?: boolean;
  showInspector?: boolean;
}

const FREE_PLAN_WATERMARK_TEXT = 'Made with YvCode';

const loadImageFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load export image for watermarking.'));
    image.src = dataUrl;
  });

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
};

const applyFreePlanWatermark = async (dataUrl: string, format: 'png' | 'jpeg'): Promise<string> => {
  const image = await loadImageFromDataUrl(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext('2d');
  if (!context) {
    return dataUrl;
  }

  context.drawImage(image, 0, 0);

  const shortestSide = Math.max(1, Math.min(canvas.width, canvas.height));
  const fontSize = Math.max(14, Math.round(shortestSide * 0.024));
  const horizontalPadding = Math.max(12, Math.round(fontSize * 0.9));
  const verticalPadding = Math.max(8, Math.round(fontSize * 0.55));
  const margin = Math.max(12, Math.round(shortestSide * 0.03));
  const borderRadius = Math.max(8, Math.round(fontSize * 0.5));

  context.font = `600 ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
  const textWidth = context.measureText(FREE_PLAN_WATERMARK_TEXT).width;
  const badgeWidth = Math.ceil(textWidth + horizontalPadding * 2);
  const badgeHeight = Math.ceil(fontSize + verticalPadding * 2);
  const x = canvas.width - badgeWidth - margin;
  const y = canvas.height - badgeHeight - margin;

  context.fillStyle = 'rgba(9, 9, 11, 0.68)';
  drawRoundedRect(context, x, y, badgeWidth, badgeHeight, borderRadius);
  context.fill();

  context.fillStyle = 'rgba(255, 255, 255, 0.95)';
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.fillText(
    FREE_PLAN_WATERMARK_TEXT,
    x + horizontalPadding,
    y + (badgeHeight / 2)
  );

  return canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
};

const TopBar: React.FC<TopBarProps> = ({
  stageRef,
  onGoHome,
  onToggleLayers,
  onToggleInspector,
}) => {
  const navigate = useNavigate();
  const [showRecentSnaps, setShowRecentSnaps] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportTransparent, setExportTransparent] = useState(false);
  const [savingToCloud, setSavingToCloud] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const recentButtonRef = useRef<HTMLButtonElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);

  const {
    snap,
    activeCloudSnapId,
    activeCloudSnapSignature,
    updateMeta,
    newSnap,
    exportSnap,
    importSnap,
    undo,
    redo,
    history,
    saveToHistory,
    setCloudSyncState,
  } = useCanvasStore();

  const { addRecentSnap } = useRecentSnapsStore();
  const { user, subscription } = useAuthStore();
  const { saveSnapToCloud, updateCloudSnap } = useSyncStore();

  const isFreeCloudLimitReached = Boolean(
    user
    && subscription.tier === 'free'
    && subscription.snap_limit !== -1
    && subscription.current_snap_count >= subscription.snap_limit
  );

  const aspectOptions = useMemo(() => {
    const names = ASPECT_RATIOS.map((r) => r.name);
    if (!names.includes(snap.meta.aspect)) {
      return [...ASPECT_RATIOS, { name: snap.meta.aspect, width: snap.meta.width, height: snap.meta.height }];
    }
    return ASPECT_RATIOS;
  }, [snap.meta.aspect, snap.meta.width, snap.meta.height]);

  const handleNewSnap = useCallback(() => {
    // Save current snap to recent before creating new
    if (snap.elements.length > 0) {
      addRecentSnap(snap);
    }
    newSnap({ title: 'Untitled', aspect: '16:9', width: 1920, height: 1080 });
    toast.success('New canvas created');
  }, [snap, addRecentSnap, newSnap]);

  const handleAspectChange = useCallback((value: string) => {
    const ratio = aspectOptions.find(r => r.name === value);
    if (ratio) {
      updateMeta({
        aspect: ratio.name,
        width: ratio.width,
        height: ratio.height,
      });
    }
  }, [updateMeta, aspectOptions]);

  const handleExportImage = useCallback(async (format: 'png' | 'jpeg', scale: number = 2, transparent: boolean = false) => {
    const stage = stageRef.current;
    if (!stage) {
      toast.error('Canvas not ready to export');
      return;
    }

    // Temporarily set scale for export
    const oldScale = stage.scaleX();
    const oldPosition = { x: stage.x(), y: stage.y() };

    // Check if background needs to be hidden for transparency
    let bgLayer: Konva.Layer | undefined;
    if (transparent) {
      // Assuming background is the first layer, or we can find it by ID if assigned
      // For now, let's assume the Background component in Canvas renders a rect on the main layer or separate?
      // Actually, Canvas.tsx structure defines layers. Let's rely on finding standard background elements or hiding the background group.
      // A safer way: CanvasStore has 'background'. We can temporarily update the stage Container background?
      // Konva 'toDataURL' captures the stage. If we want transparency, the stage background must be transparent.
      // And any background rect we drew manually must be hidden.

      // Strategy: Hide the "Background" Layer.
      // In Canvas.tsx, we usually have <Layer> <Background /> ... </Layer>
      // Use stage.findOne('.background-layer') if we tagged it, or just find layer 0?
      bgLayer = stage.getLayers()[0];
      if (bgLayer) bgLayer.hide();
    }

    stage.scale({ x: scale, y: scale });
    stage.position({ x: 0, y: 0 });

    let dataUrl = stage.toDataURL({
      pixelRatio: 1,
      mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
      quality: 0.95,
      width: snap.meta.width * scale,
      height: snap.meta.height * scale,
    });

    // Restore immediately so the editor UI does not stay zoomed during async post-processing.
    stage.scale({ x: oldScale, y: oldScale });
    stage.position(oldPosition);
    if (transparent && bgLayer) {
      bgLayer.show();
    }

    if (user && subscription.tier === 'free') {
      try {
        dataUrl = await applyFreePlanWatermark(dataUrl, format);
      } catch (error) {
        console.error('Unable to apply free plan watermark:', error);
      }
    }

    // Download
    const link = document.createElement('a');
    link.download = `${snap.meta.title || 'canvas'}.${format}`;
    link.href = dataUrl;
    link.click();
    setShowExportMenu(false);
    addRecentSnap(snap);
    toast.success(`Exported as ${format.toUpperCase()}`);
  }, [stageRef, snap, addRecentSnap, user, subscription.tier]);

  const handleExportJSON = useCallback(() => {
    try {
      const json = exportSnap();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${snap.meta.title || 'canvas'}.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      setShowExportMenu(false);
      addRecentSnap(snap);
      toast.success('Project exported (.json)');
    } catch (error) {
      console.error(error);
      toast.error('Export failed');
    }
  }, [exportSnap, snap, addRecentSnap]);

  const handleImportJSON = useCallback(() => {
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
        reader.onload = (e) => {
          try {
            const json = e.target?.result as string;
            importSnap(json);
            toast.success('Project imported');
          } catch (err) {
            console.error(err);
            toast.error('Import failed');
          }
        };
        reader.onerror = () => toast.error('Unable to read file');
        reader.readAsText(file);
      }
    };
    input.click();
  }, [snap, addRecentSnap, saveToHistory, importSnap]);

  const handleCopyImage = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) {
      toast.error('Canvas not ready');
      return;
    }

    try {
      // Temporarily hide background if needed or just capture stage
      // We'll capture at 2x scale for quality
      const dataUrl = stage.toDataURL({ pixelRatio: 2 });
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);

      toast.success('Image copied to clipboard!');
      setShowExportMenu(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to copy image');
    }
  }, [stageRef]);

  const handleSaveToCloud = useCallback(async () => {
    if (!user) {
      setShowExportMenu(false);
      navigate('/login');
      return;
    }

    const hasCloudReference = Boolean(activeCloudSnapId);

    if (!hasCloudReference && isFreeCloudLimitReached) {
      setShowExportMenu(false);
      setShowUpgradeModal(true);
      toast.error(`Free plan limit reached (${subscription.snap_limit} snaps). Upgrade to Pro for unlimited cloud saves.`);
      return;
    }

    setSavingToCloud(true);
    try {
      const currentSnapSignature = JSON.stringify(snap);
      if (hasCloudReference && activeCloudSnapId) {
        if (activeCloudSnapSignature === currentSnapSignature) {
          toast.info('No changes to save');
          setShowExportMenu(false);
          return;
        }

        const updateResult = await updateCloudSnap(activeCloudSnapId, snap);
        if (updateResult.error) {
          toast.error(updateResult.error);
          return;
        }

        setCloudSyncState(activeCloudSnapId, snap);
        setShowExportMenu(false);
        addRecentSnap(snap);
        return;
      }

      const stage = stageRef.current;
      if (!stage) {
        toast.error('Canvas not ready');
        return;
      }

      // Generate thumbnail at lower quality for faster upload
      const dataUrl = stage.toDataURL({ pixelRatio: 0.5 });
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Check file size (limit to 500KB for thumbnail)
      if (blob.size > 500 * 1024) {
        toast.error('Thumbnail too large. Try simplifying your snap.');
        setSavingToCloud(false);
        return;
      }

      const result = await saveSnapToCloud(snap, blob);
      if (result.error) {
        const normalizedError = result.error.toLowerCase();
        const looksLikeLimitError = normalizedError.includes('free limit')
          || normalizedError.includes('row-level security')
          || normalizedError.includes('violates');

        if (subscription.tier === 'free' && looksLikeLimitError) {
          setShowExportMenu(false);
          setShowUpgradeModal(true);
          toast.error(`Free plan limit reached (${subscription.snap_limit} snaps). Upgrade to Pro for unlimited cloud saves.`);
          return;
        }

        toast.error(result.error);
      } else {
        if (result.id) {
          setCloudSyncState(result.id, snap);
        }
        toast.success('Snap saved to cloud!');
        setShowExportMenu(false);
        addRecentSnap(snap);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save to cloud');
    } finally {
      setSavingToCloud(false);
    }
  }, [
    user,
    navigate,
    stageRef,
    snap,
    activeCloudSnapId,
    activeCloudSnapSignature,
    saveSnapToCloud,
    updateCloudSnap,
    addRecentSnap,
    setCloudSyncState,
    isFreeCloudLimitReached,
    subscription.tier,
    subscription.snap_limit,
  ]);

  useEffect(() => {
    const handleGlobalCopy = () => handleCopyImage();
    const copyCanvasImageEvent = 'copy-canvas-image';
    window.addEventListener(copyCanvasImageEvent, handleGlobalCopy as EventListener);
    return () => window.removeEventListener(copyCanvasImageEvent, handleGlobalCopy as EventListener);
  }, [handleCopyImage]);

  const toggleRecentSnaps = useCallback(() => {
    setShowRecentSnaps((prev) => !prev);
  }, []);

  return (
    <>
      {/* Overlay for closing export menu */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setShowExportMenu(false)}
        />
      )}

      <div className="h-14 bg-white dark:bg-[#09090b] border-b border-neutral-200 dark:border-white/8 flex items-center justify-between px-3 sm:px-5 z-40 relative select-none">
        {/* Left section: Logo & Actions */}
        <div className="flex items-center gap-2 sm:gap-5">
          {/* Mobile: Toggle Layers Button */}
          {onToggleLayers && (
            <button
              onClick={onToggleLayers}
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-all"
              title="Toggle Layers"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className="flex items-center gap-2 sm:gap-3 pr-3 sm:pr-5 border-r border-neutral-200 dark:border-white/8">
            <button
              onClick={onGoHome}
              className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/20 flex items-center justify-center hover:from-blue-500 hover:to-blue-600 transition-all"
              title="Go to Home"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
            <span className="hidden sm:block font-bold text-base tracking-tight text-neutral-900 dark:text-white">
              YvCode
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={handleNewSnap}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all"
              title="New (⌘N)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={handleImportJSON}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all"
              title="Open File (⌘O)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </button>

            <div className="relative">
              <button
                ref={recentButtonRef}
                onClick={toggleRecentSnaps}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${showRecentSnaps
                  ? 'text-neutral-900 dark:text-white bg-neutral-200 dark:bg-white/10'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5'
                  }`}
                title="Recent Projects"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <RecentSnapsDropdown
                isOpen={showRecentSnaps}
                onClose={() => setShowRecentSnaps(false)}
                anchorRef={recentButtonRef as React.RefObject<HTMLElement>}
              />
            </div>
          </div>
        </div>

        {/* Center section: Title & Tools - Hidden on mobile */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-4">
          <input
            type="text"
            value={snap.meta.title}
            onChange={(e) => updateMeta({ title: e.target.value })}
            className="text-xs font-medium text-center text-neutral-600 dark:text-neutral-200 focus:text-neutral-900 dark:focus:text-white px-3 py-1.5 outline-none rounded-md bg-neutral-50 dark:hover:bg-white/5 focus:bg-neutral-200 dark:focus:bg-white/10 transition-colors placeholder-neutral-400 dark:placeholder-neutral-600 w-32 lg:w-48 border border-transparent focus:border-neutral-300 dark:focus:border-white/10"
            placeholder="Untitled Project"
          />
          <div className="h-4 w-px bg-neutral-200 dark:bg-white/10" />
          <div className="min-w-37.5">
            <SelectField
              value={snap.meta.aspect}
              onValueChange={handleAspectChange}
              options={aspectOptions.map((ratio) => ({ value: ratio.name, label: ratio.name }))}
              triggerClassName="bg-transparent border-transparent text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-2 py-1"
            />
          </div>
        </div>

        {/* Right section: History & Export */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={undo}
              disabled={history.past.length === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-all disabled:opacity-30 disabled:hover:bg-transparent active:scale-95"
              title="Undo (⌘Z)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={history.future.length === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-all disabled:opacity-30 disabled:hover:bg-transparent active:scale-95"
              title="Redo (⇧⌘Z)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>

          <div className="hidden sm:block h-6 w-px bg-neutral-200 dark:bg-white/10" />

          {/* Theme Toggle */}
          <ThemeToggle />

          <div className="hidden sm:block h-6 w-px bg-neutral-200 dark:bg-white/10" />

          {/* Auth */}
          <div className="flex items-center gap-2">
            {user ? (
              <UserMenu />
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          <div className="hidden sm:block h-6 w-px bg-neutral-200 dark:bg-white/10" />

          <div className="relative z-50">
            <button
              ref={exportButtonRef}
              onClick={() => setShowExportMenu(!showExportMenu)}
              className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 border group ${showExportMenu
                ? 'bg-blue-600/10 text-blue-500 dark:text-blue-400 border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                : 'bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/10 border-neutral-200 dark:border-white/5 hover:border-neutral-300 dark:hover:border-white/10'
                }`}
            >
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </span>
              <div className={`hidden sm:block p-0.5 rounded-md transition-all duration-200 ${showExportMenu ? 'bg-blue-500/20 text-blue-500 dark:text-blue-400' : 'bg-neutral-200 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'}`}>
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-3 w-[90vw] sm:w-72 max-w-sm bg-white dark:bg-[#09090b]/95 backdrop-blur-2xl border border-neutral-200 dark:border-white/10 rounded-xl shadow-2xl shadow-neutral-200/50 dark:shadow-black/50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right ring-1 ring-neutral-100 dark:ring-white/5 z-50">
                <div className="px-3 py-2 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-500 uppercase tracking-widest pl-1">Quick Actions</span>
                  <button
                    onClick={handleCopyImage}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-blue-100 dark:bg-blue-600/10 hover:bg-blue-200 dark:hover:bg-blue-600/20 border border-blue-200 dark:border-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/40 transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-200 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </div>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Copy to Clipboard</span>
                        <span className="text-[10px] text-blue-600/70 dark:text-blue-500/70">Instant share as PNG</span>
                      </div>
                    </div>
                  </button>

                  {user && (
                    <button
                      onClick={handleSaveToCloud}
                      disabled={savingToCloud || (!activeCloudSnapId && isFreeCloudLimitReached)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-cyan-100 dark:bg-cyan-600/10 hover:bg-cyan-200 dark:hover:bg-cyan-600/20 border border-cyan-200 dark:border-cyan-500/20 hover:border-cyan-300 dark:hover:border-cyan-500/40 transition-all group active:scale-[0.98] disabled:opacity-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-cyan-200 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Cloud className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                            {savingToCloud
                              ? 'Saving...'
                              : !activeCloudSnapId && isFreeCloudLimitReached
                                ? 'Limit reached'
                                : activeCloudSnapId
                                  ? 'Update Cloud Snap'
                                  : 'Save to Cloud'}
                          </span>
                          <span className="text-[10px] text-cyan-600/70 dark:text-cyan-500/70">Backup & sync</span>
                        </div>
                      </div>
                    </button>
                  )}

                  {user && subscription.tier === 'free' && isFreeCloudLimitReached && !activeCloudSnapId && (
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        setShowUpgradeModal(true);
                      }}
                      className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-amber-100 dark:bg-amber-500/10 hover:bg-amber-200 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-500/50 transition-all active:scale-[0.98]"
                    >
                      <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Upgrade to Pro</span>
                    </button>
                  )}
                </div>

                <div className="px-3 py-2 mt-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-1">Download Image</span>
                </div>

                {user && subscription.tier === 'free' && (
                  <div className="mx-3 mb-2 rounded-lg border border-amber-200/70 dark:border-amber-500/30 bg-amber-50/90 dark:bg-amber-500/10 px-3 py-2">
                    <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                      Free plan exports include a watermark
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-1.5 px-1">

                  {/* Transparent Toggle */}
                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Transparent Background</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExportTransparent(!exportTransparent);
                      }}
                      className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${exportTransparent ? 'bg-blue-600' : 'bg-neutral-200 dark:bg-white/10'}`}
                    >
                      <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${exportTransparent ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleExportImage('png', 2, exportTransparent)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-neutral-100 dark:bg-white/3 hover:bg-neutral-200 dark:hover:bg-white/8 border border-neutral-200 dark:border-white/2 hover:border-neutral-300 dark:hover:border-white/10 transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-100 to-blue-200 dark:from-blue-500/10 dark:to-blue-600/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="font-bold text-[10px]">PNG</span>
                      </div>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">PNG Image</span>
                        <span className="text-[10px] text-neutral-500">High quality (2x)</span>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExportImage('jpeg', 2, exportTransparent)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-neutral-100 dark:bg-white/3 hover:bg-neutral-200 dark:hover:bg-white/8 border border-neutral-200 dark:border-white/2 hover:border-neutral-300 dark:hover:border-white/10 transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-100 to-purple-200 dark:from-purple-500/10 dark:to-purple-600/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="font-bold text-[10px]">JPG</span>
                      </div>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">JPEG Image</span>
                        <span className="text-[10px] text-neutral-500">Standard quality</span>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="h-px bg-linear-to-r from-transparent via-neutral-200 dark:via-white/10 to-transparent my-2" />

                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-1">Project File</span>
                </div>

                <div className="px-1 pb-1">
                  <button
                    onClick={handleExportJSON}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-neutral-100 dark:bg-white/3 hover:bg-neutral-200 dark:hover:bg-white/8 border border-neutral-200 dark:border-white/2 hover:border-neutral-300 dark:hover:border-white/10 transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-linear-to-br from-yellow-100 to-yellow-200 dark:from-yellow-500/10 dark:to-yellow-600/10 border border-yellow-200 dark:border-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">Save Project</span>
                        <span className="text-[10px] text-neutral-500">Edit later (.yvsnap)</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile: Toggle Inspector Button */}
          {onToggleInspector && (
            <button
              onClick={onToggleInspector}
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-all"
              title="Toggle Inspector"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentSnaps={subscription.current_snap_count}
        maxSnaps={subscription.snap_limit}
      />

    </>
  );
};

export default memo(TopBar);
