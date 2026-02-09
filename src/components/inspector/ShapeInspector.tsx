import React, { useMemo } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import type { ShapeElement } from '../../types';
import SliderField from '../ui/SliderField';
import ToggleSwitch from '../ui/ToggleSwitch';
import AccessibleColorPicker from '../ui/AccessibleColorPicker';

const LABEL_CLASS = 'block text-[10px] font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-500 mb-2';
const INPUT_CLASS =
  'w-full bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white px-3 py-2 rounded-lg text-sm border border-neutral-200 dark:border-white/5 focus:border-blue-500/50 focus:outline-none';
const COLOR_INPUT_CLASS = 'flex-1 bg-transparent text-neutral-900 dark:text-white text-sm focus:outline-none font-mono';
const SEGMENT_BUTTON_BASE = 'flex-1 py-2 rounded-md text-[10px] font-medium transition-all';
const SEGMENT_BUTTON_ACTIVE = 'bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm';
const SEGMENT_BUTTON_IDLE = 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5';

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

  return (
    <div className="space-y-4">
      <div>
        <label className={LABEL_CLASS}>Geometry</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={LABEL_CLASS}>X</label>
            <input
              type="number"
              value={Math.round(displayX)}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (isLine) {
                  updateLineActiveCoord('x', next);
                } else {
                  updatePosition({ x: next });
                }
              }}
              onBlur={saveToHistory}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Y</label>
            <input
              type="number"
              value={Math.round(displayY)}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (isLine) {
                  updateLineActiveCoord('y', next);
                } else {
                  updatePosition({ y: next });
                }
              }}
              onBlur={saveToHistory}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>W</label>
            <input
              type="number"
              value={Math.round(displayWidth)}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (isLine) {
                  updateLineSize('width', next);
                } else {
                  updateSize({ width: clampMin(next, width, 1) });
                }
              }}
              onBlur={saveToHistory}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>H</label>
            <input
              type="number"
              value={Math.round(displayHeight)}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (isLine) {
                  updateLineSize('height', next);
                } else {
                  updateSize({ height: clampMin(next, height, 1) });
                }
              }}
              onBlur={saveToHistory}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>

      {isLine && (
        <div className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Active Endpoint</label>
            <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
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
              <div>
                <label className={LABEL_CLASS}>Start X</label>
                <input
                  type="number"
                  value={Math.round(lineStart.x)}
                  onFocus={() => setLineEndpointSelection(element.id, 'start')}
                  onChange={(e) => updateLineStart('x', Number(e.target.value))}
                  onBlur={saveToHistory}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Start Y</label>
                <input
                  type="number"
                  value={Math.round(lineStart.y)}
                  onFocus={() => setLineEndpointSelection(element.id, 'start')}
                  onChange={(e) => updateLineStart('y', Number(e.target.value))}
                  onBlur={saveToHistory}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>End X</label>
                <input
                  type="number"
                  value={Math.round(lineEnd.x)}
                  onFocus={() => setLineEndpointSelection(element.id, 'end')}
                  onChange={(e) => updateLineEnd('x', Number(e.target.value))}
                  onBlur={saveToHistory}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>End Y</label>
                <input
                  type="number"
                  value={Math.round(lineEnd.y)}
                  onFocus={() => setLineEndpointSelection(element.id, 'end')}
                  onChange={(e) => updateLineEnd('y', Number(e.target.value))}
                  onBlur={saveToHistory}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className={LABEL_CLASS}>
          Rotation: {Math.round(((isLine ? lineRotation : element.rotation || 0) * 10)) / 10}°
        </label>
        <SliderField
          min={-180}
          max={180}
          step={1}
          value={isLine ? lineRotation : element.rotation || 0}
          onValueChange={(value) => {
            if (isLine) {
              updateLineRotation(value);
            } else {
              updateRotation(value);
            }
          }}
          ariaLabel="Shape rotation"
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Padding: {props.padding ?? 0}px</label>
        <SliderField
          min={0}
          max={80}
          step={1}
          value={props.padding ?? 0}
          onValueChange={(value) => updateProps({ padding: value })}
          ariaLabel="Shape padding"
        />
      </div>

      {props.kind === 'rectangle' && (
        <div>
          <label className={LABEL_CLASS}>Radius: {Math.round(props.cornerRadius ?? 6)}px</label>
          <SliderField
            min={0}
            max={120}
            step={1}
            value={props.cornerRadius ?? 6}
            onValueChange={(value) => updateProps({ cornerRadius: value })}
            ariaLabel="Rectangle corner radius"
          />
        </div>
      )}

      {props.kind === 'ellipse' && (
        <div>
          <label className={LABEL_CLASS}>Radius</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LABEL_CLASS}>Radius X</label>
              <input
                type="number"
                value={Math.round(width / 2)}
                onChange={(e) => updateEllipseRadius('x', Number(e.target.value))}
                onBlur={saveToHistory}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Radius Y</label>
              <input
                type="number"
                value={Math.round(height / 2)}
                onChange={(e) => updateEllipseRadius('y', Number(e.target.value))}
                onBlur={saveToHistory}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>
      )}

      {isPolygonLike && (
        <div>
          <label className={LABEL_CLASS}>Radius: {Math.round(Math.min(width, height) / 2)}px</label>
          <SliderField
            min={1}
            max={800}
            step={1}
            value={Math.max(1, Math.round(Math.min(width, height) / 2))}
            onValueChange={updatePolygonRadius}
            ariaLabel={`${props.kind} radius`}
          />
        </div>
      )}

      <div>
        <label className={LABEL_CLASS}>Stroke</label>
        <div className="flex gap-2 items-center p-2 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
          <AccessibleColorPicker
            value={props.stroke}
            onChange={(color) => updateProps({ stroke: color })}
            ariaLabel="Shape stroke color"
            className="h-7 w-7"
          />
          <input
            type="text"
            value={props.stroke}
            onChange={(e) => updateProps({ stroke: e.target.value })}
            className={COLOR_INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Stroke Width: {props.strokeWidth}px</label>
        <SliderField
          min={1}
          max={24}
          step={1}
          value={props.strokeWidth}
          onValueChange={(value) => updateProps({ strokeWidth: value })}
          ariaLabel="Shape stroke width"
        />
      </div>

      {canFill && (
        <div>
          <div className="flex items-center justify-between mb-2">
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
          <div className="flex gap-2 items-center p-2 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
            <AccessibleColorPicker
              value={props.fill && props.fill !== 'transparent' ? props.fill : '#60a5f4'}
              onChange={(color) => updateProps({ fill: color })}
              ariaLabel="Shape fill color"
              className="h-7 w-7"
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

      {isPolygonLike && (
        <div>
          <label className={LABEL_CLASS}>{props.kind === 'star' ? 'Points' : 'Sides'}: {props.sides || 5}</label>
          <SliderField
            min={3}
            max={10}
            step={1}
            value={props.sides || 5}
            onValueChange={(value) => updateProps({ sides: value })}
            ariaLabel={`${props.kind} sides`}
          />
        </div>
      )}
    </div>
  );
};

export default ShapeInspector;
