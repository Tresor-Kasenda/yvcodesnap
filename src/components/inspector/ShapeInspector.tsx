import React, { useMemo } from 'react';
import { Circle, Hash, Minus, RotateCw, Square } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import type { ShapeElement } from '../../types';
import NumberField from '../ui/NumberField';
import ToggleSwitch from '../ui/ToggleSwitch';
import AccessibleColorPicker from '../ui/AccessibleColorPicker';

const LABEL_CLASS = 'block text-[10px] font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-500 mb-1.5';
const COLOR_INPUT_CLASS = 'flex-1 bg-transparent text-neutral-900 dark:text-white text-[11px] focus:outline-none font-mono';
const SEGMENT_BUTTON_BASE = 'flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all';
const SEGMENT_BUTTON_ACTIVE = 'bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm';
const SEGMENT_BUTTON_IDLE = 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5';
const PREFIX_ICON_CLASS = 'h-3 w-3';

const clampMin = (value: number, fallback: number, min: number) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, value);
};

const ShapeInspector: React.FC<{ element: ShapeElement }> = ({ element }) => {
  const updateElement = useCanvasStore((state) => state.updateElement);
  const saveToHistory = useCanvasStore((state) => state.saveToHistory);
  const lineEndpointSelection = useCanvasStore((state) => state.lineEndpointSelection);
  const setLineEndpointSelection = useCanvasStore((state) => state.setLineEndpointSelection);
  const { props, width, height } = element;
  const isLine = props.kind === 'line';
  const isPolygonLike = props.kind === 'polygon' || props.kind === 'star';
  const canFill = props.kind === 'rectangle' || props.kind === 'ellipse' || props.kind === 'polygon' || props.kind === 'star';

  const lineStart = element.points?.[0] ?? { x: element.x, y: element.y };
  const lineEnd = element.points?.[element.points.length - 1] ?? { x: element.x, y: element.y };
  const activeLineEndpoint =
    lineEndpointSelection?.elementId === element.id ? lineEndpointSelection.endpoint : 'end';
  const activeLinePoint = activeLineEndpoint === 'start' ? lineStart : lineEnd;
  const fixedLinePoint = activeLineEndpoint === 'start' ? lineEnd : lineStart;

  const lineSize = useMemo(
    () => ({
      width: Math.abs(lineEnd.x - lineStart.x),
      height: Math.abs(lineEnd.y - lineStart.y),
    }),
    [lineStart.x, lineStart.y, lineEnd.x, lineEnd.y]
  );

  const lineRotation = useMemo(() => {
    const dx = activeLinePoint.x - fixedLinePoint.x;
    const dy = activeLinePoint.y - fixedLinePoint.y;
    if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) return 0;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }, [activeLinePoint.x, activeLinePoint.y, fixedLinePoint.x, fixedLinePoint.y]);

  const updateProps = (newProps: Partial<ShapeElement['props']>) => {
    updateElement(element.id, { props: { ...props, ...newProps } });
  };

  const updateSize = (updates: Partial<Pick<ShapeElement, 'width' | 'height'>>) => {
    updateElement(element.id, updates);
  };

  const updatePosition = (updates: Partial<Pick<ShapeElement, 'x' | 'y'>>) => {
    updateElement(element.id, updates);
  };

  const updateRotation = (rotation: number) => {
    updateElement(element.id, { rotation });
  };

  const updateLinePoints = (nextStart: { x: number; y: number }, nextEnd: { x: number; y: number }) => {
    const basePoints = element.points && element.points.length >= 2
      ? [...element.points]
      : [nextStart, nextEnd];
    basePoints[0] = nextStart;
    basePoints[basePoints.length - 1] = nextEnd;
    updateElement(element.id, { points: basePoints });
  };

  const updateLineStart = (coord: 'x' | 'y', value: number) => {
    const safe = Number.isFinite(value) ? value : lineStart[coord];
    const nextStart = { ...lineStart, [coord]: safe };
    updateLinePoints(nextStart, { ...lineEnd });
  };

  const updateLineEnd = (coord: 'x' | 'y', value: number) => {
    const safe = Number.isFinite(value) ? value : lineEnd[coord];
    const nextEnd = { ...lineEnd, [coord]: safe };
    updateLinePoints({ ...lineStart }, nextEnd);
  };

  const updateLineFromActivePoint = (nextActive: { x: number; y: number }) => {
    if (activeLineEndpoint === 'start') {
      updateLinePoints(nextActive, { ...lineEnd });
      return;
    }
    updateLinePoints({ ...lineStart }, nextActive);
  };

  const updateLineActiveCoord = (coord: 'x' | 'y', value: number) => {
    const safe = Number.isFinite(value) ? value : activeLinePoint[coord];
    const nextActive = { ...activeLinePoint, [coord]: safe };
    updateLineFromActivePoint(nextActive);
  };

  const updateLineSize = (axis: 'width' | 'height', value: number) => {
    const safe = clampMin(value, axis === 'width' ? lineSize.width : lineSize.height, 0);
    const nextActive = { ...activeLinePoint };

    if (axis === 'width') {
      const direction = activeLinePoint.x - fixedLinePoint.x >= 0 ? 1 : -1;
      nextActive.x = fixedLinePoint.x + direction * safe;
    } else {
      const direction = activeLinePoint.y - fixedLinePoint.y >= 0 ? 1 : -1;
      nextActive.y = fixedLinePoint.y + direction * safe;
    }

    updateLineFromActivePoint(nextActive);
  };

  const updateLineRotation = (rotation: number) => {
    const safe = Number.isFinite(rotation) ? rotation : lineRotation;
    const dx = activeLinePoint.x - fixedLinePoint.x;
    const dy = activeLinePoint.y - fixedLinePoint.y;
    const length = Math.hypot(dx, dy);
    if (length < 0.0001) return;
    const radians = (safe * Math.PI) / 180;
    const nextActive = {
      x: fixedLinePoint.x + Math.cos(radians) * length,
      y: fixedLinePoint.y + Math.sin(radians) * length,
    };
    updateLineFromActivePoint(nextActive);
  };

  const updateEllipseRadius = (axis: 'x' | 'y', value: number) => {
    const radius = clampMin(value, axis === 'x' ? width / 2 : height / 2, 1);
    const centerX = element.x + width / 2;
    const centerY = element.y + height / 2;
    const nextWidth = axis === 'x' ? radius * 2 : width;
    const nextHeight = axis === 'y' ? radius * 2 : height;

    updateElement(element.id, {
      x: centerX - nextWidth / 2,
      y: centerY - nextHeight / 2,
      width: nextWidth,
      height: nextHeight,
    });
  };

  const updatePolygonRadius = (value: number) => {
    const radius = clampMin(value, Math.min(width, height) / 2, 1);
    const centerX = element.x + width / 2;
    const centerY = element.y + height / 2;
    const diameter = radius * 2;

    updateElement(element.id, {
      x: centerX - diameter / 2,
      y: centerY - diameter / 2,
      width: diameter,
      height: diameter,
    });
  };

  const displayWidth = isLine ? lineSize.width : width;
  const displayHeight = isLine ? lineSize.height : height;
  const displayX = isLine ? activeLinePoint.x : element.x;
  const displayY = isLine ? activeLinePoint.y : element.y;
  const rectangleRadiusMax = Math.max(0, Math.floor(Math.min(width, height) / 2));
  const polygonRadius = Math.max(1, Math.round(Math.min(width, height) / 2));

  return (
    <div className="space-y-3">
      <div>
        <label className={LABEL_CLASS}>Geometry</label>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            value={Math.round(displayX)}
            onChange={(v) => {
              const next = typeof v === 'number' ? v : displayX;
              if (isLine) {
                updateLineActiveCoord('x', next);
              } else {
                updatePosition({ x: next });
              }
            }}
            onBlur={saveToHistory}
            prefix="X"
            suffix="px"
            className="w-full"
            inputClassName="text-[11px]"
          />
          <NumberField
            value={Math.round(displayY)}
            onChange={(v) => {
              const next = typeof v === 'number' ? v : displayY;
              if (isLine) {
                updateLineActiveCoord('y', next);
              } else {
                updatePosition({ y: next });
              }
            }}
            onBlur={saveToHistory}
            prefix="Y"
            suffix="px"
            className="w-full"
            inputClassName="text-[11px]"
          />
          <NumberField
            value={Math.round(displayWidth)}
            onChange={(v) => {
              const next = typeof v === 'number' ? v : displayWidth;
              if (isLine) {
                updateLineSize('width', next);
              } else {
                updateSize({ width: clampMin(next, width, 1) });
              }
            }}
            onBlur={saveToHistory}
            min={1}
            prefix="W"
            suffix="px"
            className="w-full"
            inputClassName="text-[11px]"
          />
          <NumberField
            value={Math.round(displayHeight)}
            onChange={(v) => {
              const next = typeof v === 'number' ? v : displayHeight;
              if (isLine) {
                updateLineSize('height', next);
              } else {
                updateSize({ height: clampMin(next, height, 1) });
              }
            }}
            onBlur={saveToHistory}
            min={1}
            prefix="H"
            suffix="px"
            className="w-full"
            inputClassName="text-[11px]"
          />
        </div>
      </div>

      {isLine && (
        <div className="space-y-3">
          <div>
            <label className={LABEL_CLASS}>Active Endpoint</label>
            <div className="flex gap-1.5 p-0.5 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
              <button
                onClick={() => setLineEndpointSelection(element.id, 'start')}
                className={`${SEGMENT_BUTTON_BASE} ${activeLineEndpoint === 'start' ? SEGMENT_BUTTON_ACTIVE : SEGMENT_BUTTON_IDLE}`}
              >
                Start
              </button>
              <button
                onClick={() => setLineEndpointSelection(element.id, 'end')}
                className={`${SEGMENT_BUTTON_BASE} ${activeLineEndpoint === 'end' ? SEGMENT_BUTTON_ACTIVE : SEGMENT_BUTTON_IDLE}`}
              >
                End
              </button>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Endpoints</label>
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                value={Math.round(lineStart.x)}
                onChange={(v) => updateLineStart('x', typeof v === 'number' ? v : lineStart.x)}
                onFocus={() => setLineEndpointSelection(element.id, 'start')}
                onBlur={saveToHistory}
                prefix="SX"
                suffix="px"
                className="w-full"
                inputClassName="text-[11px]"
              />
              <NumberField
                value={Math.round(lineStart.y)}
                onChange={(v) => updateLineStart('y', typeof v === 'number' ? v : lineStart.y)}
                onFocus={() => setLineEndpointSelection(element.id, 'start')}
                onBlur={saveToHistory}
                prefix="SY"
                suffix="px"
                className="w-full"
                inputClassName="text-[11px]"
              />
              <NumberField
                value={Math.round(lineEnd.x)}
                onChange={(v) => updateLineEnd('x', typeof v === 'number' ? v : lineEnd.x)}
                onFocus={() => setLineEndpointSelection(element.id, 'end')}
                onBlur={saveToHistory}
                prefix="EX"
                suffix="px"
                className="w-full"
                inputClassName="text-[11px]"
              />
              <NumberField
                value={Math.round(lineEnd.y)}
                onChange={(v) => updateLineEnd('y', typeof v === 'number' ? v : lineEnd.y)}
                onFocus={() => setLineEndpointSelection(element.id, 'end')}
                onBlur={saveToHistory}
                prefix="EY"
                suffix="px"
                className="w-full"
                inputClassName="text-[11px]"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className={LABEL_CLASS}>
            Rotation: {Math.round(((isLine ? lineRotation : element.rotation || 0) * 10)) / 10}°
          </label>
          <NumberField
            value={Math.round(isLine ? lineRotation : element.rotation || 0)}
            onChange={(v) => {
              const next = typeof v === 'number' ? v : isLine ? lineRotation : element.rotation || 0;
              if (isLine) {
                updateLineRotation(next);
              } else {
                updateRotation(next);
              }
            }}
            onBlur={saveToHistory}
            min={-180}
            max={180}
            step={1}
            prefix={<RotateCw className={PREFIX_ICON_CLASS} />}
            suffix="°"
            className="w-full"
            inputClassName="text-[11px]"
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Padding: {props.padding ?? 0}px</label>
          <NumberField
            value={Math.round(props.padding ?? 0)}
            onChange={(v) => {
              const next = typeof v === 'number' ? v : props.padding ?? 0;
              updateProps({ padding: clampMin(next, props.padding ?? 0, 0) });
            }}
            onBlur={saveToHistory}
            min={0}
            max={80}
            step={1}
            prefix={<Square className={PREFIX_ICON_CLASS} />}
            suffix="px"
            className="w-full"
            inputClassName="text-[11px]"
          />
        </div>

        {props.kind === 'rectangle' && (
          <div>
            <label className={LABEL_CLASS}>Radius: {Math.round(props.cornerRadius ?? 6)}px</label>
            <NumberField
              value={Math.round(props.cornerRadius ?? 6)}
              onChange={(v) => {
                const next = typeof v === 'number' ? v : props.cornerRadius ?? 6;
                updateProps({ cornerRadius: Math.max(0, Math.min(rectangleRadiusMax, next)) });
              }}
              onBlur={saveToHistory}
              min={0}
              max={rectangleRadiusMax}
              step={1}
              prefix={<Circle className={PREFIX_ICON_CLASS} />}
              suffix="px"
              className="w-full"
              inputClassName="text-[11px]"
            />
          </div>
        )}

        {isPolygonLike && (
          <div>
            <label className={LABEL_CLASS}>Radius: {polygonRadius}px</label>
            <NumberField
              value={polygonRadius}
              onChange={(v) => {
                const next = typeof v === 'number' ? v : polygonRadius;
                updatePolygonRadius(next);
              }}
              onBlur={saveToHistory}
              min={1}
              max={800}
              step={1}
              prefix={<Circle className={PREFIX_ICON_CLASS} />}
              suffix="px"
              className="w-full"
              inputClassName="text-[11px]"
            />
          </div>
        )}

        <div>
          <label className={LABEL_CLASS}>Stroke Width: {props.strokeWidth}px</label>
          <NumberField
            value={Math.round(props.strokeWidth)}
            onChange={(v) => {
              const next = typeof v === 'number' ? v : props.strokeWidth;
              updateProps({ strokeWidth: clampMin(next, props.strokeWidth, 1) });
            }}
            onBlur={saveToHistory}
            min={1}
            max={24}
            step={1}
            prefix={<Minus className={PREFIX_ICON_CLASS} />}
            suffix="px"
            className="w-full"
            inputClassName="text-[11px]"
          />
        </div>

        {isPolygonLike && (
          <div>
            <label className={LABEL_CLASS}>{props.kind === 'star' ? 'Points' : 'Sides'}: {props.sides || 5}</label>
            <NumberField
              value={props.sides || 5}
              onChange={(v) => {
                const next = typeof v === 'number' ? v : props.sides || 5;
                updateProps({ sides: Math.max(3, Math.min(10, Math.round(next))) });
              }}
              onBlur={saveToHistory}
              min={3}
              max={10}
              step={1}
              prefix={<Hash className={PREFIX_ICON_CLASS} />}
              className="w-full"
              inputClassName="text-[11px]"
            />
          </div>
        )}
      </div>

      {props.kind === 'ellipse' && (
        <div>
          <label className={LABEL_CLASS}>Radius</label>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              value={Math.round(width / 2)}
              onChange={(v) => updateEllipseRadius('x', typeof v === 'number' ? v : width / 2)}
              onBlur={saveToHistory}
              min={1}
              prefix="RX"
              suffix="px"
              className="w-full"
              inputClassName="text-[11px]"
            />
            <NumberField
              value={Math.round(height / 2)}
              onChange={(v) => updateEllipseRadius('y', typeof v === 'number' ? v : height / 2)}
              onBlur={saveToHistory}
              min={1}
              prefix="RY"
              suffix="px"
              className="w-full"
              inputClassName="text-[11px]"
            />
          </div>
        </div>
      )}

      <div>
        <label className={LABEL_CLASS}>Stroke</label>
        <div className="flex gap-2 items-center p-1.5 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
          <AccessibleColorPicker
            value={props.stroke}
            onChange={(color) => updateProps({ stroke: color })}
            ariaLabel="Shape stroke color"
            className="h-6 w-6"
          />
          <input
            type="text"
            value={props.stroke}
            onChange={(e) => updateProps({ stroke: e.target.value })}
            className={COLOR_INPUT_CLASS}
          />
        </div>
      </div>

      {canFill && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={LABEL_CLASS}>Fill</label>
            <ToggleSwitch
              checked={!!props.fill && props.fill !== 'transparent'}
              onCheckedChange={(checked) =>
                updateProps({
                  fill: checked
                    ? (props.fill && props.fill !== 'transparent' ? props.fill : '#60a5f4')
                    : 'transparent',
                })
              }
              ariaLabel="Toggle fill"
            />
          </div>
          <div className="flex gap-2 items-center p-1.5 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
            <AccessibleColorPicker
              value={props.fill && props.fill !== 'transparent' ? props.fill : '#60a5f4'}
              onChange={(color) => updateProps({ fill: color })}
              ariaLabel="Shape fill color"
              className="h-6 w-6"
            />
            <input
              type="text"
              value={props.fill && props.fill !== 'transparent' ? props.fill : 'transparent'}
              onChange={(e) => updateProps({ fill: e.target.value })}
              className={COLOR_INPUT_CLASS}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default ShapeInspector;
