import React, { useMemo } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import type { ArrowElement } from '../../types';
import SliderField from '../ui/SliderField';
import AccessibleColorPicker from '../ui/AccessibleColorPicker';
import HoverTooltip from '../ui/HoverTooltip';
import PositionControls from './PositionControls';
import {
  createElementPositionUpdate,
  getElementBoundsForPosition,
  getHorizontalPosition,
  getVerticalPosition,
} from './positionUtils';

interface ArrowInspectorProps {
  element: ArrowElement;
}

const LABEL_CLASS = 'block text-[10px] font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-500 mb-2';
const INPUT_CLASS =
  'w-full bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white px-3 py-2 rounded-lg text-[10px] border border-neutral-200 dark:border-white/5 focus:border-blue-500/50 focus:outline-none';
const COLOR_INPUT_CLASS = 'flex-1 bg-transparent text-neutral-900 dark:text-white text-sm focus:outline-none font-mono';
const SEGMENT_BUTTON_BASE = 'flex-1 py-2 rounded-md text-[10px] font-medium transition-all';
const SEGMENT_BUTTON_ACTIVE = 'bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm';
const SEGMENT_BUTTON_IDLE = 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5';

const clampMin = (value: number, fallback: number, min: number) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, value);
};

const ArrowInspector: React.FC<ArrowInspectorProps> = ({ element }) => {
  const snap = useCanvasStore((state) => state.snap);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const saveToHistory = useCanvasStore((state) => state.saveToHistory);
  const arrowEndpointSelection = useCanvasStore((state) => state.arrowEndpointSelection);
  const setArrowEndpointSelection = useCanvasStore((state) => state.setArrowEndpointSelection);

  const update = (updates: Partial<ArrowElement>) => {
    updateElement(element.id, updates);
  };

  const updateProps = (props: Partial<ArrowElement['props']>) => {
    update({ props: { ...element.props, ...props } });
  };

  const start = element.points[0];
  const end = element.points[element.points.length - 1];
  const activeArrowEndpoint =
    arrowEndpointSelection?.elementId === element.id ? arrowEndpointSelection.endpoint : 'end';
  const activeArrowPoint = activeArrowEndpoint === 'start' ? start : end;
  const fixedArrowPoint = activeArrowEndpoint === 'start' ? end : start;

  const size = useMemo(
    () => ({
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    }),
    [start.x, start.y, end.x, end.y]
  );

  const rotation = useMemo(() => {
    const dx = activeArrowPoint.x - fixedArrowPoint.x;
    const dy = activeArrowPoint.y - fixedArrowPoint.y;
    if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) return 0;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }, [activeArrowPoint.x, activeArrowPoint.y, fixedArrowPoint.x, fixedArrowPoint.y]);

  const updateArrowPoints = (
    nextStart: { x: number; y: number },
    nextEnd: { x: number; y: number }
  ) => {
    const basePoints = element.points.length >= 2 ? [...element.points] : [nextStart, nextEnd];
    basePoints[0] = nextStart;
    basePoints[basePoints.length - 1] = nextEnd;
    update({ points: basePoints });
  };

  const updateStart = (coord: 'x' | 'y', value: number) => {
    const safe = Number.isFinite(value) ? value : start[coord];
    const nextStart = { ...start, [coord]: safe };
    updateArrowPoints(nextStart, { ...end });
  };

  const updateEnd = (coord: 'x' | 'y', value: number) => {
    const safe = Number.isFinite(value) ? value : end[coord];
    const nextEnd = { ...end, [coord]: safe };
    updateArrowPoints({ ...start }, nextEnd);
  };

  const updateFromActivePoint = (nextActive: { x: number; y: number }) => {
    if (activeArrowEndpoint === 'start') {
      updateArrowPoints(nextActive, { ...end });
      return;
    }
    updateArrowPoints({ ...start }, nextActive);
  };

  const updateActiveCoord = (coord: 'x' | 'y', value: number) => {
    const safe = Number.isFinite(value) ? value : activeArrowPoint[coord];
    const nextActive = { ...activeArrowPoint, [coord]: safe };
    updateFromActivePoint(nextActive);
  };

  const updateBoundsSize = (axis: 'width' | 'height', value: number) => {
    const safe = clampMin(value, axis === 'width' ? size.width : size.height, 0);
    const nextActive = { ...activeArrowPoint };

    if (axis === 'width') {
      const direction = activeArrowPoint.x - fixedArrowPoint.x >= 0 ? 1 : -1;
      nextActive.x = fixedArrowPoint.x + direction * safe;
    } else {
      const direction = activeArrowPoint.y - fixedArrowPoint.y >= 0 ? 1 : -1;
      nextActive.y = fixedArrowPoint.y + direction * safe;
    }

    updateFromActivePoint(nextActive);
  };

  const updateArrowRotation = (nextRotation: number) => {
    const safe = Number.isFinite(nextRotation) ? nextRotation : rotation;
    const dx = activeArrowPoint.x - fixedArrowPoint.x;
    const dy = activeArrowPoint.y - fixedArrowPoint.y;
    const length = Math.hypot(dx, dy);
    if (length < 0.0001) return;

    const radians = (safe * Math.PI) / 180;
    const nextActive = {
      x: fixedArrowPoint.x + Math.cos(radians) * length,
      y: fixedArrowPoint.y + Math.sin(radians) * length,
    };
    updateFromActivePoint(nextActive);
  };

  const addControlPoint = () => {
    const currentControlPoints = element.props.controlPoints || [];

    if (currentControlPoints.length < 2) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const dx = end.x - start.x;
      const dy = end.y - start.y;

      const nextPoint = currentControlPoints.length === 0
        ? { x: midX - dy * 0.3, y: midY + dx * 0.3 }
        : { x: midX + dy * 0.3, y: midY - dx * 0.3 };

      updateProps({ controlPoints: [...currentControlPoints, nextPoint] });
    }
  };

  const removeControlPoint = (index: number) => {
    const currentControlPoints = element.props.controlPoints || [];
    updateProps({ controlPoints: currentControlPoints.filter((_, i) => i !== index) });
  };

  const resetControlPoints = () => {
    updateProps({ controlPoints: [] });
  };

  const displayX = activeArrowPoint.x;
  const displayY = activeArrowPoint.y;
  const displayWidth = size.width;
  const displayHeight = size.height;
  const bounds = getElementBoundsForPosition(element);
  const horizontalPosition = getHorizontalPosition(bounds, snap.meta.width);
  const verticalPosition = getVerticalPosition(bounds, snap.meta.height);

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
              onChange={(e) => updateActiveCoord('x', Number(e.target.value))}
              onBlur={saveToHistory}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Y</label>
            <input
              type="number"
              value={Math.round(displayY)}
              onChange={(e) => updateActiveCoord('y', Number(e.target.value))}
              onBlur={saveToHistory}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>W</label>
            <input
              type="number"
              value={Math.round(displayWidth)}
              onChange={(e) => updateBoundsSize('width', Number(e.target.value))}
              onBlur={saveToHistory}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>H</label>
            <input
              type="number"
              value={Math.round(displayHeight)}
              onChange={(e) => updateBoundsSize('height', Number(e.target.value))}
              onBlur={saveToHistory}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>

      <PositionControls
        horizontal={horizontalPosition}
        vertical={verticalPosition}
        onHorizontalChange={(horizontal) => {
          const updates = createElementPositionUpdate(element, snap.meta.width, snap.meta.height, { horizontal });
          if (updates) updateElement(element.id, updates);
        }}
        onVerticalChange={(vertical) => {
          const updates = createElementPositionUpdate(element, snap.meta.width, snap.meta.height, { vertical });
          if (updates) updateElement(element.id, updates);
        }}
      />

      <div>
        <label className={LABEL_CLASS}>Active Endpoint</label>
        <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
          <HoverTooltip label="Select start endpoint">
            <button
              onClick={() => setArrowEndpointSelection(element.id, 'start')}
              className={`${SEGMENT_BUTTON_BASE} ${activeArrowEndpoint === 'start' ? SEGMENT_BUTTON_ACTIVE : SEGMENT_BUTTON_IDLE}`}
              aria-label="Select start endpoint"
            >
              Start
            </button>
          </HoverTooltip>
          <HoverTooltip label="Select end endpoint">
            <button
              onClick={() => setArrowEndpointSelection(element.id, 'end')}
              className={`${SEGMENT_BUTTON_BASE} ${activeArrowEndpoint === 'end' ? SEGMENT_BUTTON_ACTIVE : SEGMENT_BUTTON_IDLE}`}
              aria-label="Select end endpoint"
            >
              End
            </button>
          </HoverTooltip>
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Endpoints</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={LABEL_CLASS}>Start X</label>
            <input
              type="number"
              value={Math.round(start.x)}
              onFocus={() => setArrowEndpointSelection(element.id, 'start')}
              onChange={(e) => updateStart('x', Number(e.target.value))}
              onBlur={saveToHistory}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Start Y</label>
            <input
              type="number"
              value={Math.round(start.y)}
              onFocus={() => setArrowEndpointSelection(element.id, 'start')}
              onChange={(e) => updateStart('y', Number(e.target.value))}
              onBlur={saveToHistory}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>End X</label>
            <input
              type="number"
              value={Math.round(end.x)}
              onFocus={() => setArrowEndpointSelection(element.id, 'end')}
              onChange={(e) => updateEnd('x', Number(e.target.value))}
              onBlur={saveToHistory}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>End Y</label>
            <input
              type="number"
              value={Math.round(end.y)}
              onFocus={() => setArrowEndpointSelection(element.id, 'end')}
              onChange={(e) => updateEnd('y', Number(e.target.value))}
              onBlur={saveToHistory}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Rotation: {Math.round(rotation * 10) / 10}°</label>
        <SliderField
          min={-180}
          max={180}
          step={1}
          value={rotation}
          onValueChange={updateArrowRotation}
          ariaLabel="Arrow rotation"
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Style</label>
        <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
          <HoverTooltip label="Straight arrow">
            <button
              onClick={() => updateProps({ style: 'straight' })}
              className={`${SEGMENT_BUTTON_BASE} ${element.props.style === 'straight' ? SEGMENT_BUTTON_ACTIVE : SEGMENT_BUTTON_IDLE}`}
              aria-label="Straight arrow"
            >
              Straight
            </button>
          </HoverTooltip>
          <HoverTooltip label="Curved arrow">
            <button
              onClick={() => updateProps({ style: 'curved' })}
              className={`${SEGMENT_BUTTON_BASE} ${element.props.style === 'curved' ? SEGMENT_BUTTON_ACTIVE : SEGMENT_BUTTON_IDLE}`}
              aria-label="Curved arrow"
            >
              Curved
            </button>
          </HoverTooltip>
        </div>
      </div>

      {element.props.style === 'curved' && (
        <div>
          <label className={LABEL_CLASS}>Control Points ({(element.props.controlPoints || []).length}/2)</label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <HoverTooltip label="Add a control point" disabled={(element.props.controlPoints || []).length >= 2}>
                <button
                  onClick={addControlPoint}
                  disabled={(element.props.controlPoints || []).length >= 2}
                  className="flex-1 py-2 px-3 rounded-lg text-[10px] font-medium bg-blue-600/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Add control point"
                >
                  + Add Point
                </button>
              </HoverTooltip>
              <HoverTooltip label="Reset control points" disabled={(element.props.controlPoints || []).length === 0}>
                <button
                  onClick={resetControlPoints}
                  disabled={(element.props.controlPoints || []).length === 0}
                  className="py-2 px-3 rounded-lg text-[10px] font-medium bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Reset control points"
                >
                  Reset
                </button>
              </HoverTooltip>
            </div>
            {(element.props.controlPoints || []).length > 0 && (
              <div className="space-y-1">
                {(element.props.controlPoints || []).map((controlPoint, index) => (
                  <div key={index} className="flex items-center justify-between py-1.5 px-2 bg-neutral-100 dark:bg-white/5 rounded-md">
                    <span className="text-[10px] text-neutral-600 dark:text-neutral-400">
                      Point {index + 1}: ({Math.round(controlPoint.x)}, {Math.round(controlPoint.y)})
                    </span>
                    <HoverTooltip label="Remove control point">
                      <button
                        onClick={() => removeControlPoint(index)}
                        className="p-1 rounded hover:bg-red-500/20 text-neutral-500 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        aria-label="Remove control point"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </HoverTooltip>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-neutral-500 dark:text-neutral-500">
              Drag the blue handles on the canvas to adjust the curve shape.
            </p>
          </div>
        </div>
      )}

      <div>
        <label className={LABEL_CLASS}>Color</label>
        <div className="flex gap-2 items-center p-2 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
          <AccessibleColorPicker
            value={element.props.color}
            onChange={(color) => updateProps({ color })}
            ariaLabel="Arrow color"
            className="h-4 w-4"
          />
          <input
            type="text"
            value={element.props.color}
            onChange={(e) => updateProps({ color: e.target.value })}
            className={COLOR_INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Thickness: {element.props.thickness}px</label>
        <SliderField
          min={1}
          max={12}
          step={1}
          value={element.props.thickness}
          onValueChange={(value) => updateProps({ thickness: value })}
          ariaLabel="Arrow thickness"
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Radius: {Math.round(element.props.radius ?? 12)}px</label>
        <SliderField
          min={8}
          max={48}
          step={1}
          value={element.props.radius ?? 12}
          onValueChange={(value) => updateProps({ radius: value })}
          ariaLabel="Arrow head radius"
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Padding: {Math.round(element.props.padding ?? 0)}px</label>
        <SliderField
          min={0}
          max={40}
          step={1}
          value={element.props.padding ?? 0}
          onValueChange={(value) => updateProps({ padding: value })}
          ariaLabel="Arrow label padding"
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Arrow Head</label>
        <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
          <HoverTooltip label="Filled arrow head">
            <button
              onClick={() => updateProps({ head: 'filled' })}
              className={`${SEGMENT_BUTTON_BASE} ${element.props.head === 'filled' ? SEGMENT_BUTTON_ACTIVE : SEGMENT_BUTTON_IDLE}`}
              aria-label="Filled arrow head"
            >
              Filled
            </button>
          </HoverTooltip>
          <HoverTooltip label="Outline arrow head">
            <button
              onClick={() => updateProps({ head: 'outline' })}
              className={`${SEGMENT_BUTTON_BASE} ${element.props.head === 'outline' ? SEGMENT_BUTTON_ACTIVE : SEGMENT_BUTTON_IDLE}`}
              aria-label="Outline arrow head"
            >
              Outline
            </button>
          </HoverTooltip>
          <HoverTooltip label="No arrow head">
            <button
              onClick={() => updateProps({ head: 'none' })}
              className={`${SEGMENT_BUTTON_BASE} ${element.props.head === 'none' ? SEGMENT_BUTTON_ACTIVE : SEGMENT_BUTTON_IDLE}`}
              aria-label="No arrow head"
            >
              None
            </button>
          </HoverTooltip>
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Label</label>
        <input
          type="text"
          value={element.props.label || ''}
          onChange={(e) => updateProps({ label: e.target.value || undefined })}
          onBlur={saveToHistory}
          placeholder="Add a label..."
          className={INPUT_CLASS}
        />
      </div>

      {element.props.label && (
        <div>
          <label className={LABEL_CLASS}>Label Position: {Math.round((element.props.labelPosition || 0.5) * 100)}%</label>
          <SliderField
            min={0}
            max={100}
            step={1}
            value={(element.props.labelPosition || 0.5) * 100}
            onValueChange={(value) => updateProps({ labelPosition: value / 100 })}
            ariaLabel="Arrow label position"
          />
        </div>
      )}

      <div className="pt-2 border-t border-neutral-200 dark:border-white/5">
        <p className="text-[10px] text-neutral-500 dark:text-neutral-500">
          Drag the square handles on the canvas to move arrow endpoints.
        </p>
      </div>
    </div>
  );
};

export default ArrowInspector;
