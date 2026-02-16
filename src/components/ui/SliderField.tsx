import React from 'react';
import * as Slider from '@radix-ui/react-slider';

type SliderFieldProps = {
    value: number;
    onValueChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    ariaLabel?: string;
    disabled?: boolean;
    className?: string;
    trackClassName?: string;
    rangeClassName?: string;
    thumbClassName?: string;
};

const rootBase = 'group relative flex h-7 w-full select-none items-center';
const trackBase = 'relative h-1.5 w-full rounded-full bg-neutral-200 dark:bg-white/10';
const rangeBase = 'absolute h-full rounded-full bg-blue-600 dark:bg-blue-500/80 group-data-[disabled]:bg-neutral-300 dark:group-data-[disabled]:bg-white/20';
const thumbBase =
    'block h-4 w-4 rounded-full bg-white dark:bg-neutral-50 shadow-[0_2px_8px_rgba(0,0,0,0.25)] border border-neutral-300 dark:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-transform data-[state=active]:scale-105 group-data-[disabled]:opacity-60';

const SliderField: React.FC<SliderFieldProps> = ({
                                                     value,
                                                     onValueChange,
                                                     min = 0,
                                                     max = 100,
                                                     step = 1,
                                                     ariaLabel,
                                                     disabled = false,
                                                     className = '',
                                                     trackClassName = '',
                                                     rangeClassName = '',
                                                     thumbClassName = '',
                                                 }) => {
    return (
        <Slider.Root
            className={`${rootBase} ${className}`}
            min={min}
            max={max}
            step={step}
            value={[value]}
            onValueChange={([v]) => onValueChange(v)}
            aria-label={ariaLabel}
            disabled={disabled}
        >
            <Slider.Track className={`${trackBase} ${trackClassName}`}>
                <Slider.Range className={`${rangeBase} ${rangeClassName}`} />
            </Slider.Track>
            <Slider.Thumb className={`${thumbBase} ${thumbClassName}`} />
        </Slider.Root>
    );
};

export default SliderField;
