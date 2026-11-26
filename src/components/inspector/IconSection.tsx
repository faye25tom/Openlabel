import React from 'react';
import { Stamp } from 'lucide-react';
import { LabelElement } from '../../types/model';
import { INDUSTRIAL_ICONS } from '../../data/catalogs';
import { InspectorSection } from '../ui/InspectorSection';
import { IndustrialIconSvg } from '../ui/ShapePreviewSvg';

interface IconSectionProps {
  kind: Extract<LabelElement['kind'], { type: 'icon' }>;
  onChangeKind: (kind: LabelElement['kind']) => void;
}

export const IconSection: React.FC<IconSectionProps> = ({ kind, onChangeKind }) => {
  return (
    <InspectorSection title="工业图标属性 (Icon)" icon={<Stamp className="w-3.5 h-3.5" />}>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          {INDUSTRIAL_ICONS.map((ic) => {
            const active = kind.iconName === ic.id;
            return (
              <button
                key={ic.id}
                type="button"
                onClick={() => onChangeKind({ ...kind, iconName: ic.id })}
                className={`p-2 rounded border flex flex-col items-center justify-center gap-1 transition-colors ${
                  active
                    ? 'bg-blue-50 border-[#0066FF] text-[#0066FF] font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-5 h-5">
                  <IndustrialIconSvg name={ic.id} color="currentColor" />
                </div>
                <span className="text-[10px] truncate w-full text-center">
                  {ic.id}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
          <label className="text-slate-600 font-medium text-[11px]">图标颜色</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={kind.color || '#000000'}
              onChange={(e) => onChangeKind({ ...kind, color: e.target.value })}
              className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0.5"
            />
            <span className="font-mono text-xs text-slate-600 uppercase">
              {kind.color || '#000000'}
            </span>
          </div>
        </div>
      </div>
    </InspectorSection>
  );
};
