import React from 'react';
import { LabelElement } from '../types/model';

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
  if (!isOpen) return null;

  const icons = [
    { id: 'warning', name: 'Caution / Warning', symbol: '⚠️' },
    { id: 'fragile', name: 'Fragile Handle With Care', symbol: '🍷' },
    { id: 'this-side-up', name: 'This Side Up Arrows', symbol: '⬆️⬆️' },
    { id: 'ce', name: 'CE Conformity Mark', symbol: '🇪🇺 CE' },
    { id: 'rohs', name: 'RoHS Compliant', symbol: '🌱 RoHS' },
    { id: 'recycle', name: 'Recyclable Packaging', symbol: '♻️' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs select-none">
      <div className="w-[480px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-base font-bold text-slate-900">
            Industrial Compliance & Packaging Icons
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg w-6 h-6 flex items-center justify-center rounded cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 text-xs">
          {icons.map((ic) => (
            <button
              key={ic.id}
              onClick={() => {
                onSelectIcon(ic.id);
                onClose();
              }}
              className="p-3 border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 rounded-lg flex items-center gap-3 transition-colors text-left cursor-pointer"
            >
              <span className="text-2xl">{ic.symbol}</span>
              <div>
                <div className="font-semibold text-slate-800">{ic.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Vector ISO/IEC symbol
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
