import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';

type Props = {
    value: number | '' | undefined;
    onChange: (value: number | '') => void;
    onFocus?: () => void;
    onBlur?: () => void;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
};

const base =
    'w-full flex items-center rounded-lg px-2.5 py-2 text-xs transition border bg-neutral-50 border-neutral-200 text-neutral-900 focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/15 dark:bg-[#11121a] dark:border-white/10 dark:text-white dark:focus-within:border-blue-500/70 dark:focus-within:ring-blue-500/20';

const NumberField: React.FC<Props> = ({
                                          value,
                                          onChange,
                                          onFocus,
                                          onBlur,
                                          min,
                                          max,
                                          step = 1,
                                          placeholder,
                                          className = '',
                                          inputClassName = '',
                                          prefix,
                                          suffix,
                                      }) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const dragRef = useRef<{ startX: number; startValue: number } | null>(null);
    const displayValue = value === '' || value === undefined ? '' : String(value);

    const handleInput = (e: { target: { value: string } }) => {
        const raw = e.target.value;
        // Allow empty to let user clear
        if (raw === '') {
            onChange('');
            return;
        }
        // Accept numbers with optional leading -, and dot or comma as decimal
        if (!/^-?\d*[.,]?\d*$/.test(raw)) return;
        const normalised = raw.replace(',', '.');
        const n = Number(normalised);
        if (Number.isNaN(n)) return;
        onChange(n);
    };

    const handleBlur = () => {
        if (value !== '' && value !== undefined) {
            let n = Number(value);
            if (Number.isFinite(n)) {
                if (min !== undefined) n = Math.max(min, n);
                if (max !== undefined) n = Math.min(max, n);
                // Snap to step if integer step
                if (step && Number.isFinite(step)) {
                    const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0;
                    const snapped = Math.round(n / step) * step;
                    n = Number(snapped.toFixed(decimals));
                }
                onChange(n);
            }
        }
        onBlur?.();
    };

    const hasPrefix = Boolean(prefix);
    const hasSuffix = Boolean(suffix);

    const cleanupDrag = () => {
        dragRef.current = null;
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        document.body.style.cursor = '';
    };

    const applyDelta = (deltaX: number) => {
        if (!dragRef.current) return;
        const s = step ?? 1;
        const decimals = String(s).includes('.') ? String(s).split('.')[1].length : 0;
        // Smooth: scale pixels into fractional steps (smaller divisor = faster)
        const deltaSteps = (deltaX / 12) * 1; // 12px per step for finer control
        let next = dragRef.current.startValue + deltaSteps * s;
        if (min !== undefined) next = Math.max(min, next);
        if (max !== undefined) next = Math.min(max, next);
        next = Number(next.toFixed(decimals));
        onChange(next);
    };

    const handleDragMove = (e: MouseEvent) => {
        if (!dragRef.current) return;
        e.preventDefault();
        applyDelta(e.clientX - dragRef.current.startX);
    };

    const handleDragEnd = () => {
        cleanupDrag();
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return; // left-click only
        e.preventDefault();
        e.stopPropagation();

        const startVal =
            value === '' || value === undefined || Number.isNaN(Number(value))
                ? 0
                : Number(value);
        dragRef.current = { startX: e.clientX, startValue: startVal };
        document.body.style.cursor = 'ew-resize';

        // focus input and place caret at end
        inputRef.current?.focus();
        const pos = inputRef.current?.value.length ?? 0;
        inputRef.current?.setSelectionRange(pos, pos);

        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
    };

    useEffect(() => cleanupDrag, [cleanupDrag]);

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        // React only fires when hovered; limit to inside field (prefix/suffix/input)
        e.preventDefault();
        e.stopPropagation();

        const dominantDelta =
            Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (dominantDelta === 0) return;

        const s = step ?? 1;
        const decimals = String(s).includes('.') ? String(s).split('.')[1].length : 0;
        const direction =
            Math.abs(e.deltaX) > Math.abs(e.deltaY)
                ? dominantDelta > 0 ? 1 : -1 // horizontal: right increases
                : e.deltaY < 0 ? 1 : -1; // vertical: up increases

        const baseVal =
            value === '' || value === undefined || Number.isNaN(Number(value))
                ? 0
                : Number(value);

        let next = baseVal + direction * s;
        if (min !== undefined) next = Math.max(min, next);
        if (max !== undefined) next = Math.min(max, next);
        next = Number(next.toFixed(decimals));
        onChange(next);

        // Keep caret at end to avoid selection jump
        requestAnimationFrame(() => {
            const el = inputRef.current;
            if (!el) return;
            const pos = el.value.length;
            el.setSelectionRange(pos, pos);
        });
    };

    return (
        <div
            className={clsx(base, 'relative max-w-[160px] sm:max-w-[200px]', className)}
            onMouseDown={handleMouseDown}
            onWheel={handleWheel}
        >
            {hasPrefix && (
                <span className="absolute left-2 text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-500 select-none">
          {prefix}
        </span>
            )}
            {hasSuffix && (
                <span className="absolute right-2 text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-500 select-none">
          {suffix}
        </span>
            )}
            <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                pattern="^-?[0-9]*[.,]?[0-9]*$"
                value={displayValue}
                onChange={handleInput}
                onFocus={onFocus}
                onBlur={handleBlur}
                min={min}
                max={max}
                step={step}
                placeholder={placeholder}
                className={clsx(
                    'flex-1 bg-transparent text-xs outline-none text-neutral-900 placeholder:text-neutral-500 dark:text-white cursor-ew-resize',
                    hasPrefix ? 'pl-5' : '',
                    hasSuffix ? 'pr-5' : '',
                    inputClassName
                )}
            />
        </div>
    );
};

export default NumberField;
