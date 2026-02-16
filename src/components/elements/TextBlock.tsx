import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Rect, Text, Transformer } from 'react-konva';
import { Html } from 'react-konva-utils';
import type Konva from 'konva';
import type { TextElement } from '../../types';

interface TextBlockProps {
    element: TextElement;
    isSelected: boolean;
    onSelect: (e?: any) => void;
    onChange: (updates: Partial<TextElement>) => void;
    draggable?: boolean;
}

const TextBlock: React.FC<TextBlockProps> = ({ element, isSelected, onSelect, onChange, draggable }) => {
    const groupRef = useRef<Konva.Group>(null);
    const textRef = useRef<Konva.Text>(null);
    const trRef = useRef<Konva.Transformer>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [textDimensions, setTextDimensions] = useState({ width: 200, height: 30 });
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(element.props.text);
    const [textareaStyle, setTextareaStyle] = useState<React.CSSProperties>({ display: 'none' });

    // keep inline editor buffer synced when props change externally
    useEffect(() => {
        if (!isEditing) setEditValue(element.props.text);
    }, [element.props.text, isEditing]);
    const { x, y, rotation, props } = element;

    useEffect(() => {
        if (isSelected && trRef.current && groupRef.current) {
            trRef.current.nodes([groupRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    useEffect(() => {
        if (textRef.current) {
            const w = textRef.current.width();
            const h = textRef.current.height();
            setTextDimensions({ width: w, height: h });

            // Update store if dimensions changed significantly
            if (Math.abs(w - (element as any).width) > 1 || Math.abs(h - (element as any).height) > 1) {
                onChange({ width: w, height: h } as any);
            }
        }
    }, [props.text, props.fontSize, props.fontFamily, props.bold, props.italic, element, onChange]);

    // Sync editValue when text changes externally
    useEffect(() => {
        setEditValue(props.text);
    }, [props.text]);

    // Focus textarea when editing starts
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);

    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        onChange({
            x: e.target.x(),
            y: e.target.y(),
        });
    };

    const handleTransformEnd = () => {
        const node = groupRef.current;
        if (!node) return;

        node.scaleX(1);
        node.scaleY(1);

        onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
        });
    };

    const handleSaveEdit = useCallback(() => {
        setIsEditing(false);
        setTextareaStyle({ display: 'none' });
        onChange({
            props: { ...props, text: editValue },
        });
    }, [editValue, onChange, props]);

    // Close editing when deselecting
    useEffect(() => {
        if (!isSelected && isEditing) {
            handleSaveEdit();
        }
    }, [isSelected, isEditing, handleSaveEdit]);

    const handleDoubleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        e.cancelBubble = true;
        onSelect();

        if (element.locked || !groupRef.current) return;
        const group = groupRef.current;
        const stage = group.getStage();
        if (!stage) return;

        const scale = stage.scaleX();

        setTextareaStyle({
            position: 'absolute',
            left: 0,
            top: 0,
            width: Math.max(40, textDimensions.width) * scale,
            height: Math.max(24, textDimensions.height) * scale,
            fontSize: props.fontSize * scale,
            fontFamily: props.fontFamily,
            fontWeight: props.bold ? 'bold' : 'normal',
            fontStyle: props.italic ? 'italic' : 'normal',
            lineHeight: '1.2',
            background: 'transparent',
            color: props.color,
            border: 'none',
            outline: 'none',
            padding: '0',
            margin: '0',
            resize: 'none',
            overflow: 'hidden',
            whiteSpace: 'pre',
            textAlign: props.align,
            zIndex: 1000,
            transformOrigin: 'top left',
            caretColor: props.color,
        });

        setIsEditing(true);
        setEditValue(props.text);
    }, [element.locked, onSelect, props, textDimensions.height, textDimensions.width]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            handleSaveEdit();
        }

        if ((e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
            e.preventDefault();
            handleSaveEdit();
        }
    }, [handleSaveEdit]);

    const totalWidth = textDimensions.width + props.padding * 2;
    const totalHeight = textDimensions.height + props.padding * 2;

    const fontStyle = [
        props.bold ? 'bold' : '',
        props.italic ? 'italic' : '',
    ].filter(Boolean).join(' ') || 'normal';

    return (
        <>
            <Group
                ref={groupRef}
                x={x}
                y={y}
                rotation={rotation}
                draggable={draggable ?? (!element.locked && !isEditing)}
                onClick={onSelect}
                onTap={onSelect}
                onContextMenu={(e) => {
                    e.evt.preventDefault();
                    e.cancelBubble = true;
                    onSelect();
                }}
                onDblClick={handleDoubleClick}
                onDblTap={handleDoubleClick}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
            >
                {/* Background */}
                {props.background && (
                    <Rect
                        x={-props.padding}
                        y={-props.padding}
                        width={totalWidth}
                        height={totalHeight}
                        fill={props.background.color}
                        cornerRadius={props.cornerRadius}
                    />
                )}

                {/* Text */}
                <Text
                    ref={textRef}
                    text={props.text}
                    fontSize={props.fontSize}
                    fontFamily={props.fontFamily}
                    fontStyle={fontStyle}
                    fill={props.color}
                    align={props.align}
                    textDecoration={props.underline ? 'underline' : ''}
                    visible={!isEditing}
                />

                {/* Inline text editor */}
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
                    enabledAnchors={['middle-left', 'middle-right']}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (Math.abs(newBox.width) < 50) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

export default TextBlock;
