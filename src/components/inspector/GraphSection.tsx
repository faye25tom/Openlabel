import React, { useState } from 'react';
import { Shapes } from 'lucide-react';
import { LabelElement, LineStyle } from '../../types/model';
import { SHAPE_CATALOG, ShapeCatalogCategory } from '../../data/catalogs';
import { NumberInput } from '../ui/NumberInput';
import { InspectorSection } from '../ui/InspectorSection';
import { GraphShapeSvg } from '../ui/ShapePreviewSvg';

interface GraphSectionProps {
  kind: Extract<LabelElement['kind'], { type: 'graph' }>;
  onChangeKind: (kind: LabelElement['kind']) => void;
}

export const GraphSection: React.FC<GraphSectionProps> = ({
  kind,
  onChangeKind,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | ShapeCatalogCategory>('all');

  return (
    <InspectorSection
      title="几何图形与外观 (Shape)"
      icon={<Shapes className="w-3.5 h-3.5" />}
      rightSlot={
        <span className="text-[10px] text-slate-400 font-mono">{kind.shape}</span>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'basic', label: 'Basic' },
                { id: 'lines', label: 'Lines' },
                { id: 'safety', label: 'Safety' },
                { id: 'polygons', label: 'Polygons' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                  categoryFilter === cat.id
                    ? 'bg-[#0066FF] text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="max-h-52 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-lg">
            <div className="grid grid-cols-4 gap-1">
              {SHAPE_CATALOG.filter(
                (item) => categoryFilter === 'all' || item.category === categoryFilter,
              ).map((item) => {
                const active = kind.shape === item.shape;
                return (
                  <button
                    key={item.shape}
                    type="button"
                    onClick={() => onChangeKind({ ...kind, shape: item.shape })}
                    className={`py-1.5 px-0.5 flex flex-col items-center justify-center rounded transition-colors text-center ${
                      active
                        ? 'bg-[#0066FF] text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 bg-slate-50/50 border border-slate-100'
                    }`}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      <GraphShapeSvg
                        shape={item.shape}
                        strokeWidth={5}
                        strokeColor="currentColor"
                        preserveAspectRatio="xMidYMid meet"
                      />
                    </div>
                    <span className="text-[9px] mt-1 tracking-tight truncate w-full">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-slate-600 font-medium text-[11px] mb-1">
              线宽 (mm)
            </label>
            <NumberInput
              min={0.01}
              step={0.01}
              value={kind.lineThicknessMm}
              onChange={(lineThicknessMm) =>
                onChangeKind({ ...kind, lineThicknessMm })
              }
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono tabular-nums"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium text-[11px] mb-1">
              线型 (Line Style)
            </label>
            <select
              value={kind.lineStyle || 'solid'}
              onChange={(e) =>
                onChangeKind({
                  ...kind,
                  lineStyle: e.target.value as LineStyle,
                })
              }
              className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
            >
              <option value="solid">Solid (实线)</option>
              <option value="dashed">Dashed (虚线)</option>
              <option value="dotted">Dotted (点线)</option>
            </select>
          </div>
        </div>

        {(kind.shape === 'rounded_rect' || kind.shape === 'snip_corner_rect') && (
          <div>
            <label className="block text-slate-600 font-medium text-[11px] mb-1">
              圆角 / 切角半径 (mm)
            </label>
            <NumberInput
              min={0}
              step={0.1}
              value={kind.cornerRadiusMm ?? 3}
              onChange={(cornerRadiusMm) =>
                onChangeKind({ ...kind, cornerRadiusMm })
              }
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono tabular-nums"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <label className="text-slate-600 font-medium text-[11px]">描边颜色</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={kind.strokeColor || '#000000'}
              onChange={(e) =>
                onChangeKind({ ...kind, strokeColor: e.target.value })
              }
              className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0.5"
            />
            <span className="font-mono text-xs text-slate-600 uppercase">
              {kind.strokeColor || '#000000'}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
          <label className="flex items-center gap-2 text-slate-700 cursor-pointer font-medium text-[11px]">
            <input
              type="checkbox"
              checked={kind.filled}
              onChange={(e) =>
                onChangeKind({ ...kind, filled: e.target.checked })
              }
              className="rounded text-[#0066FF]"
            />
            <span>填充颜色 (Filled)</span>
          </label>

          {kind.filled && (
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={kind.fillColor || '#ffffff'}
                onChange={(e) =>
                  onChangeKind({ ...kind, fillColor: e.target.value })
                }
                className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0.5"
              />
              <span className="font-mono text-xs text-slate-600 uppercase">
                {kind.fillColor || '#ffffff'}
              </span>
            </div>
          )}
        </div>
      </div>
    </InspectorSection>
  );
};
