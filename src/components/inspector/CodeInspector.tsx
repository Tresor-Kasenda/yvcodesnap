import React, { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import type { CodeElement, LineHighlight } from '../../types';
import { LANGUAGES, FONT_FAMILIES, CODE_THEMES } from '../../types';
import { detectLanguage } from '../../utils/highlighter';
import { loadFont } from '../../utils/fontLoader';
import CodeEditor from './CodeEditor';
import SelectField from '../ui/SelectField';
import NumberField from '../ui/NumberField';
import SliderField from '../ui/SliderField';
import ToggleSwitch from '../ui/ToggleSwitch';
import HoverTooltip from '../ui/HoverTooltip';
import PositionControls from './PositionControls';
import {
  createElementPositionUpdate,
  getElementBoundsForPosition,
  getHorizontalPosition,
  getVerticalPosition,
} from './positionUtils';

interface CodeInspectorProps {
  element: CodeElement;
}

const CodeInspector: React.FC<CodeInspectorProps> = ({ element }) => {
  const { snap, updateElement, saveToHistory } = useCanvasStore();
  const [highlightFrom, setHighlightFrom] = useState('');
  const [highlightTo, setHighlightTo] = useState('');
  const [highlightStyle, setHighlightStyle] = useState<'focus' | 'added' | 'removed'>('focus');

  const update = (updates: Partial<CodeElement>) => {
    updateElement(element.id, updates);
  };

  const updateProps = (props: Partial<CodeElement['props']>) => {
    update({ props: { ...element.props, ...props } });
  };

  const handleCodeChange = (code: string) => {
    updateProps({ code });
  };

  const handleAutoDetect = () => {
    const detected = detectLanguage(element.props.code);
    updateProps({ language: detected });
  };

  const addHighlight = () => {
    const from = parseInt(highlightFrom);
    const to = parseInt(highlightTo) || from;
    if (isNaN(from) || from < 1) return;

    const newHighlight: LineHighlight = { from, to: Math.max(from, to), style: highlightStyle };
    const highlights = [...element.props.highlights, newHighlight];
    updateProps({ highlights });
    saveToHistory();
    setHighlightFrom('');
    setHighlightTo('');
  };

  const removeHighlight = (index: number) => {
    const highlights = element.props.highlights.filter((_, i) => i !== index);
    updateProps({ highlights });
    saveToHistory();
  };

  const totalLines = element.props.code.split('\n').length;
  const bounds = getElementBoundsForPosition(element);
  const horizontalPosition = getHorizontalPosition(bounds, snap.meta.width);
  const verticalPosition = getVerticalPosition(bounds, snap.meta.height);

  return (
    <div className="space-y-4">
      {/* Code editor */}
      <div>
        <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">Code</label>
        <CodeEditor
          value={element.props.code}
          onChange={handleCodeChange}
          onBlur={saveToHistory}
          language={element.props.language}
          theme={element.props.theme}
        />
      </div>

      {/* Language */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-neutral-600 dark:text-neutral-400">Language</label>
          <HoverTooltip label="Auto-detect language">
            <button
              onClick={handleAutoDetect}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              aria-label="Auto-detect language"
            >
              Auto-detect
            </button>
          </HoverTooltip>
        </div>
        <SelectField
          value={element.props.language}
          onValueChange={(v) => updateProps({ language: v })}
          options={LANGUAGES.map((lang) => ({ value: lang, label: lang }))}
        />
      </div>

      {/* Theme */}
      <div>
        <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">Theme</label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
          {CODE_THEMES.map((theme) => (
            <HoverTooltip key={theme.id} label={theme.name}>
              <button
                onClick={() => updateProps({ theme: theme.id })}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-all ${element.props.theme === theme.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                  }`}
                aria-label={`Theme ${theme.name}`}
              >
                <div
                  className="w-4 h-4 rounded border border-neutral-300 dark:border-white/20 shrink-0"
                  style={{ backgroundColor: theme.bg }}
                />
                <span className="truncate">{theme.name}</span>
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

      {/* Font */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-2">Font Family</label>
        <div className="space-y-1 max-h-36 overflow-y-auto p-1 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
          {FONT_FAMILIES.code.map((font) => (
            <HoverTooltip key={font} label={font}>
              <button
                onClick={() => {
                  loadFont(font);
                  updateProps({ fontFamily: font });
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-left transition-all ${element.props.fontFamily === font
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/5 border border-transparent'
                  }`}
                aria-label={`Code font ${font}`}
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

      {/* Font size & Line height */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">Size</label>
          <NumberField
            value={element.props.fontSize}
            onChange={(v) => updateProps({ fontSize: typeof v === 'number' ? v : 14 })}
            min={10}
            max={32}
            step={1}
            prefix="S"
            suffix="px"
            className="w-full"
            inputClassName="text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">Line Height</label>
          <NumberField
            value={element.props.lineHeight}
            onChange={(v) => updateProps({ lineHeight: typeof v === 'number' ? v : 1.5 })}
            min={1}
            max={3}
            step={0.1}
            prefix="L"
            suffix="px"
            className="w-full"
            inputClassName="text-sm"
          />
        </div>
      </div>

      {/* Line numbers & Focus Mode */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-neutral-600 dark:text-neutral-400">Line Numbers</label>
          <ToggleSwitch
            checked={element.props.lineNumbers}
            onCheckedChange={(checked) => updateProps({ lineNumbers: checked })}
            ariaLabel="Toggle line numbers"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <label className="text-sm text-neutral-600 dark:text-neutral-400">Focus Mode</label>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-500">Dims non-highlighted lines</span>
          </div>
          <ToggleSwitch
            checked={element.props.focusMode || false}
            onCheckedChange={(checked) => updateProps({ focusMode: checked })}
            ariaLabel="Toggle focus mode"
          />
        </div>
      </div>

      {/* Padding & Corner radius */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">Padding</label>
          <NumberField
            value={element.props.padding}
            onChange={(v) => updateProps({ padding: typeof v === 'number' ? v : 0 })}
            min={0}
            max={64}
            step={2}
            prefix="P"
            suffix="px"
            className="w-full"
            inputClassName="text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">Radius</label>
          <NumberField
            value={element.props.cornerRadius}
            onChange={(v) => updateProps({ cornerRadius: typeof v === 'number' ? v : 0 })}
            min={0}
            max={32}
            step={1}
            prefix="R"
            suffix="px"
            className="w-full"
            inputClassName="text-sm"
          />
        </div>
      </div>

      {/* Shadow */}
      <div>
        <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">
          Shadow Blur: {element.props.shadow.blur}
        </label>
        <SliderField
          min={0}
          max={64}
          step={1}
          value={element.props.shadow.blur}
          onValueChange={(v) =>
            updateProps({ shadow: { ...element.props.shadow, blur: v } })
          }
          ariaLabel="Shadow blur"
        />
      </div>

      {/* Line Highlights */}
      <div>
        <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">
          Line Highlights <span className="text-neutral-500 dark:text-neutral-500">({totalLines} lines)</span>
        </label>

        {/* Existing highlights */}
        {element.props.highlights.length > 0 && (
          <div className="space-y-1 mb-3">
            {element.props.highlights.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-neutral-200 dark:bg-neutral-700 px-2 py-1.5 rounded text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${h.style === 'focus' ? 'bg-yellow-400' :
                        h.style === 'added' ? 'bg-green-400' : 'bg-red-400'
                      }`}
                  />
                  <span className="text-neutral-900 dark:text-white">
                    {h.from === h.to ? `Line ${h.from}` : `Lines ${h.from}-${h.to}`}
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400 text-xs">({h.style})</span>
                </div>
                <HoverTooltip label="Remove highlight">
                  <button
                    onClick={() => removeHighlight(i)}
                    className="text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 text-lg leading-none"
                    aria-label="Remove highlight"
                  >
                    ×
                  </button>
                </HoverTooltip>
              </div>
            ))}
          </div>
        )}

        {/* Add new highlight */}
        <div className="space-y-2 flex flex-col">
          <div className="flex flex-wrap gap-2">
            <NumberField
              value={highlightFrom === '' ? '' : Number(highlightFrom)}
              onChange={(v) => setHighlightFrom(v === '' ? '' : String(v))}
              min={1}
              max={totalLines}
              step={1}
              placeholder="From"
              className="flex-1 min-w-[120px]"
              prefix="F"
              inputClassName="text-sm"
            />
            <NumberField
              value={highlightTo === '' ? '' : Number(highlightTo)}
              onChange={(v) => setHighlightTo(v === '' ? '' : String(v))}
              min={1}
              max={totalLines}
              step={1}
              placeholder="To"
              className="flex-1 min-w-[120px]"
              prefix="T"
              inputClassName="text-sm"
            />
            <SelectField
              value={highlightStyle}
              onValueChange={(v) => setHighlightStyle(v as 'focus' | 'added' | 'removed')}
              options={[
                { value: 'focus', label: 'Focus' },
                { value: 'added', label: 'Added' },
                { value: 'removed', label: 'Removed' },
              ]}

              triggerClassName="bg-neutral-200 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white px-2 py-1.5 rounded text-sm w-full min-w-[130px]"
            />
          </div>
          <HoverTooltip label="Add line highlight">
            <button
              onClick={addHighlight}
              disabled={!highlightFrom}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-300 dark:disabled:bg-neutral-600 disabled:opacity-50 text-white py-1.5 rounded text-sm transition-colors"
              aria-label="Add line highlight"
            >
              Add Highlight
            </button>
          </HoverTooltip>
        </div>
      </div>
    </div>
  );
};

export default CodeInspector;
