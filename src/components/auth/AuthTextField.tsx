import type { InputHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type AuthTextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id: string;
  label: string;
  icon: LucideIcon;
  rightSlot?: ReactNode;
};

export function AuthTextField({
  id,
  label,
  icon: Icon,
  rightSlot,
  className,
  ...inputProps
}: AuthTextFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          id={id}
          className={`w-full pl-10 ${rightSlot ? 'pr-12' : 'pr-3'} py-2.5 rounded-xl border border-neutral-300/90 dark:border-neutral-700 bg-white/90 dark:bg-neutral-900/80 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent transition-shadow ${className ?? ''}`}
          {...inputProps}
        />
        {rightSlot && <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
    </div>
  );
}
