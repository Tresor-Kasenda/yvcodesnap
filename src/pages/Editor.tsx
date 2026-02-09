import { useRef, useEffect, useCallback, useState } from 'react';
import type Konva from 'konva';
import { useNavigate } from 'react-router-dom';
import { useCanvasStore } from '../store/canvasStore';
import { useRecentSnapsStore } from '../store/recentSnapsStore';
import { Toaster } from 'sonner';
import { useAppCommands } from '../hooks/useAppCommands';
import FontLoader from '../components/FontLoader';
import TopBar from '../components/TopBar';
import Inspector from '../components/Inspector';
import LayersPanel from '../components/LayersPanel';
import Toolbar from '../components/Toolbar';
import Canvas from '../components/Canvas';

export default function Editor() {
    const stageRef = useRef<Konva.Stage>(null);
    const navigate = useNavigate();
    const { snap, selectElement } = useCanvasStore();
    const { addRecentSnap } = useRecentSnapsStore();
    const [showLayersPanel, setShowLayersPanel] = useState(true);
    const [showInspector, setShowInspector] = useState(true);

    const { commands } = useAppCommands();

    // Keep the editor in a single scroll context: the page itself should not scroll.
    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const classesToClear = ['landing-scrollbar', 'auth-scrollbar', 'auth-no-scroll'];

        classesToClear.forEach((className) => {
            html.classList.remove(className);
            body.classList.remove(className);
        });

        html.classList.add('editor-scrollbar');
        body.classList.add('editor-scrollbar');
        html.classList.add('editor-no-scroll');
        body.classList.add('editor-no-scroll');

        return () => {
            html.classList.remove('editor-scrollbar');
            body.classList.remove('editor-scrollbar');
            html.classList.remove('editor-no-scroll');
            body.classList.remove('editor-no-scroll');
        };
    }, []);

    // Handle going back to main screen
    const handleGoToMainScreen = useCallback(() => {
        if (snap.elements.length > 0) {
            addRecentSnap(snap);
        }
        navigate('/');
    }, [snap, addRecentSnap, navigate]);

    // Global Keyboard Shortcuts Binding
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input is focused
            const active = document.activeElement;
            const isInputFocused =
                active instanceof HTMLElement &&
                (active.tagName === 'INPUT' ||
                    active.tagName === 'TEXTAREA' ||
                    active.tagName === 'SELECT' ||
                    active.isContentEditable);
            if (isInputFocused) return;

            const isMeta = e.metaKey || e.ctrlKey;
            const isShift = e.shiftKey;

            // Special case for Esc (handled differently in commands list usually, or we check mapping)
            if (e.key === 'Escape') {
                selectElement(null);
                return;
            }

            // Check against commands
            // A simple mapper or check. Since we have a small list, we can iterate or build a map.
            // Modifiers string construction:
            // "Cmd+N", "Cmd+Shift+Z", "Del", "H", etc.

            // Helper to match event to shortcut string
            const matchShortcut = (shortcut: string | undefined) => {
                if (!shortcut) return false;

                const parts = shortcut.split('+');
                const key = parts[parts.length - 1].toLowerCase();

                // Check if shortcut expects Cmd or Ctrl - support both for compatibility
                const hasCmd = parts.includes('Cmd');
                const hasCtrl = parts.includes('Ctrl');
                const hasShift = parts.includes('Shift');

                // Match modifier keys - handle both Mac (Cmd) and Windows (Ctrl)
                const modifierMatch = hasCmd ? isMeta : hasCtrl ? (e.ctrlKey && !e.metaKey) : !isMeta && !e.ctrlKey;
                if (!modifierMatch) return false;
                if (hasShift !== isShift) return false;

                // Check key
                if (key === 'del' && (e.key === 'Delete' || e.key === 'Backspace')) return true;
                if (e.key.toLowerCase() === key) return true;
                // Handle symbols like +, -, =, '
                if (key === '+' && (e.key === '+' || e.key === '=')) return true;
                if (key === '-' && e.key === '-') return true;
                if (key === '\'' && (e.key === '\'' || e.key === ';')) return true;

                return false;
            };

            for (const cmd of commands) {
                if (matchShortcut(cmd.shortcut)) {
                    e.preventDefault();
                    cmd.action();
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [commands, selectElement]);

    // Auto-hide panels on mobile
    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                setShowLayersPanel(false);
                setShowInspector(false);
            } else {
                setShowLayersPanel(true);
                setShowInspector(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="h-screen md:h-dvh flex flex-col overflow-hidden bg-white dark:bg-[#09090b] text-neutral-900 dark:text-white">
            <FontLoader />
            <Toaster position="top-center" toastOptions={{ duration: 2600 }} />
            <TopBar
                stageRef={stageRef}
                onGoHome={handleGoToMainScreen}
                onToggleLayers={() => setShowLayersPanel(!showLayersPanel)}
                onToggleInspector={() => setShowInspector(!showInspector)}
                showLayersPanel={showLayersPanel}
                showInspector={showInspector}
            />
            <div className="flex-1 min-h-0 flex overflow-hidden relative">
                {/* Layers Panel - Collapsible on mobile */}
                <div className={`
                    absolute md:relative z-30 h-full
                    transition-transform duration-300 ease-in-out
                    ${showLayersPanel ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    ${showLayersPanel ? 'md:block' : 'md:hidden'}
                `}>
                    <LayersPanel />
                </div>

                {/* Backdrop for mobile */}
                {showLayersPanel && (
                    <div
                        className="md:hidden fixed inset-0 bg-black/50 z-20"
                        onClick={() => setShowLayersPanel(false)}
                    />
                )}

                <Toolbar />
                <Canvas stageRef={stageRef} />

                {/* Inspector Panel - Collapsible on mobile */}
                <div className={`
                    absolute md:relative right-0 z-30 h-full
                    transition-transform duration-300 ease-in-out
                    ${showInspector ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                    ${showInspector ? 'md:block' : 'md:hidden'}
                `}>
                    <Inspector />
                </div>

                {/* Backdrop for mobile */}
                {showInspector && (
                    <div
                        className="md:hidden fixed inset-0 bg-black/50 z-20"
                        onClick={() => setShowInspector(false)}
                    />
                )}
            </div>
        </div>
    );
}
