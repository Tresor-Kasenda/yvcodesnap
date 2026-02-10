import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeftRight, ArrowUpDown } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import NumberField from '../ui/NumberField';
import HoverTooltip from '../ui/HoverTooltip';

const MIN_CANVAS = 320;
const MAX_CANVAS = 10000;
const PREFIX_ICON_CLASS = 'h-3 w-3';

const CanvasSizePanel: React.FC = () => {
  const { snap, updateMeta } = useCanvasStore();
  const [draft, setDraft] = useState({ width: String(snap.meta.width), height: String(snap.meta.height) });

  useEffect(() => {
    setDraft({ width: String(snap.meta.width), height: String(snap.meta.height) });
  }, [snap.meta.width, snap.meta.height]);

  const clamp = (value: number, fallback: number) =>
    Math.min(MAX_CANVAS, Math.max(MIN_CANVAS, Math.round(value) || fallback));

  const applySize = useCallback(
    (w: number, h: number) => {
      const width = clamp(w, snap.meta.width);
      const height = clamp(h, snap.meta.height);
      updateMeta({
        width,
        height,
        aspect: `Custom ${width}x${height}`,
      });
    },
    [updateMeta, snap.meta.width, snap.meta.height]
  );

  const updateWidth = (value: string) => {
    setDraft((s) => ({ ...s, width: value }));
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      applySize(parsed, parseInt(draft.height, 10));
    }
  };

  const updateHeight = (value: string) => {
    setDraft((s) => ({ ...s, height: value }));
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      applySize(parseInt(draft.width, 10), parsed);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <label className="text-[10px] font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider">Canvas Size</label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <HoverTooltip label="Canvas width">
          <div>
            <NumberField
              value={draft.width === '' ? '' : Number(draft.width)}
              onChange={(v) => updateWidth(v === '' ? '' : String(v))}
              min={MIN_CANVAS}
              max={MAX_CANVAS}
              step={10}
              prefix={<ArrowLeftRight className={PREFIX_ICON_CLASS} />}
              suffix="px"
              className="w-full max-w-none"
              inputClassName="text-sm"
            />
          </div>
        </HoverTooltip>
        <HoverTooltip label="Canvas height">
          <div>
            <NumberField
              value={draft.height === '' ? '' : Number(draft.height)}
              onChange={(v) => updateHeight(v === '' ? '' : String(v))}
              min={MIN_CANVAS}
              max={MAX_CANVAS}
              step={10}
              prefix={<ArrowUpDown className={PREFIX_ICON_CLASS} />}
              suffix="px"
              className="w-full max-w-none"
              inputClassName="text-sm"
            />
          </div>
        </HoverTooltip>
      </div>
    </div>
  );
};

export default CanvasSizePanel;
