import React from 'react';
import { Stamp } from 'lucide-react';
import { INDUSTRIAL_ICONS } from '../../data/catalogs';
import { ModalShell } from '../ui/ModalShell';
import { IndustrialIconSvg } from '../ui/ShapePreviewSvg';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: string) => void;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectIcon,
}) => {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="工业合规与包装矢量图标 (Icons)"
      subtitle="ISO / EU 标准工业标识，高分辨率矢量打印"
      icon={<Stamp className="w-4 h-4" />}
      maxWidthClass="max-w-[500px] w-full"
    >
      <div className="p-4 grid grid-cols-2 gap-2.5 text-xs">
        {INDUSTRIAL_ICONS.map((ic) => (
          <button
            key={ic.id}
            type="button"
            onClick={() => {
              onSelectIcon(ic.id);
              onClose();
            }}
            className="p-3 border border-slate-200 hover:border-[#0066FF] hover:bg-blue-50/50 rounded-lg flex items-center gap-3 transition-colors text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-white border border-slate-200/80 p-1.5 text-slate-800 shrink-0">
              <IndustrialIconSvg name={ic.id} color="currentColor" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 truncate">{ic.zhName}</div>
              <div className="text-[11px] text-slate-500 truncate">{ic.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{ic.standard}</div>
            </div>
          </button>
        ))}
      </div>
    </ModalShell>
  );
};
