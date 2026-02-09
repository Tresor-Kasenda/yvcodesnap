import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { FONT_FAMILIES } from '../../types';
import SelectField from '../ui/SelectField';
import ToggleSwitch from '../ui/ToggleSwitch';
import SliderField from '../ui/SliderField';
import AccessibleColorPicker from '../ui/AccessibleColorPicker';

const GRADIENT_PRESETS = [
  { from: '#101022', to: '#1f1f3a', name: 'Midnight' },
  { from: '#0f172a', to: '#1e3a5f', name: 'Ocean' },
  { from: '#1a1a2e', to: '#16213e', name: 'Deep Blue' },
  { from: '#0f0f0f', to: '#232323', name: 'Charcoal' },
  { from: '#1a1a1a', to: '#2d2d2d', name: 'Dark' },
  { from: '#2d1b4e', to: '#1a1a2e', name: 'Purple' },
  { from: '#1e3c72', to: '#2a5298', name: 'Royal' },
  { from: '#134e5e', to: '#71b280', name: 'Teal' },
  { from: '#f5f5f5', to: '#e0e0e0', name: 'Light' },
  { from: '#ffffff', to: '#f0f0f0', name: 'White' },
];

const BackgroundPanel: React.FC = () => {
  const { snap, setBackground } = useCanvasStore();
  const { background } = snap;

  return (
    <div className="space-y-3">
      <h3 className="text-neutral-900 dark:text-white font-semibold text-[10px] uppercase tracking-wider">Appearance</h3>
      <div>
        <label className="block text-[10px] font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider mb-3">Type</label>
        <div className="flex gap-2 p-1 bg-neutral-100 border border-neutral-200 rounded-lg dark:bg-white/5 dark:border-white/5">
          <button
            onClick={() => setBackground({ type: 'solid' })}
            className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all ${
              background.type === 'solid'
                ? 'bg-blue-600/20 text-blue-700 border border-blue-500/30 dark:bg-neutral-700 dark:text-white dark:border-transparent shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5'
            }`}
          >
            Solid
          </button>
          <button
            onClick={() => setBackground({ type: 'gradient' })}
            className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all ${
              background.type === 'gradient'
                ? 'bg-blue-600/20 text-blue-700 border border-blue-500/30 dark:bg-neutral-700 dark:text-white dark:border-transparent shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5'
            }`}
          >
            Gradient
          </button>
        </div>
      </div>

      {background.type === 'solid' ? (
        <div>
          <label className="block text-[10px] font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider mb-2">Color</label>
          <div className="flex gap-2 items-center p-2 bg-neutral-100 border border-neutral-200 rounded-lg dark:bg-white/5 dark:border-white/5">
            <AccessibleColorPicker
              value={background.solid.color}
              onChange={(color) => setBackground({ solid: { color } })}
              ariaLabel="Background solid color"
            />
            <input
              type="text"
              value={background.solid.color}
              onChange={(e) => setBackground({ solid: { color: e.target.value } })}
              className="flex-1 bg-transparent text-neutral-900 dark:text-white text-sm focus:outline-none font-mono"
          />
        </div>
      </div>
    ) : (
      <>
        <div className="space-y-3">
          <label className="block text-[10px] font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider mb-3">Presets</label>
            <div className="grid grid-cols-5 gap-2">
              {GRADIENT_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => setBackground({
                    gradient: { ...background.gradient, from: preset.from, to: preset.to }
                  })}
                  className="w-full aspect-square rounded-lg border border-white/10 hover:border-white/40 transition-all hover:scale-105 shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`
                  }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider mb-2">From</label>
              <div className="flex gap-2 items-center p-2 bg-neutral-100 border border-neutral-200 rounded-lg dark:bg-white/5 dark:border-white/5">
                <AccessibleColorPicker
                  value={background.gradient.from}
                  onChange={(color) => setBackground({
                    gradient: { ...background.gradient, from: color },
                  })}
                  ariaLabel="Gradient start color"
                />
                 <input
                    type="text"
                    value={background.gradient.from}
                    onChange={(e) => setBackground({
                      gradient: { ...background.gradient, from: e.target.value }
                    })}
                    className="w-full bg-transparent text-neutral-900 dark:text-white text-[10px] focus:outline-none font-mono"
                  />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider mb-2">To</label>
               <div className="flex gap-2 items-center p-2 bg-neutral-100 border border-neutral-200 rounded-lg dark:bg-white/5 dark:border-white/5">
                 <AccessibleColorPicker
                    value={background.gradient.to}
                    onChange={(color) => setBackground({
                      gradient: { ...background.gradient, to: color },
                    })}
                    ariaLabel="Gradient end color"
                  />
                 <input
                    type="text"
                    value={background.gradient.to}
                    onChange={(e) => setBackground({
                      gradient: { ...background.gradient, to: e.target.value }
                    })}
                    className="w-full bg-transparent text-neutral-900 dark:text-white text-[10px] focus:outline-none font-mono"
                  />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider mb-2">Angle: {background.gradient.angle}°</label>
            <SliderField
              min={0}
              max={360}
              step={1}
              value={background.gradient.angle}
              onValueChange={(v) =>
                setBackground({
                  gradient: { ...background.gradient, angle: v },
                })
              }
              ariaLabel="Gradient angle"
            />
          </div>
        </>
      )}

      {/* Brand Strip Section */}
      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-3">
          <label
            className="block text-[10px] font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider"
            htmlFor="brand-strip-toggle"
          >
            Brand Strip
          </label>
          <ToggleSwitch
            id="brand-strip-toggle"
            checked={!!background.brandStrip?.enabled}
            onCheckedChange={(checked) =>
              setBackground({
                brandStrip: { ...background.brandStrip, enabled: checked },
              })
            }
            ariaLabel="Toggle brand strip"
          />
        </div>

        {background.brandStrip?.enabled && (
          <div className="space-y-4">
            {/* Position */}
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider mb-2">Position</label>
              <div className="flex gap-2 p-1 bg-neutral-100 border border-neutral-200 rounded-lg dark:bg-white/5 dark:border-white/5">
                <button
                  onClick={() => setBackground({
                    brandStrip: { ...background.brandStrip, position: 'top' }
                  })}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                    background.brandStrip.position === 'top'
                      ? 'bg-blue-600/20 text-blue-700 border border-blue-500/30 dark:bg-neutral-700 dark:text-white dark:border-transparent shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5'
                  }`}
                >
                  Top
                </button>
                <button
                  onClick={() => setBackground({
                    brandStrip: { ...background.brandStrip, position: 'bottom' }
                  })}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                    background.brandStrip.position === 'bottom'
                      ? 'bg-blue-600/20 text-blue-700 border border-blue-500/30 dark:bg-neutral-700 dark:text-white dark:border-transparent shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5'
                  }`}
                >
                  Bottom
                </button>
              </div>
            </div>

            {/* Height */}
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider mb-2">
                Height: {background.brandStrip.height || 60}px
              </label>
              <SliderField
                min={30}
                max={120}
                step={1}
                value={background.brandStrip.height || 60}
                onValueChange={(v) =>
                  setBackground({
                    brandStrip: { ...background.brandStrip, height: v },
                  })
                }
                ariaLabel="Brand strip height"
              />
            </div>

            {/* Strip Color */}
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider mb-2">Strip Color</label>
              <div className="flex gap-2 items-center p-2 bg-neutral-100 border border-neutral-200 rounded-lg dark:bg-white/5 dark:border-white/5">
                <AccessibleColorPicker
                  value={background.brandStrip.color || '#000000'}
                  onChange={(color) => setBackground({
                    brandStrip: { ...background.brandStrip, color },
                  })}
                  ariaLabel="Brand strip color"
                />
                <input
                  type="text"
                  value={background.brandStrip.color || '#000000'}
                  onChange={(e) => setBackground({
                    brandStrip: { ...background.brandStrip, color: e.target.value }
                  })}
                className="w-full bg-transparent text-neutral-900 dark:text-white text-[10px] focus:outline-none font-mono"
              />
            </div>
          </div>

            {/* Brand Text */}
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider mb-2">Text</label>
              <input
                type="text"
                value={background.brandStrip.text || ''}
                onChange={(e) => setBackground({
                  brandStrip: { ...background.brandStrip, text: e.target.value }
                })}
                placeholder="@yourhandle"
                className="w-full bg-neutral-100 border border-neutral-200 text-neutral-900 px-3 py-2 rounded-lg text-sm focus:border-blue-500/50 focus:outline-none dark:bg-white/5 dark:border-white/5 dark:text-white"
              />
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider mb-2">Text Color</label>
            <div className="flex gap-2 items-center p-2 bg-neutral-100 border border-neutral-200 rounded-lg dark:bg-white/5 dark:border-white/5">
                <AccessibleColorPicker
                  value={background.brandStrip.textColor || '#ffffff'}
                  onChange={(color) => setBackground({
                    brandStrip: { ...background.brandStrip, textColor: color },
                  })}
                  ariaLabel="Brand strip text color"
                />
                <input
                  type="text"
                  value={background.brandStrip.textColor || '#ffffff'}
                  onChange={(e) => setBackground({
                    brandStrip: { ...background.brandStrip, textColor: e.target.value }
                  })}
                  className="w-full bg-transparent text-neutral-900 dark:text-white text-[10px] focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider mb-2">Font</label>
              <SelectField
                value={background.brandStrip.fontFamily || 'Inter'}
                onValueChange={(v) => setBackground({
                  brandStrip: { ...background.brandStrip, fontFamily: v }
                })}
                options={FONT_FAMILIES.brand.map((font) => ({
                  value: font,
                  label: <span style={{ fontFamily: font }}>{font}</span>,
                }))}
              />
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-[10px] font-medium text-neutral-600 dark:text-neutral-500 uppercase tracking-wider mb-2">
                Font Size: {background.brandStrip.fontSize || 16}px
              </label>
              <SliderField
                min={12}
                max={32}
                step={1}
                value={background.brandStrip.fontSize || 16}
                onValueChange={(v) =>
                  setBackground({
                    brandStrip: { ...background.brandStrip, fontSize: v },
                  })
                }
                ariaLabel="Brand strip font size"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundPanel;
