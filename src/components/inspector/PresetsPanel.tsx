import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import HoverTooltip from '../ui/HoverTooltip';

interface Preset {
    id: string;
    name: string;
    background: {
        type: 'solid' | 'gradient';
        solid: { color: string };
        gradient: { from: string; to: string; angle: number };
    };
    shadow: { color: string; blur: number; spread: number };
    cornerRadius: number;
    preview: string;
}

const PRESETS: Preset[] = [
    {
        id: 'midnight',
        name: 'Midnight',
        background: {
            type: 'gradient',
            solid: { color: '#000000' },
            gradient: { from: '#020617', to: '#1e1b4b', angle: 45 }
        },
        shadow: { color: 'rgba(0,0,0,0.5)', blur: 40, spread: 0 },
        cornerRadius: 24,
        preview: 'linear-gradient(45deg, #020617, #1e1b4b)',
    },
    {
        id: 'ocean',
        name: 'Ocean Depth',
        background: {
            type: 'gradient',
            solid: { color: '#000000' },
            gradient: { from: '#0f172a', to: '#1e40af', angle: 135 }
        },
        shadow: { color: 'rgba(56, 189, 248, 0.3)', blur: 30, spread: 10 },
        cornerRadius: 16,
        preview: 'linear-gradient(135deg, #0f172a, #1e40af)',
    },
    {
        id: 'minimal',
        name: 'Minimal White',
        background: {
            type: 'solid',
            solid: { color: '#ffffff' },
            gradient: { from: '#ffffff', to: '#f1f5f9', angle: 0 }
        },
        shadow: { color: 'rgba(0,0,0,0.08)', blur: 20, spread: 0 },
        cornerRadius: 8,
        preview: '#ffffff',
    },
    {
        id: 'sunset',
        name: 'Sunset Glow',
        background: {
            type: 'gradient',
            solid: { color: '#000000' },
            gradient: { from: '#450a0a', to: '#991b1b', angle: 45 }
        },
        shadow: { color: 'rgba(239, 68, 68, 0.2)', blur: 40, spread: 5 },
        cornerRadius: 20,
        preview: 'linear-gradient(45deg, #450a0a, #991b1b)',
    }
];

const PresetsPanel: React.FC = () => {
    const { applyPreset } = useCanvasStore();

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {PRESETS.map((preset) => (
                    <HoverTooltip key={preset.id} label={`Apply preset: ${preset.name}`}>
                        <button
                            onClick={() => applyPreset({
                                background: preset.background,
                                shadow: preset.shadow,
                                cornerRadius: preset.cornerRadius,
                            })}
                            className="group relative flex flex-col gap-2 p-2 rounded-xl bg-white border border-neutral-200 hover:border-blue-500/50 hover:bg-blue-50 transition-all text-left dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10"
                            aria-label={`Apply preset ${preset.name}`}
                        >
                            <div
                                className="w-full aspect-[4/3] rounded-lg border border-neutral-200 shadow-inner dark:border-white/10"
                                style={{ background: preset.preview }}
                            />
                            <span className="text-[11px] font-medium text-neutral-700 group-hover:text-neutral-900 px-1 dark:text-neutral-400 dark:group-hover:text-white">
                                {preset.name}
                            </span>
                        </button>
                    </HoverTooltip>
                ))}
            </div>
            <p className="text-[10px] text-neutral-500 italic px-1">
                Presets apply background, shadows, and rounding to compatible elements.
            </p>
        </div>
    );
};

export default PresetsPanel;
