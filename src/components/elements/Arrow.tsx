import React, { useRef, useMemo } from 'react';
import { Group, Arrow as KonvaArrow, Circle, Line, Text, Rect } from 'react-konva';
import type Konva from 'konva';
import type { ArrowElement } from '../../types';
import { useCanvasStore } from '../../store/canvasStore';

interface ArrowProps {
  element: ArrowElement;
  isSelected: boolean;
  onSelect: (e?: any) => void;
  onChange: (updates: Partial<ArrowElement>) => void;
  draggable?: boolean;
}

// Calculate bezier curve points for smooth curved arrows
const getBezierPoints = (
  start: { x: number; y: number },
  end: { x: number; y: number },
  controlPoints: { x: number; y: number }[] = []
): number[] => {
  const numSegments = 50;
  const points: number[] = [];

  if (controlPoints.length === 0) {
    // No control points, use auto-calculated curve
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    // Perpendicular offset for natural curve
    const cp = {
      x: midX - dy * 0.3,
      y: midY + dx * 0.3,
    };
    controlPoints = [cp];
  }

  if (controlPoints.length === 1) {
    // Quadratic bezier
    const cp = controlPoints[0];
    for (let t = 0; t <= 1; t += 1 / numSegments) {
      const x = Math.pow(1 - t, 2) * start.x + 2 * (1 - t) * t * cp.x + Math.pow(t, 2) * end.x;
      const y = Math.pow(1 - t, 2) * start.y + 2 * (1 - t) * t * cp.y + Math.pow(t, 2) * end.y;
      points.push(x, y);
    }
  } else if (controlPoints.length >= 2) {
    // Cubic bezier
    const cp1 = controlPoints[0];
    const cp2 = controlPoints[1];
    for (let t = 0; t <= 1; t += 1 / numSegments) {
      const x = Math.pow(1 - t, 3) * start.x + 3 * Math.pow(1 - t, 2) * t * cp1.x + 3 * (1 - t) * Math.pow(t, 2) * cp2.x + Math.pow(t, 3) * end.x;
      const y = Math.pow(1 - t, 3) * start.y + 3 * Math.pow(1 - t, 2) * t * cp1.y + 3 * (1 - t) * Math.pow(t, 2) * cp2.y + Math.pow(t, 3) * end.y;
      points.push(x, y);
    }
  }

  return points;
};

// Get point along bezier curve at parameter t (0-1)
const getPointOnBezier = (
  start: { x: number; y: number },
  end: { x: number; y: number },
  controlPoints: { x: number; y: number }[],
  t: number
): { x: number; y: number } => {
  if (controlPoints.length === 1) {
    const cp = controlPoints[0];
    return {
      x: Math.pow(1 - t, 2) * start.x + 2 * (1 - t) * t * cp.x + Math.pow(t, 2) * end.x,
      y: Math.pow(1 - t, 2) * start.y + 2 * (1 - t) * t * cp.y + Math.pow(t, 2) * end.y,
    };
  } else if (controlPoints.length >= 2) {
    const cp1 = controlPoints[0];
    const cp2 = controlPoints[1];
    return {
      x: Math.pow(1 - t, 3) * start.x + 3 * Math.pow(1 - t, 2) * t * cp1.x + 3 * (1 - t) * Math.pow(t, 2) * cp2.x + Math.pow(t, 3) * end.x,
      y: Math.pow(1 - t, 3) * start.y + 3 * Math.pow(1 - t, 2) * t * cp1.y + 3 * (1 - t) * Math.pow(t, 2) * cp2.y + Math.pow(t, 3) * end.y,
    };
  }
  // Linear
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
};

