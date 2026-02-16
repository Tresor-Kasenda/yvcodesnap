import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

type HoverTooltipProps = {
    label: string;
    shortcut?: string;
    children: React.ReactElement;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    sideOffset?: number;
    disabled?: boolean;
};

export const HoverTooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TooltipPrimitive.Provider delayDuration={300} disableHoverableContent>
        {children}
    </TooltipPrimitive.Provider>
);

const HoverTooltip: React.FC<HoverTooltipProps> = ({
                                                       label,
                                                       shortcut,
                                                       children,
                                                       side = 'top',
                                                       align = 'center',
                                                       sideOffset = 8,
                                                       disabled = false,
                                                   }) => {
    if (disabled) return children;

    return (
        <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
                <TooltipPrimitive.Content
                    side={side}
                    align={align}
                    sideOffset={sideOffset}
                    className="z-50 rounded-md bg-neutral-900 px-2 py-1 text-white text-xs shadow-lg flex items-center gap-1.5"
                >
                    <span>{label}</span>
                    {shortcut && <span className="text-white/50">{shortcut}</span>}
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
    );
};

export default HoverTooltip;
