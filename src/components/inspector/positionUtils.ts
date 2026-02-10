import type { CanvasElement } from '../../types';

export type HorizontalPosition = 'left' | 'center' | 'right';
export type VerticalPosition = 'top' | 'middle' | 'bottom';

type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const EPSILON = 1;

export const getElementBoundsForPosition = (element: CanvasElement): Bounds => {
  if (element.type === 'arrow') {
    const points = element.points ?? [];
    if (points.length === 0) return { x: element.x, y: element.y, width: 0, height: 0 };

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    points.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  if (element.type === 'shape' && element.props.kind === 'line' && element.points?.length) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    element.points.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  const width = 'width' in element ? element.width : 0;
  const height = 'height' in element ? element.height : 0;
  return { x: element.x, y: element.y, width, height };
};

export const getHorizontalPosition = (bounds: Bounds, canvasWidth: number): HorizontalPosition | undefined => {
  if (Math.abs(bounds.x) <= EPSILON) return 'left';
  if (Math.abs(bounds.x + bounds.width - canvasWidth) <= EPSILON) return 'right';
  if (Math.abs(bounds.x + bounds.width / 2 - canvasWidth / 2) <= EPSILON) return 'center';
  return undefined;
};

export const getVerticalPosition = (bounds: Bounds, canvasHeight: number): VerticalPosition | undefined => {
  if (Math.abs(bounds.y) <= EPSILON) return 'top';
  if (Math.abs(bounds.y + bounds.height - canvasHeight) <= EPSILON) return 'bottom';
  if (Math.abs(bounds.y + bounds.height / 2 - canvasHeight / 2) <= EPSILON) return 'middle';
  return undefined;
};

type PositionUpdateOptions = {
  horizontal?: HorizontalPosition;
  vertical?: VerticalPosition;
};

export const createElementPositionUpdate = (
  element: CanvasElement,
  canvasWidth: number,
  canvasHeight: number,
  options: PositionUpdateOptions
): Partial<CanvasElement> | null => {
  const bounds = getElementBoundsForPosition(element);
  let targetX = bounds.x;
  let targetY = bounds.y;

  if (options.horizontal === 'left') {
    targetX = 0;
  } else if (options.horizontal === 'center') {
    targetX = (canvasWidth - bounds.width) / 2;
  } else if (options.horizontal === 'right') {
    targetX = canvasWidth - bounds.width;
  }

  if (options.vertical === 'top') {
    targetY = 0;
  } else if (options.vertical === 'middle') {
    targetY = (canvasHeight - bounds.height) / 2;
  } else if (options.vertical === 'bottom') {
    targetY = canvasHeight - bounds.height;
  }

  const dx = targetX - bounds.x;
  const dy = targetY - bounds.y;

  if (Math.abs(dx) <= EPSILON && Math.abs(dy) <= EPSILON) {
    return null;
  }

  const updates: Partial<CanvasElement> = {
    x: element.x + dx,
    y: element.y + dy,
  };

  const points = (element as { points?: { x: number; y: number }[] }).points;
  if (Array.isArray(points)) {
    (updates as { points?: { x: number; y: number }[] }).points = points.map((point) => ({
      x: point.x + dx,
      y: point.y + dy,
    }));
  }

  return updates;
};