const Arrow: React.FC<ArrowProps> = ({ element, isSelected, onSelect, onChange, draggable }) => {
  const arrowRef = useRef<Konva.Arrow>(null);
  const arrowEndpointSelection = useCanvasStore((state) => state.arrowEndpointSelection);
  const setArrowEndpointSelection = useCanvasStore((state) => state.setArrowEndpointSelection);
  const { points, props } = element;
  const start = points[0];
  const end = points[points.length - 1];
  const activeEndpoint =
    arrowEndpointSelection?.elementId === element.id
      ? arrowEndpointSelection.endpoint
      : 'end';

  const hasValidEndpoints =
    !!start &&
    !!end &&
    Number.isFinite(start.x) &&
    Number.isFinite(start.y) &&
    Number.isFinite(end.x) &&
    Number.isFinite(end.y);

  const dx = hasValidEndpoints ? end.x - start.x : 0;
  const dy = hasValidEndpoints ? end.y - start.y : 0;
  const endpointHandleRotation = (Math.atan2(dy, dx) * 180) / Math.PI;
  const isDegenerate = !hasValidEndpoints || Math.hypot(dx, dy) < 0.5;

  // Konva can throw when drawing shadows for 0x0 bounds (e.g. when start/end overlap).
  // Use a tiny, non-zero end point for rendering only.
  const renderStart = hasValidEndpoints ? start : { x: 0, y: 0 };
  const renderEnd = hasValidEndpoints
    ? (isDegenerate ? { x: start.x + 1, y: start.y + 1 } : end)
    : { x: 1, y: 1 };

  // Get control points (either from props or auto-generate for curved)
  const controlPoints = useMemo(() => {
    if (props.style === 'curved') {
      if (props.controlPoints && props.controlPoints.length > 0) {
        return props.controlPoints;
      }
      // Auto-generate a control point
      const midX = (renderStart.x + renderEnd.x) / 2;
      const midY = (renderStart.y + renderEnd.y) / 2;
      const dx = renderEnd.x - renderStart.x;
      const dy = renderEnd.y - renderStart.y;
      return [{
        x: midX - dy * 0.3,
        y: midY + dx * 0.3,
      }];
    }
    return [];
  }, [props.style, props.controlPoints, renderStart.x, renderStart.y, renderEnd.x, renderEnd.y]);

  // Calculate points for rendering
  const flatPoints = useMemo(() => {
    if (props.style === 'curved') {
      return getBezierPoints(renderStart, renderEnd, controlPoints);
    }
    return points.flatMap(p => [p.x, p.y]);
  }, [props.style, points, renderStart, renderEnd, controlPoints]);

  const handlePointDrag = (index: number, e: Konva.KonvaEventObject<DragEvent>) => {
    const newPoints = [...points];
    newPoints[index] = {
      x: e.target.x(),
      y: e.target.y(),
    };
    onChange({ points: newPoints });
  };

  const handleControlPointDrag = (index: number, e: Konva.KonvaEventObject<DragEvent>) => {
    const newControlPoints = [...controlPoints];
    newControlPoints[index] = {
      x: e.target.x(),
      y: e.target.y(),
    };
    onChange({ props: { ...props, controlPoints: newControlPoints } });
  };

  // Modern arrow head calculations
  const headRadius = props.radius ?? 12;
  const pointerLength = props.head === 'none' ? 0 : Math.max(headRadius, props.thickness * 2, 8);
  const pointerWidth = props.head === 'none' ? 0 : Math.max(headRadius * 0.85, props.thickness * 1.8, 8);

  // Calculate label position
  const labelPosition = props.labelPosition ?? 0.5;
  const labelPoint = props.style === 'curved'
    ? getPointOnBezier(renderStart, renderEnd, controlPoints, labelPosition)
    : { x: renderStart.x + (renderEnd.x - renderStart.x) * labelPosition, y: renderStart.y + (renderEnd.y - renderStart.y) * labelPosition };

  return (
    <Group
      draggable={draggable ?? !element.locked}
      onContextMenu={(e) => {
        e.evt.preventDefault();
        e.cancelBubble = true;
        onSelect();
      }}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        if (e.target !== e.currentTarget) return;

        const node = e.target;
        const dx = node.x();
        const dy = node.y();

        const newPoints = points.map((p) => ({
          x: p.x + dx,
          y: p.y + dy,
        }));

        let newControlPoints = undefined;
        if (props.controlPoints && props.controlPoints.length > 0) {
          newControlPoints = props.controlPoints.map((p) => ({
            x: p.x + dx,
            y: p.y + dy,
          }));
        }

        // Reset relative position
        node.x(0);
        node.y(0);

        onChange({
          points: newPoints,
          props: {
            ...props,
            controlPoints: newControlPoints || props.controlPoints,
          },
        });
      }}
    >
      {/* If endpoints overlap/invalid, render a small dot instead of a shadowed arrow to avoid Konva draw crashes. */}
      {isDegenerate && (
        <Circle
          x={renderStart.x}
          y={renderStart.y}
          radius={Math.max(6, props.thickness * 2)}
          fill={props.color}
          opacity={0.8}
          onClick={onSelect}
          onTap={onSelect}
          hitStrokeWidth={20}
        />
      )}

      {/* For curved arrows, use Line with many points */}
      {!isDegenerate && props.style === 'curved' ? (
        <Line
          points={flatPoints}
          stroke={props.color}
          strokeWidth={props.thickness}
          lineCap="round"
          lineJoin="round"
          shadowColor={props.color}
          shadowBlur={8}
          shadowOpacity={0.2}
          shadowOffset={{ x: 0, y: 0 }}
          onClick={onSelect}
          onTap={onSelect}
          hitStrokeWidth={20}
        />
      ) : (
        !isDegenerate && (
          <KonvaArrow
            ref={arrowRef}
            points={flatPoints}
            stroke={props.color}
            strokeWidth={props.thickness}
            fill={props.head === 'filled' ? props.color : 'transparent'}
            pointerLength={pointerLength}
            pointerWidth={pointerWidth}
            lineCap="round"
            lineJoin="round"
            shadowColor={props.color}
            shadowBlur={8}
            shadowOpacity={0.2}
            shadowOffset={{ x: 0, y: 0 }}
            onClick={onSelect}
            onTap={onSelect}
            hitStrokeWidth={20}
          />
        )
      )}

      {/* Arrow head for curved arrows (drawn separately) */}
      {!isDegenerate && props.style === 'curved' && props.head !== 'none' && (
        <KonvaArrow
          points={[
            flatPoints[flatPoints.length - 4] ?? renderStart.x,
            flatPoints[flatPoints.length - 3] ?? renderStart.y,
            renderEnd.x,
            renderEnd.y,
          ]}
          stroke={props.color}
          strokeWidth={props.thickness}
          fill={props.head === 'filled' ? props.color : 'transparent'}
          pointerLength={pointerLength}
          pointerWidth={pointerWidth}
          lineCap="round"
          lineJoin="round"
        />
      )}

      {/* Label text */}
      {props.label && (
        <Text
          x={labelPoint.x}
          y={labelPoint.y - (20 + (props.padding ?? 0))}
          text={props.label}
          fontSize={14}
          fill={props.color}
          fontFamily="Inter, sans-serif"
          align="center"
          offsetX={props.label.length * 3.5}
        />
      )}

      {/* Control points when selected (for curved arrows) */}
      {isSelected && props.style === 'curved' && (
        <>
          {/* Control point lines */}
          {controlPoints.map((cp, index) => (
            <React.Fragment key={`line-${index}`}>
              <Line
                points={index === 0 ? [start.x, start.y, cp.x, cp.y] : [controlPoints[index - 1].x, controlPoints[index - 1].y, cp.x, cp.y]}
                stroke="#60a5fa"
                strokeWidth={1}
                dash={[4, 4]}
                opacity={0.5}
              />
              {index === controlPoints.length - 1 && (
                <Line
                  points={[cp.x, cp.y, end.x, end.y]}
                  stroke="#60a5fa"
                  strokeWidth={1}
                  dash={[4, 4]}
                  opacity={0.5}
                />
              )}
            </React.Fragment>
          ))}

          {/* Control point handles */}
          {controlPoints.map((cp, index) => (
            <Circle
              key={`cp-${index}`}
              x={cp.x}
              y={cp.y}
              radius={6}
              fill="#60a5fa"
              stroke="#ffffff"
              strokeWidth={2}
              shadowColor="rgba(0,0,0,0.3)"
              shadowBlur={4}
              shadowOffset={{ x: 0, y: 1 }}
              draggable={!element.locked}
              onDragMove={(e) => handleControlPointDrag(index, e)}
              onDragEnd={(e) => handleControlPointDrag(index, e)}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'move';
                e.target.scale({ x: 1.3, y: 1.3 });
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
                e.target.scale({ x: 1, y: 1 });
              }}
            />
          ))}
        </>
      )}

      {/* Endpoint control points when selected */}
      {isSelected && (
        <>
          {(() => {
            const handleSize = 10;
            return (
              <>
                {/* Start point */}
                <Rect
                  x={start.x}
                  y={start.y}
                  width={handleSize}
                  height={handleSize}
                  offsetX={handleSize / 2}
                  offsetY={handleSize / 2}
                  rotation={endpointHandleRotation}
                  fill={activeEndpoint === 'start' ? '#dbeafe' : '#ffffff'}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  shadowColor="rgba(0,0,0,0.15)"
                  shadowBlur={4}
                  shadowOffset={{ x: 0, y: 1 }}
                  draggable={!element.locked}
                  onMouseDown={(e) => {
                    e.cancelBubble = true;
                    setArrowEndpointSelection(element.id, 'start');
                    onSelect();
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    setArrowEndpointSelection(element.id, 'start');
                    onSelect();
                  }}
                  onDragMove={(e) => handlePointDrag(0, e)}
                  onDragEnd={(e) => handlePointDrag(0, e)}
                  onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'grab';
                    e.target.scale({ x: 1.4, y: 1.4 });
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                    e.target.scale({ x: 1, y: 1 });
                  }}
                />
                {/* End point */}
                <Rect
                  x={end.x}
                  y={end.y}
                  width={handleSize}
                  height={handleSize}
                  offsetX={handleSize / 2}
                  offsetY={handleSize / 2}
                  rotation={endpointHandleRotation}
                  fill={activeEndpoint === 'end' ? '#dbeafe' : '#ffffff'}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  shadowColor="rgba(0,0,0,0.15)"
                  shadowBlur={4}
                  shadowOffset={{ x: 0, y: 1 }}
                  draggable={!element.locked}
                  onMouseDown={(e) => {
                    e.cancelBubble = true;
                    setArrowEndpointSelection(element.id, 'end');
                    onSelect();
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    setArrowEndpointSelection(element.id, 'end');
                    onSelect();
                  }}
                  onDragMove={(e) => handlePointDrag(points.length - 1, e)}
                  onDragEnd={(e) => handlePointDrag(points.length - 1, e)}
                  onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'grab';
                    e.target.scale({ x: 1.4, y: 1.4 });
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                    e.target.scale({ x: 1, y: 1 });
                  }}
                />
              </>
            );
          })()}
        </>
      )}
    </Group>
  );
};

export default Arrow;
