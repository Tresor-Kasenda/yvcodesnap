import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import type { ImageElement } from '../../types';
import NumberField from '../ui/NumberField';
import SliderField from '../ui/SliderField';
import SelectField from '../ui/SelectField';
import HoverTooltip from '../ui/HoverTooltip';
import PositionControls from './PositionControls';
import {
    createElementPositionUpdate,
    getElementBoundsForPosition,
    getHorizontalPosition,
    getVerticalPosition,
} from './positionUtils';

interface ImageInspectorProps {
    element: ImageElement;
}

const ImageInspector: React.FC<ImageInspectorProps> = ({ element }) => {
    const { snap, updateElement } = useCanvasStore();
    const bounds = getElementBoundsForPosition(element);
    const horizontalPosition = getHorizontalPosition(bounds, snap.meta.width);
    const verticalPosition = getVerticalPosition(bounds, snap.meta.height);

    const updateProps = (props: Partial<ImageElement['props']>) => {
        updateElement(element.id, { props: { ...element.props, ...props } });
    };

    return (
        <div className="space-y-4">
            {/* Dimensions (Read-only for now, or editable?) */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">Width</label>
                    <HoverTooltip label="Image width">
                        <div className="px-3 py-2 bg-neutral-100 dark:bg-white/5 rounded-md text-sm text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/5 cursor-not-allowed">
                            {Math.round(element.width)}px
                        </div>
                    </HoverTooltip>
                </div>
                <div>
                    <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">Height</label>
                    <HoverTooltip label="Image height">
                        <div className="px-3 py-2 bg-neutral-100 dark:bg-white/5 rounded-md text-sm text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/5 cursor-not-allowed">
                            {Math.round(element.height)}px
                        </div>
                    </HoverTooltip>
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

            {/* Opacity */}
            <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    Opacity: {Math.round(element.props.opacity * 100)}%
                </label>
                <HoverTooltip label="Image opacity">
                    <div>
                        <SliderField
                            min={0}
                            max={1}
                            step={0.05}
                            value={element.props.opacity}
                            onValueChange={(v) => updateProps({ opacity: v })}
                            ariaLabel="Opacity"
                        />
                    </div>
                </HoverTooltip>
            </div>

            {/* Corner Radius */}
            <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">Corner Radius</label>
                <HoverTooltip label="Image corner radius">
                    <div>
                        <NumberField
                            value={element.props.cornerRadius}
                            onChange={(v) => updateProps({ cornerRadius: typeof v === 'number' ? v : 0 })}
                            min={0}
                            max={100}
                            step={1}
                        />
                    </div>
                </HoverTooltip>
            </div>

            {/* Shadow */}
            <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    Shadow Blur: {element.props.shadow.blur}
                </label>
                <HoverTooltip label="Shadow blur">
                    <div>
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
                </HoverTooltip>
            </div>

            {/* Fit Mode */}
            <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">Fit Mode</label>
                <HoverTooltip label="Image fit mode">
                    <div>
                        <SelectField
                            value={element.props.fit}
                            onValueChange={(v) => updateProps({ fit: v as 'cover' | 'contain' | 'fill' })}
                            options={[
                                { value: 'contain', label: 'Contain' },
                                { value: 'cover', label: 'Cover' },
                                { value: 'fill', label: 'Fill' },
                            ]}
                        />
                    </div>
                </HoverTooltip>
            </div>
        </div>
    );
};

export default ImageInspector;
