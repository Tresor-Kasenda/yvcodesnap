import React from 'react';
import * as Switch from '@radix-ui/react-switch';

type ToggleSwitchProps = {
    id?: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    ariaLabel?: string;
    disabled?: boolean;
    className?: string;
    thumbClassName?: string;
};

const rootBase =
    'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors data-[state=checked]:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0b0c10] data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed bg-neutral-200 border-neutral-300 dark:bg-white/10 dark:border-white/10';

const thumbBase =
    'block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform translate-x-1 data-[state=checked]:translate-x-4 dark:bg-neutral-50';

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
                                                       id,
                                                       checked,
                                                       onCheckedChange,
                                                       ariaLabel,
                                                       disabled = false,
                                                       className = '',
                                                       thumbClassName = '',
                                                   }) => {
    return (
        <Switch.Root
            id={id}
            checked={checked}
            disabled={disabled}
            onCheckedChange={onCheckedChange}
            aria-label={ariaLabel}
            className={`${rootBase} ${className}`}
        >
            <Switch.Thumb className={`${thumbBase} ${thumbClassName}`} />
        </Switch.Root>
    );
};

export default ToggleSwitch;
