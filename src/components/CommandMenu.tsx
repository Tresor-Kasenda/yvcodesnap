import React, { useState, useEffect, useRef } from 'react';
import type { ToolId } from '../store/canvasStore';
import { useAppCommands } from '../hooks/useAppCommands';
import type { Command } from '../hooks/useAppCommands';

interface CommandMenuProps {
    isOpen: boolean;
    onClose: () => void;
    tool: ToolId;
    // Props below are now handled by global hook but kept for compatibility if needed, 
    // or we can remove them if no longer used by parent.
    // keeping simplistic signature for now as they might be passed but ignored.
    setTool?: (tool: ToolId) => void;
    showGrid?: boolean;
    setShowGrid?: (show: boolean) => void;
    zoom?: number;
    setZoom?: (zoom: number) => void;
    onClearCanvas?: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({
    isOpen,
    onClose,
    tool,
    onClearCanvas,
}) => {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Use centralized commands
    const { commands } = useAppCommands();

    // Create extra commands specific to this menu context if needed (like Clear Canvas)
    const extraCommands: Command[] = [];
    if (onClearCanvas) {
        extraCommands.push({
            id: 'clear-canvas',
            label: 'Clear Canvas',
            shortcut: 'Cmd+Shift+L',
            action: onClearCanvas,
            group: 'actions',
        });
    }

    // Combine and wrap actions to close menu
    const allCommands = [...commands, ...extraCommands].map(cmd => ({
        ...cmd,
        action: () => {
            cmd.action();
            onClose();
        }
    }));

    // Filter commands based on search
    const filteredCommands = allCommands.filter((cmd) =>
        cmd.label.toLowerCase().includes(search.toLowerCase())
    );

    // Group filtered commands
    const fileResults = filteredCommands.filter((cmd) => cmd.group === 'file');
    const toolResults = filteredCommands.filter((cmd) => cmd.group === 'tools');
    const editResults = filteredCommands.filter((cmd) => cmd.group === 'edit');
    const actionResults = filteredCommands.filter((cmd) => cmd.group === 'actions');

    const groups = [
        { name: 'File', items: fileResults },
        { name: 'Tools', items: toolResults },
        { name: 'Edit', items: editResults },
        { name: 'Actions', items: actionResults }
    ].filter(g => g.items.length > 0);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSearch('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [isOpen]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, filteredCommands, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-9999 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-160 mx-4 bg-[#0f1117] rounded-2xl shadow-[0_16px_70px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="p-4 border-b border-white/10">
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder="Type a command..."
                        className="w-full bg-transparent text-white text-lg placeholder:text-neutral-500 outline-none"
                    />
                </div>

                {/* Results */}
                <div className="max-h-125 overflow-y-auto py-2">
                    {filteredCommands.length === 0 ? (
                        <div className="px-4 py-8 text-center text-neutral-500">
                            No commands found
                        </div>
                    ) : (
                        <>
                            {groups.map((group) => (
                                <div key={group.name} className="mb-2">
                                    <div className="px-4 py-1.5 text-xs font-medium text-neutral-400 uppercase tracking-wider sticky top-0 bg-[#0f1117]/95 backdrop-blur-sm z-10">
                                        {group.name}
                                    </div>
                                    {group.items.map((cmd) => {
                                        const globalIndex = filteredCommands.indexOf(cmd);
                                        const isSelectedTool = cmd.group === 'tools' && (
                                            (cmd.id === 'select' && tool === 'select') || cmd.id === tool
                                        );

                                        // @ts-expect-error
                                        return (
                                            <button
                                                key={`${cmd.id}-${globalIndex}`} // Use compound key or simple index if id duplicates possible (unlikely)
                                                onClick={cmd.action}
                                                className={`w-full px-4 py-2.5 flex items-center justify-between transition-colors ${selectedIndex === globalIndex
                                                        ? 'bg-white/10'
                                                        : 'hover:bg-white/5'
                                                    } ${isSelectedTool ? 'text-blue-400' : ''}`}
                                            >
                                                <span className="text-white flex items-center gap-3">
                                                    {cmd?.icon}
                                                    {cmd.label}
                                                </span>
                                                {cmd.shortcut && (
                                                    <span className="text-xs text-neutral-400 font-mono">
                                                        {cmd.shortcut}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-white/10 flex items-center justify-between text-xs text-neutral-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">↑</kbd>
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">↓</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">↵</kbd>
                            Select
                        </span>
                    </div>
                    <span className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">Esc</kbd>
                        Close
                    </span>
                </div>
            </div>
        </div>
    );
};
