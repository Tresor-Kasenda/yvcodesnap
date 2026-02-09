import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    shortcut?: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
    disabled?: boolean;
}

export interface ContextMenuSection {
    items: ContextMenuItem[];
}

interface ContextMenuProps {
    x: number;
    y: number;
    sections: ContextMenuSection[];
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, sections, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Adjust position if menu goes off screen
    const adjustedX = Math.min(x, window.innerWidth - 180);
    const adjustedY = Math.min(y, window.innerHeight - 300);

    return createPortal(
        <>
            {/* Invisible backdrop to catch all clicks outside the menu */}
            <div
                className="fixed inset-0 z-[9998]"
                onClick={onClose}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onClose();
                }}
            />
            {/* Menu */}
            <div
                ref={menuRef}
                className="fixed z-[9999] min-w-[180px] bg-neutral-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl py-1 px-0.5 animate-in fade-in zoom-in-95 duration-150"
                style={{ left: adjustedX, top: adjustedY }}
                onClick={(e) => e.stopPropagation()}
            >
                {sections.map((section, sectionIdx) => (
                    <React.Fragment key={sectionIdx}>
                        {sectionIdx > 0 && <div className="my-0.5 border-t border-white/5 mx-1" />}
                        <div className="space-y-px">
                            {section.items.map((item) => (
                                <button
                                    key={item.id}
                                    disabled={item.disabled}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        item.onClick();
                                        onClose();
                                    }}
                                    className={`w-full flex items-center gap-2 px-2 py-1 rounded text-[10px] transition-colors text-left ${item.disabled
                                        ? 'opacity-30 cursor-not-allowed'
                                        : item.variant === 'danger'
                                            ? 'text-red-400 hover:bg-red-400/10'
                                            : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <span className="shrink-0 opacity-70 w-3 h-3 flex items-center justify-center">
                                        {item.icon}
                                    </span>
                                    <span className="flex-1">{item.label}</span>
                                    {item.shortcut && (
                                        <span className="text-[8px] text-neutral-500 font-mono tracking-tight uppercase ml-1">
                                            {item.shortcut}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </>,
        document.body
    );
};

export default ContextMenu;
