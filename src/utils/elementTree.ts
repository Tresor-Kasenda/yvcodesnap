import type { CanvasElement, GroupElement } from '../types';

const isGroupElement = (element: CanvasElement): element is GroupElement => element.type === 'group';

export const findElementById = (
  elements: CanvasElement[],
  id: string | null | undefined
): CanvasElement | null => {
  if (!id) return null;

  for (const element of elements) {
    if (element.id === id) return element;
    if (isGroupElement(element)) {
      const nested = findElementById(element.elements, id);
      if (nested) return nested;
    }
  }

  return null;
};

export const elementExistsById = (elements: CanvasElement[], id: string): boolean =>
  findElementById(elements, id) !== null;

export const updateElementById = (
  elements: CanvasElement[],
  id: string,
  updates: Partial<CanvasElement>
): boolean => {
  for (let i = 0; i < elements.length; i += 1) {
    const element = elements[i];
    if (element.id === id) {
      elements[i] = { ...element, ...updates } as CanvasElement;
      return true;
    }

    if (isGroupElement(element) && updateElementById(element.elements, id, updates)) {
      return true;
    }
  }

  return false;
};

export const removeElementsByIds = (elements: CanvasElement[], ids: Set<string>): boolean => {
  let changed = false;

  for (let i = elements.length - 1; i >= 0; i -= 1) {
    const element = elements[i];

    if (ids.has(element.id)) {
      elements.splice(i, 1);
      changed = true;
      continue;
    }

    if (isGroupElement(element) && removeElementsByIds(element.elements, ids)) {
      changed = true;
    }
  }

  return changed;
};
