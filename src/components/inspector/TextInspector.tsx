import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import type { TextElement } from '../../types';
import { FONT_FAMILIES } from '../../types';
import { loadFont } from '../../utils/fontLoader';
import SliderField from '../ui/SliderField';
import ToggleSwitch from '../ui/ToggleSwitch';
import AccessibleColorPicker from '../ui/AccessibleColorPicker';
import HoverTooltip from '../ui/HoverTooltip';
import PositionControls from './PositionControls';
import {
  createElementPositionUpdate,
  getElementBoundsForPosition,
  getHorizontalPosition,
  getVerticalPosition,
} from './positionUtils';

interface TextInspectorProps {
  element: TextElement;
}

const TextInspector: React.FC<TextInspectorProps> = ({ element }) => {
  const { snap, updateElement, saveToHistory } = useCanvasStore();
  const bounds = getElementBoundsForPosition(element);
  const horizontalPosition = getHorizontalPosition(bounds, snap.meta.width);
  const verticalPosition = getVerticalPosition(bounds, snap.meta.height);

  const update = (updates: Partial<TextElement>) => {
    updateElement(element.id, updates);
  };

  const updateProps = (props: Partial<TextElement['props']>) => {
    update({ props: { ...element.props, ...props } });
  };

  const handleFontChange = (fontFamily: string) => {
    loadFont(fontFamily);
    updateProps({ fontFamily });
  };

  return (
    <div className="space-y-4">
      {/* Text */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-2">Text</label>
        <textarea
          value={element.props.text}
          onChange={(e) => updateProps({ text: e.target.value })}
          onBlur={saveToHistory}
          className="w-full h-24 bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white text-sm p-3 rounded-lg resize-y border border-neutral-200 dark:border-white/5 focus:border-blue-500/50 focus:outline-none"
        />
      </div>

      {/* Font Family with Preview */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-2">Font Family</label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto p-1 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
          {FONT_FAMILIES.text.map((font) => (
            <HoverTooltip key={font} label={font}>
              <button
                onClick={() => handleFontChange(font)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-left transition-all ${
                  element.props.fontFamily === font
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/5 border border-transparent'
                }`}
                aria-label={`Text font ${font}`}
              >
                <span style={{ fontFamily: font }}>{font}</span>
                {element.props.fontFamily === font && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </HoverTooltip>
          ))}
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

      {/* Font size */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-2">
          Size: {element.props.fontSize}px
        </label>
        <SliderField
          min={12}
          max={96}
          step={1}
          value={element.props.fontSize}
          onValueChange={(v) => updateProps({ fontSize: v })}
          ariaLabel="Text size"
        />
      </div>

      {/* Color */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-2">Color</label>
        <div className="flex gap-2 items-center p-2 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
          <AccessibleColorPicker
            value={element.props.color}
            onChange={(color) => updateProps({ color })}
            ariaLabel="Text color"
          />
          <input
            type="text"
            value={element.props.color}
            onChange={(e) => updateProps({ color: e.target.value })}
            className="flex-1 bg-transparent text-neutral-900 dark:text-white text-sm focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Style buttons */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-2">Style</label>
        <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
          <HoverTooltip label="Bold">
            <button
              onClick={() => updateProps({ bold: !element.props.bold })}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
                element.props.bold
                  ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'
              }`}
              aria-label="Toggle bold"
            >
              B
            </button>
          </HoverTooltip>
          <HoverTooltip label="Italic">
            <button
              onClick={() => updateProps({ italic: !element.props.italic })}
              className={`flex-1 py-2 rounded-md text-sm italic transition-all ${
                element.props.italic
                  ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'
              }`}
              aria-label="Toggle italic"
            >
              I
            </button>
          </HoverTooltip>
          <HoverTooltip label="Underline">
            <button
              onClick={() => updateProps({ underline: !element.props.underline })}
              className={`flex-1 py-2 rounded-md text-sm underline transition-all ${
                element.props.underline
                  ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'
              }`}
              aria-label="Toggle underline"
            >
              U
            </button>
          </HoverTooltip>
        </div>
      </div>

      {/* Alignment */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-2">Alignment</label>
        <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
          <HoverTooltip label="Align left">
            <button
              onClick={() => updateProps({ align: 'left' })}
              className={`flex-1 py-2 rounded-md text-sm transition-all ${
                element.props.align === 'left'
                  ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'
              }`}
              aria-label="Align left"
            >
              <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
              </svg>
            </button>
          </HoverTooltip>
          <HoverTooltip label="Align center">
            <button
              onClick={() => updateProps({ align: 'center' })}
              className={`flex-1 py-2 rounded-md text-sm transition-all ${
                element.props.align === 'center'
                  ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'
              }`}
              aria-label="Align center"
            >
              <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
              </svg>
            </button>
          </HoverTooltip>
          <HoverTooltip label="Align right">
            <button
              onClick={() => updateProps({ align: 'right' })}
              className={`flex-1 py-2 rounded-md text-sm transition-all ${
                element.props.align === 'right'
                  ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'
              }`}
              aria-label="Align right"
            >
              <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
              </svg>
            </button>
          </HoverTooltip>
        </div>
      </div>

      {/* Background */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">Background</label>
          <ToggleSwitch
            checked={!!element.props.background}
            onCheckedChange={(checked) =>
              updateProps({
                background: checked ? { color: element.props.background?.color || 'rgba(0,0,0,0.5)' } : null,
              })
            }
            ariaLabel="Toggle text background"
          />
        </div>
        {element.props.background && (
          <div className="flex gap-2 items-center p-2 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
            <AccessibleColorPicker
              value={element.props.background.color}
              onChange={(color) => updateProps({ background: { color } })}
              ariaLabel="Text background color"
              className="h-6 w-6"
            />
            <input
              type="text"
              value={element.props.background.color}
              onChange={(e) => updateProps({ background: { color: e.target.value } })}
              className="flex-1 bg-transparent text-neutral-900 dark:text-white text-xs focus:outline-none font-mono"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TextInspector;
