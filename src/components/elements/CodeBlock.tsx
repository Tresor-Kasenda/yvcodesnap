import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Rect, Text, Transformer } from 'react-konva';
import { Html } from 'react-konva-utils';
import type Konva from 'konva';
import type { CodeElement } from '../../types';
import { tokenizeCode, getThemeBackground, isLightTheme, type LineTokens } from '../../utils/highlighter';

interface CodeBlockProps {
    element: CodeElement;
    isSelected: boolean;
    onSelect: (e?: any) => void;
    onChange: (updates: Partial<CodeElement>) => void;
    draggable?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ element, isSelected, onSelect, onChange, draggable }) => {
    const groupRef = useRef<Konva.Group>(null);
    const trRef = useRef<Konva.Transformer>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { x, y, width, height, rotation, props } = element;
    const [tokenizedLines, setTokenizedLines] = useState<LineTokens[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(props.code);

    // keep local edit buffer in sync when props change externally (e.g. inspector)
    useEffect(() => {
        if (!isEditing) setEditValue(props.code);
    }, [props.code, isEditing]);

    useEffect(() => {
        if (isSelected && trRef.current && groupRef.current) {
            trRef.current.nodes([groupRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    // Tokenize code for syntax highlighting
    useEffect(() => {
        tokenizeCode(props.code, props.language, props.theme)
            .then(setTokenizedLines)
            .catch(() => {
                // Fallback to plain text
                setTokenizedLines(
                    props.code.split('\n').map(line => ({
                        tokens: [{ content: line, color: isLightTheme(props.theme) ? '#1f1f1f' : '#e5e5e5' }],
                    }))
                );
            });
    }, [props.code, props.language, props.theme]);

    useEffect(() => {
        if (isSelected && trRef.current && groupRef.current) {
            trRef.current.nodes([groupRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    // Sync editValue when code changes externally
    useEffect(() => {
        setEditValue(props.code);
    }, [props.code]);

    // Focus textarea when editing starts
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            // Move cursor to end
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);
        }
    }, [isEditing]);

    // State for textarea position (computed when editing starts)
    const [textareaStyle, setTextareaStyle] = useState<React.CSSProperties>({ display: 'none' });

    const handleSaveEdit = useCallback(() => {
        setIsEditing(false);
        setTextareaStyle({ display: 'none' });
        onChange({
            props: { ...props, code: editValue }
        });
    }, [editValue, onChange, props]);

    // Close editing when deselecting
    useEffect(() => {
        if (!isSelected && isEditing) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            handleSaveEdit();
        }
    }, [isSelected, isEditing, handleSaveEdit]);

    const handleDoubleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        // Prevent event from bubbling to avoid triggering canvas click
        e.cancelBubble = true;

        if (!element.locked && groupRef.current) {
            const group = groupRef.current;
            const stage = group.getStage();
            if (!stage) return;

            const scale = stage.scaleX();

            // Calculate absolute position accounting for stage position and scale
            const textColor = isLightTheme(props.theme) ? '#1f1f1f' : '#e5e5e5';
            const lineNumberWidth = props.lineNumbers ? 55 : 0;

            // Set textarea style - position relative to the Html container
            setTextareaStyle({
                position: 'absolute',
                left: (props.padding + lineNumberWidth) * scale,
                top: props.padding * scale,
                width: (width - props.padding * 2 - lineNumberWidth) * scale,
                height: (height - props.padding * 2) * scale,
                fontSize: props.fontSize * scale,
                fontFamily: props.fontFamily,
                lineHeight: props.lineHeight,
                background: 'transparent',
                color: textColor,
                border: 'none',
                outline: 'none',
                padding: '0',
                margin: '0',
                resize: 'none',
                overflow: 'auto',
                whiteSpace: 'pre',
                zIndex: 1000,
                transformOrigin: 'top left',
                tabSize: 2,
                caretColor: textColor,
            });

            // Then enable editing
            setIsEditing(true);
            setEditValue(props.code);
        }
    }, [element.locked, props, width, height]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Handle Tab for indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;

            if (e.shiftKey) {
                // Shift+Tab: Remove indentation
                const beforeCursor = value.substring(0, start);

                // Find the start of the current line
                const lineStart = beforeCursor.lastIndexOf('\n') + 1;
                const linePrefix = value.substring(lineStart, start);

                // Check if line starts with spaces or tab
                if (linePrefix.startsWith('  ')) {
                    // Remove 2 spaces
                    const newValue = value.substring(0, lineStart) + value.substring(lineStart + 2);
                    setEditValue(newValue);
                    // Adjust cursor position
                    setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, start - 2);
                    }, 0);
                } else if (linePrefix.startsWith('\t')) {
                    // Remove tab
                    const newValue = value.substring(0, lineStart) + value.substring(lineStart + 1);
                    setEditValue(newValue);
                    setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, start - 1);
                    }, 0);
                }
            } else {
                // Tab: Add indentation (2 spaces)
                const newValue = value.substring(0, start) + '  ' + value.substring(end);
                setEditValue(newValue);
                // Move cursor after the inserted spaces
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + 2;
                }, 0);
            }
        }

        // Handle Enter for auto-indentation
        if (e.key === 'Enter') {
            e.preventDefault();
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;

            // Find the current line's indentation
            const beforeCursor = value.substring(0, start);
            const lineStart = beforeCursor.lastIndexOf('\n') + 1;
            const currentLine = value.substring(lineStart, start);
            const indentMatch = currentLine.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : '';

            // Check if the line ends with { or : (for additional indentation)
            const trimmedLine = currentLine.trim();
            const needsExtraIndent = trimmedLine.endsWith('{') || trimmedLine.endsWith(':') || trimmedLine.endsWith('(');
            const extraIndent = needsExtraIndent ? '  ' : '';

            const newValue = value.substring(0, start) + '\n' + indent + extraIndent + value.substring(end);
            setEditValue(newValue);

            // Move cursor after the newline and indentation
            const newCursorPos = start + 1 + indent.length + extraIndent.length;
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = newCursorPos;
            }, 0);
        }

        // Handle Escape to cancel/save
        if (e.key === 'Escape') {
            handleSaveEdit();
        }
    }, [handleSaveEdit]);

    // Render code with syntax highlighting using tokens
    const renderCode = () => {
        const lines = tokenizedLines.length > 0 ? tokenizedLines :
            props.code.split('\n').map(line => ({
                tokens: [{ content: line, color: isLightTheme(props.theme) ? '#1f1f1f' : '#e5e5e5' }],
            }));

        const lineHeight = props.fontSize * props.lineHeight;
        const startY = props.padding;
        const lineNumberWidth = props.lineNumbers ? 50 : 0;
        const lineNumColor = isLightTheme(props.theme) ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';

        const elements: React.ReactNode[] = [];

        lines.forEach((lineTokens, index) => {
            const yPos = startY + index * lineHeight;
            const lineNum = index + 1;

            // Check if this line is highlighted
            const highlight = props.highlights.find(
                h => lineNum >= h.from && lineNum <= h.to
            );

            // Line highlight background
            if (highlight) {
                let bgColor = 'rgba(255, 255, 0, 0.2)'; // focus - yellow
                if (highlight.style === 'added') bgColor = 'rgba(46, 160, 67, 0.25)';
                if (highlight.style === 'removed') bgColor = 'rgba(248, 81, 73, 0.25)';

                // Add a subtle left border indicator
                elements.push(
                    <Rect
                        key={`highlight-${index}`}
                        x={0}
                        y={yPos - 2}
                        width={width}
                        height={lineHeight}
                        fill={bgColor}
                    />
                );

                // Left border for highlight
                elements.push(
                    <Rect
                        key={`highlight-border-${index}`}
                        x={0}
                        y={yPos - 2}
                        width={3}
                        height={lineHeight}
                        fill={
                            highlight.style === 'focus' ? '#facc15' :
                                highlight.style === 'added' ? '#2ea043' : '#f85149'
                        }
                    />
                );
            }

            // Line number
            if (props.lineNumbers) {
                elements.push(
                    <Text
                        key={`linenum-${index}`}
                        x={props.padding}
                        y={yPos}
                        text={String(lineNum)}
                        fontSize={props.fontSize}
                        fontFamily={props.fontFamily}
                        fill={lineNumColor}
                        width={35}
                        align="right"
                    />
                );
            }

            // Code text with syntax highlighting
            let xOffset = props.padding + lineNumberWidth + (props.lineNumbers ? 5 : 0);

            lineTokens.tokens.forEach((token, tokenIndex) => {
                if (token.content) {
                    // Focus Mode logic: dim lines that are not part of any highlight
                    const isHighlighted = props.highlights.some(h => lineNum >= h.from && lineNum <= h.to);
                    const shouldDim = props.focusMode && props.highlights.length > 0 && !isHighlighted;

                    elements.push(
                        <Text
                            key={`code-${index}-${tokenIndex}`}
                            x={xOffset}
                            y={yPos}
                            text={token.content}
                            fontSize={props.fontSize}
                            fontFamily={props.fontFamily}
                            fill={token.color}
                            opacity={shouldDim ? 0.3 : 1}
                        />
                    );
                    // Approximate character width for monospace font
                    xOffset += token.content.length * (props.fontSize * 0.6);
                }
            });
        });

        return elements;
    };

    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        onChange({
            x: e.target.x(),
            y: e.target.y(),
        });
    };

    const handleTransformEnd = () => {
        const node = groupRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(200, node.width() * scaleX),
            height: Math.max(100, node.height() * scaleY),
            rotation: node.rotation(),
        });
    };

    const bgColor = getThemeBackground(props.theme);

    return (
        <>
            <Group
                ref={groupRef}
                x={x}
                y={y}
                width={width}
                height={height}
                rotation={rotation}
                draggable={draggable ?? (!element.locked && !isEditing)}
                onClick={onSelect}
                onTap={onSelect}
                onContextMenu={(e) => {
                    e.evt.preventDefault();
                    e.cancelBubble = true;
                    onSelect();
                }}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
            >
                {/* Shadow */}
                <Rect
                    x={props.shadow.spread}
                    y={props.shadow.spread}
                    width={width}
                    height={height}
                    cornerRadius={props.cornerRadius}
                    fill={props.shadow.color}
                    shadowBlur={props.shadow.blur}
                    shadowColor={props.shadow.color}
                />

                {/* Background - handles double click for inline editing */}
                <Rect
                    width={width}
                    height={height}
                    fill={bgColor}
                    cornerRadius={props.cornerRadius}
                    onDblClick={handleDoubleClick}
                    onDblTap={handleDoubleClick}
                />

                {/* Code content - also handles double click */}
                <Group
                    clipFunc={(ctx) => {
                        ctx.beginPath();
                        ctx.roundRect(0, 0, width, height, props.cornerRadius);
                        ctx.closePath();
                    }}
                    onDblClick={handleDoubleClick}
                    onDblTap={handleDoubleClick}
                >
                    {!isEditing && renderCode()}
                </Group>

                {/* Inline code editor */}
                {isEditing && (
                    <Html
                        divProps={{ style: { pointerEvents: 'auto' } }}
                    >
            <textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveEdit}
                style={textareaStyle}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
            />
                    </Html>
                )}
            </Group>

            {isSelected && !isEditing && (
                <Transformer
                    ref={trRef}
                    flipEnabled={false}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (Math.abs(newBox.width) < 200 || Math.abs(newBox.height) < 100) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

export default CodeBlock;
