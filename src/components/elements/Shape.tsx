import React from 'react';
import { Group, Rect, Ellipse, Line, RegularPolygon, Star, Circle } from 'react-konva';
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
  const [isResizingRectangle, setIsResizingRectangle] = React.useState(false);
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
    const container = node.getStage()?.container();
    if (container) container.style.cursor = '';
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
    draggable: (draggable ?? !element.locked) && !isResizingRectangle,
    onDragEnd: handleDragEnd,
    onDragMoveCapture: () => {
      const stage = (window as any)?.stageRef?.current?.getStage?.();
      const container = stage?.container?.();
      if (container) container.style.cursor = element.locked ? '' : 'move';
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
                if (container) container.style.cursor = '';
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
                if (container) container.style.cursor = '';
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
    const halfW = innerWidth / 2;
    const halfH = innerHeight / 2;
    const rotationDeg = element.rotation || 0;
    const rotationRad = (rotationDeg * Math.PI) / 180;
    const cos = Math.cos(rotationRad);
    const sin = Math.sin(rotationRad);
    const cornerHandleSize = 10;
    const maxInsetX = Math.max(4, halfW - cornerHandleSize / 2 - 2);
    const maxInsetY = Math.max(4, halfH - cornerHandleSize / 2 - 2);
    const cornerPointInset = Math.min(26, maxInsetX, maxInsetY);

    const rotateToWorld = (localX: number, localY: number) => ({
      x: cx + localX * cos - localY * sin,
      y: cy + localX * sin + localY * cos,
    });

    const corners = {
      tl: rotateToWorld(-halfW, -halfH),
      tr: rotateToWorld(halfW, -halfH),
      br: rotateToWorld(halfW, halfH),
      bl: rotateToWorld(-halfW, halfH),
    } as const;

    const cornerOrder = ['tl', 'tr', 'br', 'bl'] as const;
    const oppositeCorner = {
      tl: 'br',
      tr: 'bl',
      br: 'tl',
      bl: 'tr',
    } as const;
    const defaultSign = {
      tl: { x: -1, y: -1 },
      tr: { x: 1, y: -1 },
      br: { x: 1, y: 1 },
      bl: { x: -1, y: 1 },
    } as const;

    const resizeFromCorner = (corner: typeof cornerOrder[number], worldX: number, worldY: number) => {
      const fixed = corners[oppositeCorner[corner]];
      const fixedToDraggedWorld = { x: worldX - fixed.x, y: worldY - fixed.y };
      const fixedToDraggedLocal = {
        x: fixedToDraggedWorld.x * cos + fixedToDraggedWorld.y * sin,
        y: -fixedToDraggedWorld.x * sin + fixedToDraggedWorld.y * cos,
      };

      const nextInnerWidth = Math.max(1, Math.abs(fixedToDraggedLocal.x));
      const nextInnerHeight = Math.max(1, Math.abs(fixedToDraggedLocal.y));
      const signX = fixedToDraggedLocal.x === 0 ? defaultSign[corner].x : Math.sign(fixedToDraggedLocal.x);
      const signY = fixedToDraggedLocal.y === 0 ? defaultSign[corner].y : Math.sign(fixedToDraggedLocal.y);

      const localCenterFromFixed = {
        x: signX * nextInnerWidth / 2,
        y: signY * nextInnerHeight / 2,
      };
      const worldCenter = {
        x: fixed.x + localCenterFromFixed.x * cos - localCenterFromFixed.y * sin,
        y: fixed.y + localCenterFromFixed.x * sin + localCenterFromFixed.y * cos,
      };

      const nextWidth = nextInnerWidth + padding * 2;
      const nextHeight = nextInnerHeight + padding * 2;

      onChange({
        x: worldCenter.x - nextWidth / 2,
        y: worldCenter.y - nextHeight / 2,
        width: nextWidth,
        height: nextHeight,
      });
    };

    const cornerRadius = Math.max(
      0,
      Math.min(props.cornerRadius ?? 6, innerWidth / 2, innerHeight / 2)
    );

    return (
      <Group {...common}>
        {isSelected && (
          <Group
            x={cx}
            y={cy}
            rotation={rotationDeg}
            listening={false}
          >
            <Rect
              x={-halfW}
              y={-halfH}
              width={innerWidth}
              height={innerHeight}
              stroke={outlineColor}
              strokeWidth={2}
              fillEnabled={false}
              cornerRadius={Math.max(0, Math.min(cornerRadius, halfW, halfH))}
            />
            {cornerOrder.map((cornerKey) => {
              const corner = {
                x: cornerKey === 'tl' || cornerKey === 'bl' ? -halfW : halfW,
                y: cornerKey === 'tl' || cornerKey === 'tr' ? -halfH : halfH,
              };
              return (
                <Circle
                  key={`point-${cornerKey}`}
                  x={corner.x + (corner.x < 0 ? cornerPointInset : -cornerPointInset)}
                  y={corner.y + (corner.y < 0 ? cornerPointInset : -cornerPointInset)}
                  radius={7}
                  fill="#e0f2fe"
                  stroke={outlineColor}
                  strokeWidth={2}
                />
              );
            })}
          </Group>
        )}
        {isSelected && cornerOrder.map((corner) => {
          const point = corners[corner];
          const cursor = corner === 'tl' || corner === 'br' ? 'nwse-resize' : 'nesw-resize';
          return (
            <Rect
              key={`corner-handle-${corner}`}
              x={point.x}
              y={point.y}
              width={cornerHandleSize}
              height={cornerHandleSize}
              offsetX={cornerHandleSize / 2}
              offsetY={cornerHandleSize / 2}
              fill="#ffffff"
              stroke={outlineColor}
              strokeWidth={2}
              shadowColor="rgba(0,0,0,0.15)"
              shadowBlur={3}
              shadowOffset={{ x: 0, y: 1 }}
              draggable={!element.locked}
              onDragStart={(e) => {
                e.cancelBubble = true;
                setIsResizingRectangle(true);
                const parent = e.target.getParent();
                parent?.stopDrag?.();
              }}
              onMouseDown={(e) => {
                e.cancelBubble = true;
                onSelect();
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                onSelect();
              }}
              onDragMove={(e) => resizeFromCorner(corner, e.target.x(), e.target.y())}
              onDragEnd={(e) => {
                resizeFromCorner(corner, e.target.x(), e.target.y());
                setIsResizingRectangle(false);
              }}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = cursor;
                e.target.scale({ x: 1.2, y: 1.2 });
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = '';
                e.target.scale({ x: 1, y: 1 });
              }}
            />
          );
        })}
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
