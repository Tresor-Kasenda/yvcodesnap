import React from 'react';
import { Group, Rect, Ellipse, Line, RegularPolygon, Star } from 'react-konva';
import type Konva from 'konva';
import type { ShapeElement } from '../../types';
import { useCanvasStore } from '../../store/canvasStore';

interface ShapeProps {
  element: ShapeElement;
  isSelected: boolean;
  onSelect: (e?: any) => void;
  onChange: (updates: Partial<ShapeElement>) => void;
  draggable?: boolean;
}

const Shape: React.FC<ShapeProps> = ({ element, isSelected, onSelect, onChange, draggable }) => {
  const { props, width, height } = element;
  const lineEndpointSelection = useCanvasStore((state) => state.lineEndpointSelection);
  const setLineEndpointSelection = useCanvasStore((state) => state.setLineEndpointSelection);
  const strokeWidth = props.strokeWidth ?? 2;
  const padding = Math.max(0, props.padding ?? 0);
  const innerWidth = Math.max(1, Math.abs(width) - padding * 2);
  const innerHeight = Math.max(1, Math.abs(height) - padding * 2);
  const outlineColor = '#3b82f6';

  const selectedOutlineForPolyLike = (node: React.ReactNode) =>
    isSelected ? node : null;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (element.locked) return;
    if (e.target !== e.currentTarget) return;

    const node = e.target;
    const dx = node.x();
    const dy = node.y();

    if (props.kind === 'line' && element.points) {
      const newPoints = element.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
      onChange({ points: newPoints });
    } else {
      onChange({
        x: element.x + dx,
        y: element.y + dy,
      });
    }

    // Reset group position
    node.x(0);
    node.y(0);
  };

  const common = {
    listening: true,
    onClick: onSelect,
    onTap: onSelect,
    onContextMenu: (e: any) => {
      e.evt?.preventDefault?.();
      e.cancelBubble = true;
      onSelect();
    },
    draggable: draggable ?? !element.locked,
    onDragEnd: handleDragEnd,
    onDragMoveCapture: () => {
      const stage = (window as any)?.stageRef?.current?.getStage?.();
      const container = stage?.container?.();
      if (container) container.style.cursor = element.locked ? 'default' : 'move';
    },
  };

  const setLinePoint = (isStart: boolean, point: { x: number; y: number }) => {
    if (!element.points || element.points.length < 2) return;
    const nextPoints = [...element.points];
    if (isStart) {
      nextPoints[0] = point;
    } else {
      nextPoints[nextPoints.length - 1] = point;
    }
    onChange({ points: nextPoints });
  };

  if (props.kind === 'line' && element.points && element.points.length >= 2) {
    const start = element.points[0];
    const end = element.points[element.points.length - 1];
    const activeEndpoint =
      lineEndpointSelection?.elementId === element.id
        ? lineEndpointSelection.endpoint
        : 'end';
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    const effectivePadding = length > 0 ? Math.min(padding, length / 2 - 0.5) : 0;
    const startX = effectivePadding > 0 ? start.x + (dx / length) * effectivePadding : start.x;
    const startY = effectivePadding > 0 ? start.y + (dy / length) * effectivePadding : start.y;
    const endX = effectivePadding > 0 ? end.x - (dx / length) * effectivePadding : end.x;
    const endY = effectivePadding > 0 ? end.y - (dy / length) * effectivePadding : end.y;
    const pts = [startX, startY, endX, endY];
    const handleSize = 10;
    const handleRotation = (Math.atan2(dy, dx) * 180) / Math.PI;
    return (
      <Group {...common}>
        <Line
          points={pts}
          lineCap="round"
          lineJoin="round"
          stroke={props.stroke}
          strokeWidth={strokeWidth}
          hitStrokeWidth={Math.max(12, strokeWidth + 8)}
          listening={true}
        />
        {isSelected && (
          <>
            <Rect
              x={start.x}
              y={start.y}
              width={handleSize}
              height={handleSize}
              offsetX={handleSize / 2}
              offsetY={handleSize / 2}
              rotation={handleRotation}
              fill={activeEndpoint === 'start' ? '#dbeafe' : '#ffffff'}
              stroke="#3b82f6"
              strokeWidth={2}
              shadowColor="rgba(0,0,0,0.15)"
              shadowBlur={4}
              shadowOffset={{ x: 0, y: 1 }}
              draggable={!element.locked}
              onMouseDown={(e) => {
                e.cancelBubble = true;
                setLineEndpointSelection(element.id, 'start');
                onSelect();
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                setLineEndpointSelection(element.id, 'start');
                onSelect();
              }}
              onDragMove={(e) => setLinePoint(true, { x: e.target.x(), y: e.target.y() })}
              onDragEnd={(e) => setLinePoint(true, { x: e.target.x(), y: e.target.y() })}
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
            <Rect
              x={end.x}
              y={end.y}
              width={handleSize}
              height={handleSize}
              offsetX={handleSize / 2}
              offsetY={handleSize / 2}
              rotation={handleRotation}
              fill={activeEndpoint === 'end' ? '#dbeafe' : '#ffffff'}
              stroke="#3b82f6"
              strokeWidth={2}
              shadowColor="rgba(0,0,0,0.15)"
              shadowBlur={4}
              shadowOffset={{ x: 0, y: 1 }}
              draggable={!element.locked}
              onMouseDown={(e) => {
                e.cancelBubble = true;
                setLineEndpointSelection(element.id, 'end');
                onSelect();
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                setLineEndpointSelection(element.id, 'end');
                onSelect();
              }}
              onDragMove={(e) => setLinePoint(false, { x: e.target.x(), y: e.target.y() })}
              onDragEnd={(e) => setLinePoint(false, { x: e.target.x(), y: e.target.y() })}
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
        )}
      </Group>
    );
  }

  if (props.kind === 'rectangle') {
    const cx = element.x + width / 2;
    const cy = element.y + height / 2;
    const cornerRadius = Math.max(
      0,
      Math.min(props.cornerRadius ?? 6, innerWidth / 2, innerHeight / 2)
    );
    return (
      <Group {...common}>
        {isSelected && (
          <Rect
            x={cx}
            y={cy}
            offsetX={(innerWidth + 8) / 2}
            offsetY={(innerHeight + 8) / 2}
            width={innerWidth + 8}
            height={innerHeight + 8}
            cornerRadius={8}
            stroke={outlineColor}
            strokeWidth={1.5}
            dash={[6, 4]}
            rotation={element.rotation}
            listening={false}
          />
        )}
        <Rect
          x={cx}
          y={cy}
          offsetX={innerWidth / 2}
          offsetY={innerHeight / 2}
          width={innerWidth}
          height={innerHeight}
          fill={props.fill || 'transparent'}
          stroke={props.stroke}
          strokeWidth={strokeWidth}
          cornerRadius={cornerRadius}
          rotation={element.rotation}
          listening={true}
        />
      </Group>
    );
  }

  if (props.kind === 'ellipse') {
    const cx = element.x + width / 2;
    const cy = element.y + height / 2;
    return (
      <Group {...common}>
        {isSelected && (
          <Ellipse
            x={cx}
            y={cy}
            radiusX={innerWidth / 2 + 4}
            radiusY={innerHeight / 2 + 4}
            stroke={outlineColor}
            strokeWidth={1.5}
            dash={[6, 4]}
            listening={false}
          />
        )}
        <Ellipse
          x={cx}
          y={cy}
          radiusX={innerWidth / 2}
          radiusY={innerHeight / 2}
          fill={props.fill || 'transparent'}
          stroke={props.stroke}
          strokeWidth={strokeWidth}
          rotation={element.rotation}
          listening={true}
        />
      </Group>
    );
  }

  if (props.kind === 'polygon') {
    const sides = props.sides || 5;
    const radius = Math.min(innerWidth, innerHeight) / 2;
    const cx = element.x + width / 2;
    const cy = element.y + height / 2;
    return (
      <Group {...common}>
        {selectedOutlineForPolyLike(
          <RegularPolygon
            x={cx}
            y={cy}
            sides={sides}
            radius={radius + 4}
            stroke={outlineColor}
            strokeWidth={1.5}
            dash={[6, 4]}
            listening={false}
          />
        )}
        <RegularPolygon
          x={cx}
          y={cy}
          sides={sides}
          radius={radius}
          fill={props.fill || 'transparent'}
          stroke={props.stroke}
          strokeWidth={strokeWidth}
          rotation={element.rotation}
          listening={true}
        />
      </Group>
    );
  }

  if (props.kind === 'star') {
    const points = props.sides || 5;
    const outerRadius = Math.min(innerWidth, innerHeight) / 2;
    const cx = element.x + width / 2;
    const cy = element.y + height / 2;
    return (
      <Group {...common}>
        {selectedOutlineForPolyLike(
          <Star
            x={cx}
            y={cy}
            numPoints={points}
            innerRadius={(outerRadius + 4) / 2.2}
            outerRadius={outerRadius + 4}
            stroke={outlineColor}
            strokeWidth={1.5}
            dash={[6, 4]}
            listening={false}
          />
        )}
        <Star
          x={cx}
          y={cy}
          numPoints={points}
          innerRadius={outerRadius / 2.2}
          outerRadius={outerRadius}
          fill={props.fill || 'transparent'}
          stroke={props.stroke}
          strokeWidth={strokeWidth}
          rotation={element.rotation}
          listening={true}
        />
      </Group>
    );
  }

  return null;
};

export default Shape;
