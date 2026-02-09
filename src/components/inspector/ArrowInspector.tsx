import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import type { ArrowElement } from '../../types';
import SliderField from '../ui/SliderField';
import AccessibleColorPicker from '../ui/AccessibleColorPicker';

interface ArrowInspectorProps {
  element: ArrowElement;
}

const ArrowInspector: React.FC<ArrowInspectorProps> = ({ element }) => {
  const { updateElement } = useCanvasStore();

  const update = (updates: Partial<ArrowElement>) => {
    updateElement(element.id, updates);
  };

  const updateProps = (props: Partial<ArrowElement['props']>) => {
    update({ props: { ...element.props, ...props } });
  };

  const start = element.points[0];
  const end = element.points[element.points.length - 1];

  const updateStart = (coord: 'x' | 'y', value: number) => {
    const delta = coord === 'x' ? value - start.x : value - start.y;
    const newPoints = element.points.map((p) => ({
      x: p.x + (coord === 'x' ? delta : 0),
      y: p.y + (coord === 'y' ? delta : 0),
    }));
    update({ points: newPoints });
  };

  const updateEnd = (coord: 'x' | 'y', value: number) => {
    const newPoints = [...element.points];
    newPoints[newPoints.length - 1] = {
      x: coord === 'x' ? value : end.x,
      y: coord === 'y' ? value : end.y,
    };
    update({ points: newPoints });
  };

  const addControlPoint = () => {
    const start = element.points[0];
    const end = element.points[element.points.length - 1];
    const currentControlPoints = element.props.controlPoints || [];
    
    if (currentControlPoints.length < 2) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      
      const newPoint = currentControlPoints.length === 0
        ? { x: midX - dy * 0.3, y: midY + dx * 0.3 }
        : { x: midX + dy * 0.3, y: midY - dx * 0.3 };
      
      updateProps({ controlPoints: [...currentControlPoints, newPoint] });
    }
  };

  const removeControlPoint = (index: number) => {
    const currentControlPoints = element.props.controlPoints || [];
    const newControlPoints = currentControlPoints.filter((_, i) => i !== index);
    updateProps({ controlPoints: newControlPoints });
  };

  const resetControlPoints = () => {
    updateProps({ controlPoints: [] });
  };

  return (
    <div className="space-y-4">
      {/* Position */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Start X</label>
          <input
            type="number"
          value={Math.round(start.x)}
          onChange={(e) => updateStart('x', Number(e.target.value))}
          className="w-full bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white px-3 py-2 rounded-lg text-sm border border-neutral-200 dark:border-white/5 focus:border-blue-500/50 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Start Y</label>
        <input
          type="number"
          value={Math.round(start.y)}
          onChange={(e) => updateStart('y', Number(e.target.value))}
          className="w-full bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white px-3 py-2 rounded-lg text-sm border border-neutral-200 dark:border-white/5 focus:border-blue-500/50 focus:outline-none"
        />
      </div>
        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">End X</label>
          <input
            type="number"
            value={Math.round(end.x)}
            onChange={(e) => updateEnd('x', Number(e.target.value))}
            className="w-full bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white px-3 py-2 rounded-lg text-sm border border-neutral-200 dark:border-white/5 focus:border-blue-500/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">End Y</label>
          <input
            type="number"
            value={Math.round(end.y)}
            onChange={(e) => updateEnd('y', Number(e.target.value))}
            className="w-full bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white px-3 py-2 rounded-lg text-sm border border-neutral-200 dark:border-white/5 focus:border-blue-500/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Style */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-2">Style</label>
        <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
          <button
            onClick={() => updateProps({ style: 'straight' })}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              element.props.style === 'straight'
                ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'
            }`}
          >
            Straight
          </button>
          <button
            onClick={() => updateProps({ style: 'curved' })}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              element.props.style === 'curved'
                ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'
            }`}
          >
            Curved
          </button>
        </div>
      </div>

      {/* Control points for curved arrows */}
      {element.props.style === 'curved' && (
        <div>
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-2">
            Control Points ({(element.props.controlPoints || []).length}/2)
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={addControlPoint}
                disabled={(element.props.controlPoints || []).length >= 2}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                + Add Point
              </button>
              <button
                onClick={resetControlPoints}
                disabled={(element.props.controlPoints || []).length === 0}
                className="py-2 px-3 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reset
              </button>
            </div>
            {(element.props.controlPoints || []).length > 0 && (
              <div className="space-y-1">
                {(element.props.controlPoints || []).map((cp, index) => (
                  <div key={index} className="flex items-center justify-between py-1.5 px-2 bg-neutral-100 dark:bg-white/5 rounded-md">
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                      Point {index + 1}: ({Math.round(cp.x)}, {Math.round(cp.y)})
                    </span>
                    <button
                      onClick={() => removeControlPoint(index)}
                      className="p-1 rounded hover:bg-red-500/20 text-neutral-500 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              Drag the blue handles on the canvas to adjust the curve shape.
            </p>
          </div>
        </div>
      )}

      {/* Color */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-2">Color</label>
        <div className="flex gap-2 items-center p-2 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
          <AccessibleColorPicker
            value={element.props.color}
            onChange={(color) => updateProps({ color })}
            ariaLabel="Arrow color"
          />
          <input
            type="text"
            value={element.props.color}
            onChange={(e) => updateProps({ color: e.target.value })}
            className="flex-1 bg-transparent text-neutral-900 dark:text-white text-sm focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Thickness */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-2">
          Thickness: {element.props.thickness}px
        </label>
        <SliderField
          min={1}
          max={12}
          step={1}
          value={element.props.thickness}
          onValueChange={(v) => updateProps({ thickness: v })}
          ariaLabel="Arrow thickness"
        />
      </div>

      {/* Arrow head */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-2">Arrow Head</label>
        <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
          <button
            onClick={() => updateProps({ head: 'filled' })}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
              element.props.head === 'filled'
                ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'
            }`}
          >
            Filled
          </button>
          <button
            onClick={() => updateProps({ head: 'outline' })}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
              element.props.head === 'outline'
                ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'
            }`}
          >
            Outline
          </button>
          <button
            onClick={() => updateProps({ head: 'none' })}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
              element.props.head === 'none'
                ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'
            }`}
          >
            None
          </button>
        </div>
      </div>

      {/* Label */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-2">Label (Optional)</label>
        <input
          type="text"
          value={element.props.label || ''}
          onChange={(e) => updateProps({ label: e.target.value || undefined })}
          placeholder="Add a label..."
          className="w-full bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white px-3 py-2 rounded-lg text-sm border border-neutral-200 dark:border-white/5 focus:border-blue-500/50 focus:outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
        />
      </div>

      {/* Label position */}
      {element.props.label && (
        <div>
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-2">
            Label Position: {Math.round((element.props.labelPosition || 0.5) * 100)}%
          </label>
          <SliderField
            min={0}
            max={100}
            step={1}
            value={(element.props.labelPosition || 0.5) * 100}
            onValueChange={(v) => updateProps({ labelPosition: v / 100 })}
            ariaLabel="Label position"
          />
        </div>
      )}

      {/* Points info */}
      <div className="pt-2 border-t border-neutral-200 dark:border-white/5">
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          Drag the white handles on the canvas to move the arrow endpoints.
        </p>
      </div>
    </div>
  );
};

export default ArrowInspector;
