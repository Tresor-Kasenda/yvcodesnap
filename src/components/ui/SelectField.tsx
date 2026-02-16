import React from 'react';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

export type SelectOption = {
    value: string;
    label: React.ReactNode;
    disabled?: boolean;
};

interface SelectFieldProps {
    value: string;
    onValueChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    triggerClassName?: string;
}

const baseTrigger =
    'w-full inline-flex items-center py-1 justify-between gap-2 rounded-lg border border-neutral-200 dark:border-white/12 bg-white dark:bg-[#0f1117] px-3 text-sm text-neutral-900 dark:text-white hover:border-blue-400/70 hover:bg-neutral-50 dark:hover:bg-white/6 focus:outline-none focus:border-blue-400/90 focus:ring-2 focus:ring-blue-500/25 transition data-[state=open]:border-blue-400/90';

const SelectField: React.FC<SelectFieldProps> = ({
                                                     value,
                                                     onValueChange,
                                                     options,
                                                     placeholder,
                                                     triggerClassName = '',
                                                 }) => {
    return (
        <Select.Root value={value} onValueChange={onValueChange}>
            <Select.Trigger
                className={`${baseTrigger} ${triggerClassName}`}
                aria-label={placeholder}
            >
                <Select.Value
                    placeholder={placeholder}
                    className="flex-1 text-left truncate data-[placeholder]:text-neutral-400 dark:data-[placeholder]:text-neutral-500"
                />
                <Select.Icon className="ml-2 shrink-0 text-neutral-500 dark:text-neutral-400 transition-transform duration-150 data-[state=open]:rotate-180">
                    <ChevronDown className="w-4 h-4" />
                </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
                <Select.Content
                    className="z-50 min-w-[var(--radix-select-trigger-width)] max-h-72 overflow-hidden rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f1117] origin-[var(--radix-select-content-transform-origin)] transition-[opacity,transform] duration-160 ease-out data-[state=open]:opacity-100 data-[state=open]:translate-y-0 data-[state=open]:scale-100 data-[state=closed]:opacity-0 data-[state=closed]:translate-y-1 data-[state=closed]:scale-95 shadow-lg"
                    position="item-aligned"
                    sideOffset={4}
                >
                    <Select.ScrollUpButton className="flex items-center justify-center py-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                        <ChevronUp className="w-4 h-4" />
                    </Select.ScrollUpButton>
                    <Select.Viewport className="p-2">
                        {options.map((opt) => (
                            <Select.Item
                                key={opt.value}
                                value={opt.value}
                                disabled={opt.disabled}
                                className="relative flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-neutral-700 dark:text-neutral-100 cursor-pointer select-none transition-colors data-[highlighted]:bg-neutral-100 dark:data-[highlighted]:bg-white/8 data-[highlighted]:text-neutral-900 dark:data-[highlighted]:text-white data-[state=checked]:bg-blue-100 dark:data-[state=checked]:bg-[#113a73] data-[state=checked]:text-blue-900 dark:data-[state=checked]:text-white focus:outline-none data-[disabled]:opacity-35 data-[disabled]:cursor-not-allowed"
                            >
                                <Select.ItemText>{opt.label}</Select.ItemText>
                                <Select.ItemIndicator className="ml-auto text-blue-600 dark:text-blue-400">
                                    <Check className="w-4 h-4" />
                                </Select.ItemIndicator>
                            </Select.Item>
                        ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton className="flex items-center justify-center py-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                        <ChevronDown className="w-4 h-4" />
                    </Select.ScrollDownButton>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
};

export default SelectField;
