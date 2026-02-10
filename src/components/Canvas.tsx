import React, { useRef, useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Text, Group, Path, Circle, Transformer } from 'react-konva';
import type Konva from 'konva';
import { useCanvasStore, createCodeElement, createTextElement, createArrowElement, createShapeElement } from '../store/canvasStore';
import CodeBlock from './elements/CodeBlock';
import TextBlock from './elements/TextBlock';
import Arrow from './elements/Arrow';
import Shape from './elements/Shape';
import ImageLayer from './elements/ImageLayer';
import GroupLayer from './elements/GroupLayer';
import { SOCIAL_ICON_PATHS, SOCIAL_PLATFORMS_CONFIG } from './elements/SocialIcons';
import { CommandMenu } from './CommandMenu';
import CanvasContextMenuOverlay from './ui/CanvasContextMenuOverlay';
import type { CodeElement, TextElement, ArrowElement, ShapeElement, ShapeKind, ImageElement, GroupElement } from '../types';

const MIN_CANVAS = 320;
const MAX_CANVAS = 10000;
type ResizeEdge = 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
const shapeTools: ShapeKind[] = ['rectangle', 'ellipse', 'line', 'polygon', 'star'];

interface CanvasProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

const Canvas: React.FC<CanvasProps> = ({ stageRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight - 120 });
  const [stagePos, setStagePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [showResizeHandles, setShowResizeHandles] = useState(false);
  const [drawingArrowId, setDrawingArrowId] = useState<string | null>(null);
  const [drawingCodeId, setDrawingCodeId] = useState<string | null>(null);
  const arrowStartRef = useRef<{ x: number; y: number } | null>(null);
  const codeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [drawingShapeId, setDrawingShapeId] = useState<string | null>(null);
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [resizeState, setResizeState] = useState<{
    edge: ResizeEdge;
    startMouse: { x: number; y: number };
    startSize: { w: number; h: number };
    startPos: { x: number; y: number };
    startZoom: number;
  } | null>(null);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasInteractedRef = useRef(false);
  const spacePressedRef = useRef(false);
  const cancelClickRef = useRef(false);
  const transformerRef = useRef<Konva.Transformer>(null);
  const snap = useCanvasStore((state) => state.snap);
  const zoom = useCanvasStore((state) => state.zoom);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const updateMeta = useCanvasStore((state) => state.updateMeta);
  const showGrid = useCanvasStore((state) => state.showGrid);
  const tool = useCanvasStore((state) => state.tool);
  const selectedElementIds = useCanvasStore((state) => state.selectedElementIds);
  const selectElement = useCanvasStore((state) => state.selectElement);
  const addElement = useCanvasStore((state) => state.addElement);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const deleteElement = useCanvasStore((state) => state.deleteElement);
  const duplicateElement = useCanvasStore((state) => state.duplicateElement);
  const copyToClipboard = useCanvasStore((state) => state.copyToClipboard);
  const pasteFromClipboard = useCanvasStore((state) => state.pasteFromClipboard);
  const groupSelection = useCanvasStore((state) => state.groupSelection);
  const ungroupSelection = useCanvasStore((state) => state.ungroupSelection);
  const selectAll = useCanvasStore((state) => state.selectAll);

  const setContextMenu = useCanvasStore((state) => state.setContextMenu);

  const { width, height } = snap.meta;
  const { background } = snap;
  const [brandingAvatar, setBrandingAvatar] = useState<HTMLImageElement | null>(null);
  const findElement = useCallback(
    (id: string | null) => snap.elements.find((el) => el.id === id),
    [snap.elements]
  );

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Keep stage centered initially and when viewport/layout changes (unless user already interacted)
  useEffect(() => {
    if (hasInteractedRef.current) return;
    const scaledWidth = width * zoom;
    const scaledHeight = height * zoom;
    setStagePos({
      x: Math.max(20, (dimensions.width - scaledWidth) / 2),
      y: Math.max(20, (dimensions.height - scaledHeight) / 2),
    });
  }, [dimensions, width, height, zoom]);

  // Track spacebar for panning with left click and Cmd+K for command menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow native shortcuts inside form fields / editable areas
      const target = e.target as HTMLElement | null;
      if (
        target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        )
      ) {
        return;
      }

      // Command Menu shortcut: Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandMenuOpen((prev) => !prev);
        return;
      }

      // Select All: Cmd+A or Ctrl+A
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }

      // Copy: Cmd+C
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        e.preventDefault();
        copyToClipboard();
        return;
      }

      // Paste: Cmd+V
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault();
        pasteFromClipboard();
        return;
      }

      // Group: Cmd+G
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'g') {
        e.preventDefault();
        groupSelection();
        return;
      }

      // Ungroup: Cmd+Shift+G
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'g') {
        e.preventDefault();
        ungroupSelection();
        return;
      }

      // Duplicate: Cmd+D
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        duplicateElement();
        return;
      }

      // Delete/Backspace
      if (e.key === 'Backspace' || e.key === 'Delete') {
        // Don't delete if we are in an input or textarea
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        deleteElement();
      }

      if (e.code === 'Space') {
        spacePressedRef.current = true;
        setSpaceHeld(true);
        cancelClickRef.current = true;
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressedRef.current = false;
        setSpaceHeld(false);
        setIsPanning(false);
        panStartRef.current = null;
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [copyToClipboard, pasteFromClipboard, selectAll]);

  // Handle canvas resize via drag handles
  useEffect(() => {
    if (!resizeState) return;

    const handleMove = (ev: MouseEvent) => {
      const { edge, startMouse, startSize, startPos, startZoom } = resizeState;
      const deltaScreenX = ev.clientX - startMouse.x;
      const deltaScreenY = ev.clientY - startMouse.y;
      const deltaCanvasX = deltaScreenX / startZoom;
      const deltaCanvasY = deltaScreenY / startZoom;

      let nextWidth = startSize.w;
      let nextHeight = startSize.h;
      let nextPosX = startPos.x;
      let nextPosY = startPos.y;

      // Horizontal resize
      if (edge.includes('right')) {
        nextWidth = Math.min(MAX_CANVAS, Math.max(MIN_CANVAS, Math.round(startSize.w + deltaCanvasX)));
      }
      if (edge.includes('left')) {
        const tentative = startSize.w - deltaCanvasX;
        nextWidth = Math.min(MAX_CANVAS, Math.max(MIN_CANVAS, Math.round(tentative)));
        const appliedDelta = startSize.w - nextWidth; // canvas space
        nextPosX = startPos.x + appliedDelta * startZoom;
      }

      // Vertical resize
      if (edge.includes('bottom')) {
        nextHeight = Math.min(MAX_CANVAS, Math.max(MIN_CANVAS, Math.round(startSize.h + deltaCanvasY)));
      }
      if (edge.includes('top')) {
        const tentative = startSize.h - deltaCanvasY;
        nextHeight = Math.min(MAX_CANVAS, Math.max(MIN_CANVAS, Math.round(tentative)));
        const appliedDelta = startSize.h - nextHeight; // canvas space
        nextPosY = startPos.y + appliedDelta * startZoom;
      }

      setStagePos({ x: nextPosX, y: nextPosY });
      updateMeta({ width: nextWidth, height: nextHeight });
    };

    const handleUp = () => {
      cancelClickRef.current = true;
      setResizeState(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [resizeState, updateMeta]);

  useEffect(() => {
    const url = background.branding?.avatarUrl || '';
    if (!url) {
      setBrandingAvatar(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setBrandingAvatar(img);
    img.onerror = () => setBrandingAvatar(null);
    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [background.branding?.avatarUrl]);

  const resetPan = useCallback(() => {
    const scaledWidth = width * zoom;
    const scaledHeight = height * zoom;
    setStagePos({
      x: Math.max(20, (dimensions.width - scaledWidth) / 2),
      y: Math.max(20, (dimensions.height - scaledHeight) / 2),
    });
  }, [dimensions.width, dimensions.height, width, height, zoom]);

  const handleElementClick = (id: string, e?: Konva.KonvaEventObject<MouseEvent>) => {
    if (e) {
      e.cancelBubble = true; // Prevent stage click
    }
    if (tool !== 'select') return;

    const metaPressed = e?.evt ? (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) : false;
    const isSelected = selectedElementIds.includes(id);

    if (metaPressed) {
      // If meta key is pressed, toggle selection
      selectElement(id, true);
    } else if (!isSelected) {
      // If not selected and meta key is not pressed, select only this element
      selectElement(id, false);
    }
    // If already selected and meta key is not pressed, do nothing (allows for drag)
  };

  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent | MouseEvent>) => {
    e.evt.preventDefault();
    e.evt.stopPropagation();

    const stage = stageRef.current;
    if (!stage) return;

    // Get pointer position relative to page for the menu positioning
    const { clientX, clientY } = e.evt;

    // Get pointer position relative to stage for pasting
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Convert stage mouse position to canvas coordinates (considering zoom/pan)
    const transform = stage.getAbsoluteTransform().copy().invert();
    const canvasPos = transform.point(pointerPos);

    setContextMenu({
      isOpen: true,
      x: clientX,
      y: clientY,
      canvasX: canvasPos.x,
      canvasY: canvasPos.y,
    });
  };
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (cancelClickRef.current || resizeState || spacePressedRef.current || e.evt.button !== 0) {
      cancelClickRef.current = false;
      return;
    }
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';

    if (clickedOnEmpty) {
      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      // Convert screen position to canvas position
      const canvasX = (pos.x - stagePos.x) / zoom;
      const canvasY = (pos.y - stagePos.y) / zoom;

      if (tool === 'code') {
        addElement(createCodeElement(canvasX - 300, canvasY - 150));
      } else if (tool === 'text') {
        addElement(createTextElement(canvasX, canvasY));
      } else {
        selectElement(null); // Clear selection if clicking on empty space
      }
    }
  };

  // Background gradient
  const renderBackground = () => {
    if (background.type === 'gradient') {
      return (
        <Rect
          name="background"
          x={0}
          y={0}
          width={width}
          height={height}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{
            x: width * Math.cos((background.gradient.angle * Math.PI) / 180),
            y: height * Math.sin((background.gradient.angle * Math.PI) / 180)
          }}
          fillLinearGradientColorStops={[0, background.gradient.from, 1, background.gradient.to]}
        />
      );
    }
    return (
      <Rect
        name="background"
        x={0}
        y={0}
        width={width}
        height={height}
        fill={background.solid.color}
      />
    );
  };

  // Grid overlay - memoized for performance
  const getLuminance = (hex: string) => {
    const normalized = hex.replace('#', '');
    const value = normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized.padEnd(6, '0').slice(0, 6);
    const r = parseInt(value.slice(0, 2), 16) / 255;
    const g = parseInt(value.slice(2, 4), 16) / 255;
    const b = parseInt(value.slice(4, 6), 16) / 255;
    const toLin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    const [lr, lg, lb] = [toLin(r), toLin(g), toLin(b)];
    return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  };

  const gridStroke = useMemo(() => {
    // Pick a representative background color for contrast
    const sampleHex =
      background.type === 'solid'
        ? background.solid.color || '#ffffff'
        : background.gradient?.from || '#ffffff';
    const luminance = getLuminance(sampleHex);
    const isLightBg = luminance > 0.5;
    return isLightBg ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.12)';
  }, [background]);

  const gridLines = useMemo(() => {
    if (!showGrid) return null;
    const gridSize = 50;
    const lines = [];

    // Vertical lines
    for (let i = 0; i <= width; i += gridSize) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, height]}
          stroke={gridStroke}
          strokeWidth={1}
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i <= height; i += gridSize) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, width, i]}
          stroke={gridStroke}
          strokeWidth={1}
        />
      );
    }

    return <>{lines}</>;
  }, [showGrid, width, height, gridStroke]);

  // Brand strip - memoized
  const brandStripElement = useMemo(() => {
    const brandStrip = background.brandStrip;
    if (!brandStrip?.enabled) return null;

    const stripHeight = brandStrip.height || 60;
    const stripY = brandStrip.position === 'top' ? 0 : height - stripHeight;

    return (
      <>
        <Rect
          x={0}
          y={stripY}
          width={width}
          height={stripHeight}
          fill={brandStrip.color || '#000000'}
        />
        {brandStrip.text && (
          <Text
            x={0}
            y={stripY}
            width={width}
            height={stripHeight}
            text={brandStrip.text}
            fontSize={brandStrip.fontSize || 16}
            fontFamily={brandStrip.fontFamily || 'Inter'}
            fill={brandStrip.textColor || '#ffffff'}
            align="center"
            verticalAlign="middle"
          />
        )}
      </>
    );
  }, [background.brandStrip, width, height]);

  // Branding watermark - memoized
  const brandingElement = useMemo(() => {
    const branding = background.branding;
    if (!branding?.enabled) return null;

    const padding = branding.padding || 24;
    const fontSize = branding.fontSize || 14;
    const lineHeight = fontSize * 1.5;
    const iconSize = branding.socialIconSize || 20;
    const socialLayout = branding.socialLayout || 'horizontal';
    const iconGap = 16;
    const iconTextGap = 6; // Gap between icon and its text
    const avatarSize = branding.avatarSize || 56;
    const avatarGap = 14;
    const hasAvatar = Boolean(branding.showAvatar && branding.avatarUrl && brandingAvatar);

    // Build branding text lines
    const lines: string[] = [];
    if (branding.showName && branding.name) {
      lines.push(branding.name);
    }
    if (branding.showWebsite && branding.website) {
      lines.push(branding.website);
    }

    // Get active social platforms with their values
    const activeSocialPlatforms = branding.showSocial && branding.social
      ? SOCIAL_PLATFORMS_CONFIG.filter(p => branding.social[p.key as keyof typeof branding.social])
        .map(p => ({
          ...p,
          value: branding.social[p.key as keyof typeof branding.social] || ''
        }))
      : [];

    const hasTextContent = lines.length > 0;
    const hasSocialIcons = activeSocialPlatforms.length > 0;

    if (!hasTextContent && !hasSocialIcons && !hasAvatar) return null;

    const textHeight = lines.length * lineHeight;

    // Calculate social section dimensions (icon + text for each platform)
    const socialItemHeight = Math.max(iconSize, fontSize);
    const socialHeight = socialLayout === 'vertical'
      ? activeSocialPlatforms.length * socialItemHeight + (activeSocialPlatforms.length - 1) * (iconGap - 4)
      : socialItemHeight;

    // Calculate total content height
    const contentHeight = (hasTextContent || hasSocialIcons)
      ? textHeight + (hasTextContent && hasSocialIcons ? 16 : 0) + (hasSocialIcons ? socialHeight : 0)
      : 0;
    const blockHeight = Math.max(contentHeight, hasAvatar ? avatarSize : 0);

    // Calculate position based on setting
    const [verticalRaw = 'bottom', horizontalRaw = 'right'] = (branding.position || 'bottom-right').split('-');
    const verticalPosition = verticalRaw === 'top' || verticalRaw === 'middle' || verticalRaw === 'bottom'
      ? verticalRaw
      : 'bottom';
    const horizontalPosition = horizontalRaw === 'left' || horizontalRaw === 'center' || horizontalRaw === 'right'
      ? horizontalRaw
      : 'right';

    let x = padding;
    let y = padding;
    let align: 'left' | 'center' | 'right' = 'left';

    if (horizontalPosition === 'left') {
      x = padding;
      align = 'left';
    } else if (horizontalPosition === 'center') {
      x = width / 2;
      align = 'center';
    } else {
      x = width - padding;
      align = 'right';
    }

    if (verticalPosition === 'top') {
      y = padding;
    } else if (verticalPosition === 'middle') {
      y = (height - blockHeight) / 2;
    } else {
      y = height - padding - blockHeight;
    }

    const totalHeight = blockHeight;
    const contentTop = contentHeight > 0 ? y + (totalHeight - contentHeight) / 2 : y;
    const avatarY = hasAvatar ? y + (totalHeight - avatarSize) / 2 : 0;
    const avatarOffset = hasAvatar ? avatarSize + avatarGap : 0;
    const avatarCenterX = align === 'right'
      ? x - avatarSize / 2
      : align === 'center'
        ? x - avatarOffset / 2
        : x + avatarSize / 2;
    const avatarCenterY = avatarY + avatarSize / 2;
    const avatarPatternScale = hasAvatar && brandingAvatar && brandingAvatar.width && brandingAvatar.height
      ? Math.max(avatarSize / brandingAvatar.width, avatarSize / brandingAvatar.height)
      : 1;

    const textStartXBase = align === 'right'
      ? x - avatarOffset
      : align === 'center'
        ? x + avatarOffset / 2
        : x + avatarOffset;
    const textX = align === 'right'
      ? 0
      : align === 'center'
        ? padding + avatarOffset / 2
        : textStartXBase;
    const textWidth = align === 'right'
      ? Math.max(textStartXBase, 0)
      : align === 'center'
        ? Math.max(width - padding * 2 - avatarOffset, 0)
        : Math.max(width - padding - textStartXBase, 0);

    // Calculate icon positions
    const iconScale = iconSize / 24; // SVG viewBox is 24x24
    const socialStartY = contentTop + textHeight + (hasTextContent ? 16 : 0);
    const anchorX = align === 'center' ? x + avatarOffset / 2 : textStartXBase;
    const horizontalItemWidths = activeSocialPlatforms.map(
      (platform) => iconSize + iconTextGap + platform.value.length * fontSize * 0.5
    );
    const totalHorizontalSocialWidth = horizontalItemWidths.reduce((sum, itemWidth) => sum + itemWidth, 0)
      + Math.max(0, activeSocialPlatforms.length - 1) * iconGap;

    return (
      <Group opacity={branding.opacity || 0.8}>

        {/* Avatar */}
        {hasAvatar && brandingAvatar && (
          <Circle
            x={avatarCenterX}
            y={avatarCenterY}
            radius={avatarSize / 2}
            fillPatternImage={brandingAvatar}
            fillPatternScaleX={avatarPatternScale}
            fillPatternScaleY={avatarPatternScale}
            fillPatternOffsetX={brandingAvatar.width / 2}
            fillPatternOffsetY={brandingAvatar.height / 2}
            listening={false}
          />
        )}

        {/* Text content */}
        {hasTextContent && (
          <Text
            x={textX}
            y={contentTop}
            width={textWidth}
            text={lines.join('\n')}
            fontSize={fontSize}
            fontFamily={branding.fontFamily || 'Inter'}
            fill={branding.color || '#ffffff'}
            align={align}
            lineHeight={1.5}
          />
        )}

        {/* Social icons with text */}
        {hasSocialIcons && activeSocialPlatforms.map((platform, index) => {
          const path = SOCIAL_ICON_PATHS[platform.key];
          if (!path) return null;

          // Calculate position for this social item
          let itemX: number;
          let itemY: number;

          if (socialLayout === 'vertical') {
            itemY = socialStartY + index * (socialItemHeight + iconGap - 4);
            if (align === 'right') {
              itemX = anchorX;
            } else if (align === 'center') {
              itemX = anchorX - horizontalItemWidths[index] / 2;
            } else {
              itemX = anchorX;
            }
          } else {
            itemY = socialStartY;
            const prevItemsWidth = horizontalItemWidths
              .slice(0, index)
              .reduce((sum, itemWidth) => sum + itemWidth, 0) + index * iconGap;
            if (align === 'right') {
              itemX = anchorX - prevItemsWidth;
            } else if (align === 'center') {
              itemX = anchorX - totalHorizontalSocialWidth / 2 + prevItemsWidth;
            } else {
              itemX = anchorX + prevItemsWidth;
            }
          }

          // Icon vertical centering within item
          const iconY = itemY + (socialItemHeight - iconSize) / 2;
          // Text vertical centering
          const textY = itemY + (socialItemHeight - fontSize) / 2;

          if (align === 'right') {
            // For right alignment: text first, then icon
            const textWidthEstimate = platform.value.length * fontSize * 0.5; // Approximate
            return (
              <Group key={platform.key}>
                <Path
                  x={itemX - iconSize}
                  y={iconY}
                  data={path}
                  fill={branding.color || '#ffffff'}
                  scaleX={iconScale}
                  scaleY={iconScale}
                />
                <Text
                  x={itemX - iconSize - iconTextGap - textWidthEstimate}
                  y={textY}
                  text={platform.value}
                  fontSize={fontSize}
                  fontFamily={branding.fontFamily || 'Inter'}
                  fill={branding.color || '#ffffff'}
                />
              </Group>
            );
          } else {
            // For left alignment: icon first, then text
            return (
              <Group key={platform.key}>
                <Path
                  x={itemX}
                  y={iconY}
                  data={path}
                  fill={branding.color || '#ffffff'}
                  scaleX={iconScale}
                  scaleY={iconScale}
                />
                <Text
                  x={itemX + iconSize + iconTextGap}
                  y={textY}
                  text={platform.value}
                  fontSize={fontSize}
                  fontFamily={branding.fontFamily || 'Inter'}
                  fill={branding.color || '#ffffff'}
                />
              </Group>
            );
          }
        })}
      </Group>
    );
  }, [background.branding, width, height, brandingAvatar]);

  // Update Transformer nodes when selection changes
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const stage = stageRef.current.getStage();
      const topLevelIds = new Set(snap.elements.map((element) => element.id));
      const selectedNodes = selectedElementIds
        .filter((id) => topLevelIds.has(id))
        .map((id) => stage?.findOne(`#${id}`))
        .filter((node) => node !== undefined) as Konva.Node[];

      transformerRef.current.nodes(selectedNodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedElementIds, snap.elements]);

  const handleStageWheel = useCallback((evt: WheelEvent) => {
    evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.05;
    const direction = evt.deltaY > 0 ? -1 : 1;
    const newZoom = Math.max(0.25, Math.min(256, zoom * (direction > 0 ? scaleBy : 1 / scaleBy)));

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / zoom,
      y: (pointer.y - stagePos.y) / zoom,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newZoom,
      y: pointer.y - mousePointTo.y * newZoom,
    };

    hasInteractedRef.current = true;
    setZoom(newZoom);
    setStagePos(newPos);
  }, [stagePos.x, stagePos.y, zoom, setZoom]);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const isMiddleClick = e.evt.button === 1;
    const isSpaceDrag = e.evt.button === 0 && spacePressedRef.current;
    const isLeftClick = e.evt.button === 0;
    const isBackground = e.target === e.target.getStage() || e.target.name() === 'background';
    const isBackgroundDrag = isLeftClick && isBackground && tool === 'select' && !spacePressedRef.current;

    // If an element is selected and we're clicking on it, don't start panning
    const clickedOnSelectedElement = selectedElementIds.length > 0 && selectedElementIds.includes(e.target.id());

    if (!isMiddleClick && !isSpaceDrag && !isBackgroundDrag && !clickedOnSelectedElement) return;

    e.evt.preventDefault();
    hasInteractedRef.current = true;
    setIsPanning(true);
    cancelClickRef.current = false;
    panStartRef.current = { x: e.evt.clientX, y: e.evt.clientY };
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (drawingArrowId && arrowStartRef.current) {
      e.evt.preventDefault();
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (stage && pointer) {
        const canvasX = (pointer.x - stagePos.x) / zoom;
        const canvasY = (pointer.y - stagePos.y) / zoom;
        updateElement(drawingArrowId, {
          points: [
            { x: arrowStartRef.current.x, y: arrowStartRef.current.y },
            { x: canvasX, y: canvasY },
          ],
        });
      }
      return;
    }
    if (drawingCodeId && codeStartRef.current) {
      e.evt.preventDefault();
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (stage && pointer) {
        const canvasX = (pointer.x - stagePos.x) / zoom;
        const canvasY = (pointer.y - stagePos.y) / zoom;
        const start = codeStartRef.current!;
        updateElement(drawingCodeId, {
          x: Math.min(start.x, canvasX),
          y: Math.min(start.y, canvasY),
          width: Math.abs(canvasX - start.x),
          height: Math.abs(canvasY - start.y),
        });
      }
      return;
    }
    if (drawingShapeId && shapeStartRef.current) {
      e.evt.preventDefault();
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (stage && pointer) {
        const canvasX = (pointer.x - stagePos.x) / zoom;
        const canvasY = (pointer.y - stagePos.y) / zoom;
        const start = shapeStartRef.current!;
        if (shapeTools.includes(tool as ShapeKind) && (tool as ShapeKind) === 'line') {
          updateElement(drawingShapeId, {
            points: [
              { x: start.x, y: start.y },
              { x: canvasX, y: canvasY },
            ],
          } as Partial<ShapeElement>);
        } else {
          updateElement(drawingShapeId, {
            x: Math.min(start.x, canvasX),
            y: Math.min(start.y, canvasY),
            width: Math.abs(canvasX - start.x),
            height: Math.abs(canvasY - start.y),
          } as Partial<ShapeElement>);
        }
      }
      return;
    }

    if (!isPanning || !panStartRef.current) return;
    e.evt.preventDefault();

    const dx = e.evt.clientX - panStartRef.current.x;
    const dy = e.evt.clientY - panStartRef.current.y;

    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      cancelClickRef.current = true;
    }

    setStagePos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    panStartRef.current = { x: e.evt.clientX, y: e.evt.clientY };
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    panStartRef.current = null;
    // Only reset cancelClickRef if no drawing is active
    if (!drawingArrowId && !drawingShapeId && !drawingCodeId) {
      cancelClickRef.current = false;
    }
  };

  // Global listeners to keep arrow preview visible even when cursor leaves stage
  useEffect(() => {
    if ((!drawingArrowId || !arrowStartRef.current) && (!drawingShapeId || !shapeStartRef.current) && (!drawingCodeId || !codeStartRef.current)) return;

    const handleMove = (ev: MouseEvent) => {
      const stage = stageRef.current;
      if (!stage) return;
      // Update internal pointer position for Konva so getPointerPosition works
      stage.setPointersPositions(ev as any);
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const canvasX = (pointer.x - stagePos.x) / zoom;
      const canvasY = (pointer.y - stagePos.y) / zoom;
      if (drawingArrowId && arrowStartRef.current) {
        updateElement(drawingArrowId, {
          points: [
            { x: arrowStartRef.current!.x, y: arrowStartRef.current!.y },
            { x: canvasX, y: canvasY },
          ],
        });
      } else if (drawingCodeId && codeStartRef.current) {
        const start = codeStartRef.current!;
        updateElement(drawingCodeId, {
          x: Math.min(start.x, canvasX),
          y: Math.min(start.y, canvasY),
          width: Math.abs(canvasX - start.x),
          height: Math.abs(canvasY - start.y),
        });
      } else if (drawingShapeId && shapeStartRef.current) {
        const start = shapeStartRef.current!;
        const current = findElement(drawingShapeId) as ShapeElement | undefined;
        if (current?.props.kind === 'line') {
          updateElement(drawingShapeId, {
            points: [
              { x: start.x, y: start.y },
              { x: canvasX, y: canvasY },
            ],
          });
        } else {
          updateElement(drawingShapeId, {
            x: Math.min(start.x, canvasX),
            y: Math.min(start.y, canvasY),
            width: Math.abs(canvasX - start.x),
            height: Math.abs(canvasY - start.y),
          } as any);
        }
      }
    };

    const handleUp = (ev: MouseEvent) => {
      const stage = stageRef.current;
      if (!stage) return;
      stage.setPointersPositions(ev as any);
      const pointer = stage.getPointerPosition();
      if (!pointer) {
        setDrawingArrowId(null);
        arrowStartRef.current = null;
        setDrawingShapeId(null);
        shapeStartRef.current = null;
        setDrawingCodeId(null);
        codeStartRef.current = null;
        return;
      }
      const endX = (pointer.x - stagePos.x) / zoom;
      const endY = (pointer.y - stagePos.y) / zoom;
      if (drawingArrowId && arrowStartRef.current) {
        const start = arrowStartRef.current!;
        const length = Math.hypot(endX - start.x, endY - start.y);
        if (length < 4) {
          deleteElement(drawingArrowId);
          selectElement(null);
        } else {
          updateElement(drawingArrowId, {
            points: [
              { x: start.x, y: start.y },
              { x: endX, y: endY },
            ],
          });
          selectElement(drawingArrowId, false);
        }
        setDrawingArrowId(null);
        arrowStartRef.current = null;
      } else if (drawingCodeId && codeStartRef.current) {
        const start = codeStartRef.current!;
        const w = Math.abs(endX - start.x);
        const h = Math.abs(endY - start.y);
        if (w < 4 && h < 4) {
          deleteElement(drawingCodeId);
          selectElement(null);
        } else {
          updateElement(drawingCodeId, {
            x: Math.min(start.x, endX),
            y: Math.min(start.y, endY),
            width: w,
            height: h,
          });
          selectElement(drawingCodeId, false);
        }
        setDrawingCodeId(null);
        codeStartRef.current = null;
      } else if (drawingShapeId && shapeStartRef.current) {
        const start = shapeStartRef.current!;
        const w = Math.abs(endX - start.x);
        const h = Math.abs(endY - start.y);
        const length = Math.hypot(endX - start.x, endY - start.y);
        const current = findElement(drawingShapeId) as ShapeElement | undefined;
        if (w < 2 && h < 2 && length < 4) {
          deleteElement(drawingShapeId);
          selectElement(null);
        } else if (current?.props.kind === 'line') {
          updateElement(drawingShapeId, {
            points: [
              { x: start.x, y: start.y },
              { x: endX, y: endY },
            ],
          });
          selectElement(drawingShapeId, false);
        } else {
          updateElement(drawingShapeId, {
            x: Math.min(start.x, endX),
            y: Math.min(start.y, endY),
            width: w,
            height: h,
          } as any);
          selectElement(drawingShapeId, false);
        }
        setDrawingShapeId(null);
        shapeStartRef.current = null;
      }
      cancelClickRef.current = true;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [drawingArrowId, drawingShapeId, drawingCodeId, stagePos.x, stagePos.y, zoom, updateElement, deleteElement, selectElement, findElement]);

  // Attach non-passive wheel listener to prevent scrolling warning
  useEffect(() => {
    const container = stageRef.current?.getStage()?.container();
    if (!container) return;
    const listener = (e: WheelEvent) => handleStageWheel(e);
    container.addEventListener('wheel', listener, { passive: false });
    return () => container.removeEventListener('wheel', listener);
  }, [handleStageWheel]);

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0 && e.evt.button !== 1) return; // Ignore right click, allow left and middle
    if (tool === 'code' && e.evt.button === 0 && !spacePressedRef.current) {
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (!stage || !pointer) return;
      const canvasX = (pointer.x - stagePos.x) / zoom;
      const canvasY = (pointer.y - stagePos.y) / zoom;
      const code = createCodeElement(canvasX, canvasY);
      code.x = canvasX;
      code.y = canvasY;
      code.width = 0;
      code.height = 0;
      addElement(code);
      selectElement(code.id, false);
      setDrawingCodeId(code.id);
      codeStartRef.current = { x: canvasX, y: canvasY };
      cancelClickRef.current = true;
      setShowResizeHandles(false);
      return;
    }

    if (shapeTools.includes(tool as ShapeKind) && e.evt.button === 0 && !spacePressedRef.current) {
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (!stage || !pointer) return;
      const canvasX = (pointer.x - stagePos.x) / zoom;
      const canvasY = (pointer.y - stagePos.y) / zoom;
      const shape = createShapeElement(tool as ShapeKind, canvasX, canvasY);
      if (shape.props.kind !== 'line') {
        shape.x = canvasX;
        shape.y = canvasY;
      }
      addElement(shape);
      selectElement(shape.id, false);
      setDrawingShapeId(shape.id);
      shapeStartRef.current = { x: canvasX, y: canvasY };
      cancelClickRef.current = true;
      setShowResizeHandles(false);
      return;
    }

    if (tool === 'arrow' && e.evt.button === 0 && !spacePressedRef.current) {
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (!stage || !pointer) return;
      const canvasX = (pointer.x - stagePos.x) / zoom;
      const canvasY = (pointer.y - stagePos.y) / zoom;
      const arrow = createArrowElement(canvasX, canvasY);
      arrow.points = [
        { x: canvasX, y: canvasY },
        { x: canvasX, y: canvasY },
      ];
      addElement(arrow);
      selectElement(arrow.id, false);
      setDrawingArrowId(arrow.id);
      arrowStartRef.current = { x: canvasX, y: canvasY };
      cancelClickRef.current = true;
      setShowResizeHandles(false);
      return;
    }

    setShowResizeHandles(true);
    handleMouseDown(e);
  };

  const handleResizeStart = (
    edge: ResizeEdge,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    hasInteractedRef.current = true;
    cancelClickRef.current = true;
    setIsPanning(false);
    setShowResizeHandles(false); // Hide Konva handles when canvas resize starts
    setResizeState({
      edge,
      startMouse: { x: e.clientX, y: e.clientY },
      startSize: { w: width, h: height },
      startPos: { x: stagePos.x, y: stagePos.y },
      startZoom: zoom,
    });
  };

  const stageRect = useMemo(() => ({
    left: stagePos.x,
    top: stagePos.y,
    width: width * zoom,
    height: height * zoom,
  }), [stagePos.x, stagePos.y, width, height, zoom]);
  const canvasCursor = useMemo(
    () => (isPanning ? 'grabbing' : spaceHeld ? 'grab' : tool !== 'select' ? 'crosshair' : 'grab'),
    [isPanning, spaceHeld, tool]
  );

  const wheelRaf = useRef<number | null>(null);
  const wheelEventRef = useRef<{
    deltaX: number;
    deltaY: number;
    ctrlKey: boolean;
    metaKey: boolean;
  } | null>(null);

  const drawingGuide = useMemo(() => {
    // Shapes (rectangle, ellipse, polygon, star) while drawing
    if (drawingShapeId) {
      const el = findElement(drawingShapeId) as ShapeElement | undefined;
      if (!el) return null;
      if (el.props.kind === 'line' && el.points?.length === 2) {
        const [p1, p2] = el.points;
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        return {
          type: 'line' as const,
          start: p1,
          end: p2,
          bbox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
          center: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
        };
      }
      return {
        type: 'shape' as const,
        bbox: { x: el.x, y: el.y, width: el.width, height: el.height },
        center: { x: el.x + el.width / 2, y: el.y + el.height / 2 },
      };
    }

    // Arrow while drawing
    if (drawingArrowId) {
      const el = findElement(drawingArrowId) as ArrowElement | undefined;
      if (el?.points?.length === 2) {
        const [p1, p2] = el.points;
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        return {
          type: 'line' as const,
          start: p1,
          end: p2,
          bbox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
          center: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
        };
      }
    }

    return null;
  }, [drawingShapeId, drawingArrowId, findElement]);

  const selectedVectorGuide = useMemo(() => {
    if (drawingShapeId || drawingArrowId) return null;
    if (selectedElementIds.length !== 1) return null;
    const selected = snap.elements.find((el) => el.id === selectedElementIds[0]);
    if (!selected) return null;

    let start: { x: number; y: number } | null = null;
    let end: { x: number; y: number } | null = null;

    if (selected.type === 'shape') {
      const line = selected as ShapeElement;
      if (line.props.kind === 'line' && line.points && line.points.length >= 2) {
        start = line.points[0];
        end = line.points[line.points.length - 1];
      }
    }

    if (selected.type === 'arrow') {
      const arrow = selected as ArrowElement;
      if (arrow.points && arrow.points.length >= 2) {
        start = arrow.points[0];
        end = arrow.points[arrow.points.length - 1];
      }
    }

    if (!start || !end) return null;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length < 0.001) return null;

    const center = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    };

    return {
      center,
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      text: `${length.toFixed(2)} × 0`,
    };
  }, [selectedElementIds, snap.elements, drawingShapeId, drawingArrowId]);

  useEffect(() => {
    return () => {
      if (wheelRaf.current) cancelAnimationFrame(wheelRaf.current);
    };
  }, []);

  // Keep Konva container cursor in sync with current interaction mode.
  // Some element-level handlers temporarily override it for resize/drag affordances.
  useEffect(() => {
    const stageContainer = stageRef.current?.container?.();
    if (!stageContainer) return;
    stageContainer.style.cursor = canvasCursor;
  }, [stageRef, canvasCursor]);

  // Handle wheel/pinch zoom and pan on canvas (debounced to next animation frame for smoothness)
  const handleContainerWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    wheelEventRef.current = {
      deltaX: e.deltaX,
      deltaY: e.deltaY,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
    };
    if (wheelRaf.current) return;

    wheelRaf.current = requestAnimationFrame(() => {
      wheelRaf.current = null;
      const evt = wheelEventRef.current;
      wheelEventRef.current = null;
      if (!evt) return;

      // Pinch/trackpad zoom
      if (evt.ctrlKey || evt.metaKey) {
        const minZoom = 0.1;
        const maxZoom = 3;
        const zoomSpeed = 0.002; // smaller = smoother
        const factor = Math.exp(-evt.deltaY * zoomSpeed);
        const targetZoom = Math.min(Math.max(zoom * factor, minZoom), maxZoom);

        // Keep the point under cursor stationary while zooming
        const stage = stageRef.current?.getStage?.();
        const pointer = stage?.getPointerPosition?.();
        if (pointer) {
          const worldX = (pointer.x - stagePos.x) / zoom;
          const worldY = (pointer.y - stagePos.y) / zoom;
          const newStagePos = {
            x: pointer.x - worldX * targetZoom,
            y: pointer.y - worldY * targetZoom,
          };
          setStagePos(newStagePos);
        }

        setZoom(targetZoom);
      } else {
        // Two-finger scroll for panning
        setStagePos(prev => ({
          x: prev.x - evt.deltaX,
          y: prev.y - evt.deltaY,
        }));
      }
    });
  }, [zoom, stagePos]);

  // Prevent default browser zoom behavior on the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventDefaultZoom = (e: WheelEvent) => {
      // Prevent default for both zoom (ctrl/meta) and pan (regular scroll)
      e.preventDefault();
    };

    // Use passive: false to allow preventDefault
    container.addEventListener('wheel', preventDefaultZoom, { passive: false });

    return () => {
      container.removeEventListener('wheel', preventDefaultZoom);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-neutral-200 dark:bg-neutral-900 overflow-hidden relative touch-none"
      style={{
        cursor: canvasCursor,
        touchAction: 'none' // Prevent default touch behaviors
      }}
      onWheel={handleContainerWheel}
      onDoubleClick={(e) => {
        // Double-click on empty area to reset pan
        if (e.target === containerRef.current) {
          resetPan();
        }
      }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={zoom}
        scaleY={zoom}
      >
        <Layer>
          {renderBackground()}
          {brandStripElement}
          {brandingElement}
          {gridLines}

          {snap.elements.map((el) => {
            if (!el.visible) return null;

            const commonProps = {
              isSelected: selectedElementIds.includes(el.id),
              draggable: tool === 'select' && !el.locked,
              onClick: (e: any) => handleElementClick(el.id, e),
              onTap: (e: any) => handleElementClick(el.id, e),
              onContextMenu: (e: any) => {
                e.evt.preventDefault();
                e.evt.stopPropagation();
                if (!selectedElementIds.includes(el.id)) {
                  selectElement(el.id, false);
                }
                handleContextMenu(e);
              },
              onDragStart: () => {
                if (!selectedElementIds.includes(el.id)) {
                  selectElement(el.id, false);
                }
              },
              onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
                updateElement(el.id, { x: e.target.x(), y: e.target.y() });
              },
              onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
                const node = e.target;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                const rotation = node.rotation();

                // Reset scale and rotation to 1 and 0, and apply changes to width/height
                node.scaleX(1);
                node.scaleY(1);
                node.rotation(0);

                updateElement(el.id, {
                  x: node.x(),
                  y: node.y(),
                  width: Math.max(5, node.width() * scaleX),
                  height: Math.max(5, node.height() * scaleY),
                  rotation: rotation,
                });
              },
            };

            switch (el.type) {
              case 'code':
                return (
                  <CodeBlock
                    key={el.id}
                    {...commonProps}
                    element={el as CodeElement}
                    onSelect={() => selectElement(el.id)}
                    onChange={(updates: Partial<CodeElement>) => updateElement(el.id, updates)}
                  />
                );
              case 'text':
                return (
                  <TextBlock
                    key={el.id}
                    {...commonProps}
                    element={el as TextElement}
                    onSelect={() => selectElement(el.id)}
                    onChange={(updates: Partial<TextElement>) => updateElement(el.id, updates)}
                  />
                );
              case 'arrow':
                return (
                  <Arrow
                    key={el.id}
                    {...commonProps}
                    element={el as ArrowElement}
                    onSelect={() => selectElement(el.id)}
                    onChange={(updates: Partial<ArrowElement>) => updateElement(el.id, updates)}
                  />
                );
              case 'shape':
                return (
                  <Shape
                    key={el.id}
                    {...commonProps}
                    element={el as ShapeElement}
                    onSelect={() => selectElement(el.id)}
                    onChange={(updates: Partial<ShapeElement>) => updateElement(el.id, updates)}
                  />
                );
              case 'image':
                return (
                  <ImageLayer
                    key={el.id}
                    element={el as ImageElement}
                    isSelected={selectedElementIds.includes(el.id)}
                    onSelect={(e) => handleElementClick(el.id, e)}
                    onContextMenu={(e) => {
                      if (!selectedElementIds.includes(el.id)) {
                        selectElement(el.id, false);
                      }
                      handleContextMenu(e);
                    }}
                    onChange={(updates) => updateElement(el.id, updates)}
                  />
                );
              case 'group':
                return (
                  <GroupLayer
                    key={el.id}
                    element={el as GroupElement}
                    onSelect={(e) => handleElementClick(el.id, e)}
                    onContextMenu={(e) => {
                      if (!selectedElementIds.includes(el.id)) {
                        selectElement(el.id, false);
                      }
                      handleContextMenu(e);
                    }}
                    onChange={(updates) => updateElement(el.id, updates)}
                  />
                );
              default:
                return null;
            }
          })}

          {/* Selected line/arrow guide (Figma-like) */}
          {selectedVectorGuide && (
            <Group listening={false}>
              <Line
                points={[selectedVectorGuide.center.x, 0, selectedVectorGuide.center.x, height]}
                stroke="#1da1f2"
                strokeWidth={1.5}
                dash={[6, 6]}
              />
              <Line
                points={[0, selectedVectorGuide.center.y, width, selectedVectorGuide.center.y]}
                stroke="#1da1f2"
                strokeWidth={1.5}
                dash={[6, 6]}
              />
              {(() => {
                const text = selectedVectorGuide.text;
                const charWidth = 7;
                const paddingH = 10;
                const paddingV = 6;
                const rectWidth = text.length * charWidth + paddingH * 2;
                const rectHeight = 20 + paddingV * 2;
                return (
                  <Group
                    x={selectedVectorGuide.center.x}
                    y={selectedVectorGuide.center.y}
                    offsetX={rectWidth / 2}
                    offsetY={rectHeight / 2}
                    rotation={selectedVectorGuide.angle}
                  >
                    <Rect
                      width={rectWidth}
                      height={rectHeight}
                      fill="#1da1f2"
                      cornerRadius={6}
                      shadowColor="rgba(0,0,0,0.2)"
                      shadowBlur={4}
                      shadowOpacity={0.4}
                    />
                    <Text
                      x={paddingH}
                      y={paddingV}
                      text={text}
                      fontSize={14}
                      fontStyle="bold"
                      fill="#ffffff"
                    />
                  </Group>
                );
              })()}
            </Group>
          )}

          {/* Live drawing guides (dimensions + center axes) */}
          {drawingGuide && (
            <Group listening={false}>
              {drawingGuide.type === 'shape' && (
                <>
                  <Line
                    points={[drawingGuide.center.x, 0, drawingGuide.center.x, height]}
                    stroke="#1da1f2"
                    strokeWidth={1.5}
                    dash={[6, 6]}
                  />
                  <Line
                    points={[0, drawingGuide.center.y, width, drawingGuide.center.y]}
                    stroke="#1da1f2"
                    strokeWidth={1.5}
                    dash={[6, 6]}
                  />
                  {(() => {
                    const text = `${Math.max(0, Math.round(drawingGuide.bbox.width))} × ${Math.max(0, Math.round(drawingGuide.bbox.height))}`;
                    const charWidth = 7;
                    const paddingH = 10;
                    const paddingV = 6;
                    const rectWidth = text.length * charWidth + paddingH * 2;
                    const rectHeight = 20 + paddingV * 2;
                    return (
                      <Group
                        x={drawingGuide.center.x}
                        y={drawingGuide.center.y}
                        offsetX={rectWidth / 2}
                        offsetY={rectHeight / 2}
                      >
                        <Rect
                          width={rectWidth}
                          height={rectHeight}
                          fill="#1da1f2"
                          cornerRadius={6}
                          shadowColor="rgba(0,0,0,0.2)"
                          shadowBlur={4}
                          shadowOpacity={0.4}
                        />
                        <Text
                          x={paddingH}
                          y={paddingV}
                          text={text}
                          fontSize={14}
                          fontStyle="bold"
                          fill="#ffffff"
                        />
                      </Group>
                    );
                  })()}
                </>
              )}

              {drawingGuide.type === 'line' && (
                <>
                  <Line
                    points={[drawingGuide.center.x, 0, drawingGuide.center.x, height]}
                    stroke="#1da1f2"
                    strokeWidth={1.5}
                    dash={[6, 6]}
                  />
                  <Line
                    points={[0, drawingGuide.center.y, width, drawingGuide.center.y]}
                    stroke="#1da1f2"
                    strokeWidth={1.5}
                    dash={[6, 6]}
                  />
                  {(() => {
                    const length = Math.hypot(
                      drawingGuide.end.x - drawingGuide.start.x,
                      drawingGuide.end.y - drawingGuide.start.y
                    );
                    const text = `${length.toFixed(2)} × 0`;
                    const charWidth = 7;
                    const paddingH = 10;
                    const paddingV = 6;
                    const rectWidth = text.length * charWidth + paddingH * 2;
                    const rectHeight = 20 + paddingV * 2;
                    const posX = drawingGuide.center.x;
                    const posY = drawingGuide.center.y;
                    const offsetX = rectWidth / 2;
                    const offsetY = rectHeight / 2;
                    return (
                      <Group
                        x={posX}
                        y={posY}
                        offsetX={offsetX}
                        offsetY={offsetY}
                        rotation={Math.atan2(drawingGuide.end.y - drawingGuide.start.y, drawingGuide.end.x - drawingGuide.start.x) * 180 / Math.PI}
                      >
                        <Rect
                          width={rectWidth}
                          height={rectHeight}
                          fill="#1da1f2"
                          cornerRadius={6}
                          shadowColor="rgba(0,0,0,0.2)"
                          shadowBlur={4}
                          shadowOpacity={0.4}
                        />
                        <Text
                          x={paddingH}
                          y={paddingV}
                          text={text}
                          fontSize={14}
                          fontStyle="bold"
                          fill="#ffffff"
                        />
                      </Group>
                    );
                  })()}
                </>
              )}
            </Group>
          )}

          <Transformer
            ref={transformerRef}
            flipEnabled={false}
            boundBoxFunc={(oldBox, newBox) => {
              // limit resize
              if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>

      {/* Resize handles overlay */}
      {showResizeHandles && (
        <div className="pointer-events-none absolute inset-0">
          {[
            { edge: 'top-left', x: stageRect.left, y: stageRect.top, cursor: 'nwse-resize' },
            { edge: 'top', x: stageRect.left + stageRect.width / 2, y: stageRect.top, cursor: 'ns-resize' },
            { edge: 'top-right', x: stageRect.left + stageRect.width, y: stageRect.top, cursor: 'nesw-resize' },
            { edge: 'right', x: stageRect.left + stageRect.width, y: stageRect.top + stageRect.height / 2, cursor: 'ew-resize' },
            { edge: 'bottom-right', x: stageRect.left + stageRect.width, y: stageRect.top + stageRect.height, cursor: 'nwse-resize' },
            { edge: 'bottom', x: stageRect.left + stageRect.width / 2, y: stageRect.top + stageRect.height, cursor: 'ns-resize' },
            { edge: 'bottom-left', x: stageRect.left, y: stageRect.top + stageRect.height, cursor: 'nesw-resize' },
            { edge: 'left', x: stageRect.left, y: stageRect.top + stageRect.height / 2, cursor: 'ew-resize' },
          ].map((h) => (
            <button
              key={h.edge}
              className="pointer-events-auto absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-[2px] shadow-sm border border-blue-400 dark:border-blue-500 hover:shadow hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              style={{ left: h.x, top: h.y, cursor: h.cursor }}
              onMouseDown={(e) => handleResizeStart(h.edge as ResizeEdge, e)}
              aria-label={`Resize ${h.edge}`}
            />
          ))}
        </div>
      )}

      {/* Command Menu */}
      <CommandMenu
        isOpen={commandMenuOpen}
        onClose={() => setCommandMenuOpen(false)}
        tool={tool}
        setTool={(newTool) => {
          useCanvasStore.setState({ tool: newTool });
        }}
        showGrid={showGrid}
        setShowGrid={(show) => {
          useCanvasStore.setState({ showGrid: show });
        }}
        zoom={zoom}
        setZoom={setZoom}
        onClearCanvas={() => {
          // Clear all elements
          useCanvasStore.setState((state) => ({
            ...state,
            snap: {
              ...state.snap,
              elements: [],
            },
          }));
        }}
      />
      {/* Context Menu Overlay */}
      <CanvasContextMenuOverlay />
    </div>
  );
};

export default memo(Canvas);
