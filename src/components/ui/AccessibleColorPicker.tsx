import React, { useMemo } from 'react';
import {
  Button,
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorThumb,
  Dialog,
  DialogTrigger,
  Group,
  Input,
  Label,
  Popover,
  SliderOutput,
  SliderTrack,
  parseColor,
  type Color,
} from 'react-aria-components';

interface AccessibleColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

const rgbaToHex = (value: string): string | null => {
  const match = value.match(/rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
  if (!match) return null;

  const [r, g, b] = match.slice(1, 4).map((n) => {
    const numeric = Number(n);
    return Math.max(0, Math.min(255, numeric));
  });

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const normalizeColorForPicker = (value: string): string => {
  const trimmed = (value || '').trim();
  if (!trimmed || trimmed.toLowerCase() === 'transparent') {
    return '#000000';
  }

  const rgbaHex = rgbaToHex(trimmed);
  if (rgbaHex) {
    return rgbaHex;
  }

  try {
    return parseColor(trimmed).toString('hex');
  } catch {
    return '#000000';
  }
};

const AccessibleColorPicker: React.FC<AccessibleColorPickerProps> = ({
  value,
  onChange,
  ariaLabel = 'Pick a color',
  className = '',
}) => {
  const pickerValue = useMemo(
    () => parseColor(normalizeColorForPicker(value)).toFormat('hsb'),
    [value]
  );

  const handleChange = (color: Color) => {
    onChange(color.toString('hex'));
  };

  return (
    <ColorPicker value={pickerValue} onChange={handleChange}>
      <DialogTrigger>
        <Button
          aria-label={ariaLabel}
          className={`relative h-8 w-8 shrink-0 overflow-hidden rounded border border-neutral-300 dark:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${className}`}
        >
          <ColorSwatch className="absolute inset-0 rounded-[inherit]" />
        </Button>

        <Popover
          placement="bottom start"
          offset={8}
          className="z-[120] rounded-xl border border-neutral-200 bg-white p-3 shadow-xl shadow-black/10 dark:border-white/10 dark:bg-neutral-900 dark:shadow-black/40"
        >
          <Dialog className="w-56 space-y-3 outline-none">
            <ColorArea className="relative h-32 w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-white/10">
              <ColorThumb className="h-4 w-4 rounded-full border-2 border-white shadow-md ring-1 ring-black/20 dark:ring-white/20" />
            </ColorArea>

            <ColorSlider channel="hue" className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <Label>Hue</Label>
                <SliderOutput />
              </div>
              <SliderTrack className="relative h-3 w-full overflow-hidden rounded-full">
                <ColorThumb className="h-4 w-4 rounded-full border-2 border-white shadow-md ring-1 ring-black/20 dark:ring-white/20" />
              </SliderTrack>
            </ColorSlider>

            <ColorField className="space-y-1.5">
              <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Hex
              </Label>
              <Group className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-2 dark:border-white/10 dark:bg-white/5">
                <Input className="w-full bg-transparent text-xs font-mono text-neutral-900 outline-none dark:text-white" />
              </Group>
            </ColorField>
          </Dialog>
        </Popover>
      </DialogTrigger>
    </ColorPicker>
  );
};

export default AccessibleColorPicker;
