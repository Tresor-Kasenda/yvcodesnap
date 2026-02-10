import React from 'react';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
} from 'lucide-react';
import HoverTooltip from '../ui/HoverTooltip';
import type { HorizontalPosition, VerticalPosition } from './positionUtils';

type PositionControlsProps = {
  horizontal?: HorizontalPosition;
  vertical?: VerticalPosition;
  onHorizontalChange: (position: HorizontalPosition) => void;
  onVerticalChange: (position: VerticalPosition) => void;
  label?: string;
  description?: string;
};

const GROUP_CLASS =
  'grid grid-cols-3 gap-1 p-1 rounded-lg border border-neutral-200 bg-neutral-100 dark:bg-white/5 dark:border-white/10 min-w-0';
const BUTTON_BASE_CLASS =
  'h-8 w-full min-w-0 rounded-md flex items-center justify-center transition-colors';
const BUTTON_IDLE_CLASS =
  'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10';
const BUTTON_ACTIVE_CLASS =
  'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white';

const PositionControls: React.FC<PositionControlsProps> = ({
  horizontal,
  vertical,
  onHorizontalChange,
  onVerticalChange,
  label = 'Position',
}) => {
  const horizontalOptions: Array<{
    value: HorizontalPosition;
    tooltip: string;
    Icon: React.ComponentType<{ className?: string }>;
    ariaLabel: string;
    iconClassName?: string;
  }> = [
    { value: 'left', tooltip: 'Align left', Icon: AlignStartHorizontal, ariaLabel: 'Align left', iconClassName: '-rotate-90' },
    { value: 'center', tooltip: 'Align horizontal center', Icon: AlignCenterHorizontal, ariaLabel: 'Align horizontal center', iconClassName: 'rotate-90' },
    { value: 'right', tooltip: 'Align right', Icon: AlignEndHorizontal, ariaLabel: 'Align right', iconClassName: '-rotate-90' },
  ];

  const verticalOptions: Array<{
    value: VerticalPosition;
    tooltip: string;
    Icon: React.ComponentType<{ className?: string }>;
    ariaLabel: string;
    iconClassName?: string;
  }> = [
    { value: 'top', tooltip: 'Align top', Icon: AlignStartVertical, ariaLabel: 'Align top', iconClassName: 'rotate-90' },
    { value: 'middle', tooltip: 'Align vertical center', Icon: AlignCenterVertical, ariaLabel: 'Align vertical center', iconClassName: '-rotate-90' },
    { value: 'bottom', tooltip: 'Align bottom', Icon: AlignEndVertical, ariaLabel: 'Align bottom', iconClassName: 'rotate-90' },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-500">
        {label}
      </label>
      <div className="grid grid-cols-2 gap-2 max-[340px]:grid-cols-1">
        <div className={GROUP_CLASS}>
          {horizontalOptions.map(({ value, tooltip, Icon, ariaLabel, iconClassName }) => {
            const active = horizontal === value;
            return (
              <HoverTooltip key={value} label={tooltip}>
                <button
                  onClick={() => onHorizontalChange(value)}
                  aria-label={ariaLabel}
                  className={`${BUTTON_BASE_CLASS} ${active ? BUTTON_ACTIVE_CLASS : BUTTON_IDLE_CLASS}`}
                >
                  <Icon className={`h-4 w-4 ${iconClassName ?? ''}`} />
                </button>
              </HoverTooltip>
            );
          })}
        </div>
        <div className={GROUP_CLASS}>
          {verticalOptions.map(({ value, tooltip, Icon, ariaLabel, iconClassName }) => {
            const active = vertical === value;
            return (
              <HoverTooltip key={value} label={tooltip}>
                <button
                  onClick={() => onVerticalChange(value)}
                  aria-label={ariaLabel}
                  className={`${BUTTON_BASE_CLASS} ${active ? BUTTON_ACTIVE_CLASS : BUTTON_IDLE_CLASS}`}
                >
                  <Icon className={`h-4 w-4 ${iconClassName ?? ''}`} />
                </button>
              </HoverTooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PositionControls;
