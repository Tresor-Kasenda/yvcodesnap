import React from 'react';
import { Group, Rect, Ellipse, Line, RegularPolygon, Star } from 'react-konva';
import type Konva from 'konva';
import type { ShapeElement } from '../../types';

interface ShapeProps {
  element: ShapeElement;
  isSelected: boolean;
  onSelect: (e?: any) => void;
  onChange: (updates: Partial<ShapeElement>) => void;
  draggable?: boolean;
}

const Shape: React.FC<ShapeProps> = ({ element, isSelected, onSelect, onChange, draggable }) => {
  const { props, width, height } = element;
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

  if (props.kind === 'line' && element.points && element.points.length >= 2) {
    const start = element.points[0];
    const end = element.points[element.points.length - 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    const effectivePadding = length > 0 ? Math.min(padding, length / 2 - 0.5) : 0;
    const startX = effectivePadding > 0 ? start.x + (dx / length) * effectivePadding : start.x;
    const startY = effectivePadding > 0 ? start.y + (dy / length) * effectivePadding : start.y;
    const endX = effectivePadding > 0 ? end.x - (dx / length) * effectivePadding : end.x;
    const endY = effectivePadding > 0 ? end.y - (dy / length) * effectivePadding : end.y;
    const pts = [startX, startY, endX, endY];
    return (
      <Group {...common}>
        {isSelected && (
          <Line
            points={pts}
            stroke={outlineColor}
            strokeWidth={strokeWidth + 6}
            lineCap="round"
            lineJoin="round"
            opacity={0.35}
            listening={false}
          />
        )}
        <Line
          points={pts}
          lineCap="round"
          lineJoin="round"
          stroke={props.stroke}
          strokeWidth={strokeWidth}
          listening={true}
        />
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
