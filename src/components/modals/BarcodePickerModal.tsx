import React, { useState } from 'react';
import { Barcode, Check, Search, X } from 'lucide-react';
import { BarcodeSymbology } from '../../types/model';
import { BARCODE_SYMBOLOGIES, BarcodeSymbologyInfo } from '../../data/catalogs';
import { ModalShell } from '../ui/ModalShell';

interface BarcodePickerModalProps {
  isOpen: boolean;
  activeSymbology?: BarcodeSymbology;
  onClose: () => void;
  onSelectSymbology: (symbology: BarcodeSymbology) => void;
}

export const BarcodePickerModal: React.FC<BarcodePickerModalProps> = ({
  isOpen,
  activeSymbology = 'code128',
  onClose,
  onSelectSymbology,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<'All' | BarcodeSymbologyInfo['category']>('All');

  const filtered = BARCODE_SYMBOLOGIES.filter((b) => {
    const matchesCat = category === 'All' || b.category === category;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      b.shortTag.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="全部一维条码码制 (All Barcodes)"
      subtitle="选择并应用符合行业标准的 1D 条形码编码规范"
      icon={<Barcode className="w-4 h-4" />}
      maxWidthClass="max-w-[420px] w-full"
      maxHeightClass="max-h-[560px]"
    >
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-slate-100 space-y-2">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索码制名称或行业用途..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-100/80 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#0066FF] focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            {(['All', 'Common', 'Standard', 'Postal/Pharma'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  category === cat
                    ? 'bg-[#0066FF] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 text-xs">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              未找到匹配的条码类型
            </div>
          ) : (
            filtered.map((b) => {
              const isSelected = b.id === activeSymbology;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    onSelectSymbology(b.id);
                    onClose();
                  }}
                  className={`w-full px-3 py-2 text-left rounded-lg transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50 text-[#0066FF] font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs">{b.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">
                        {b.shortTag}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {b.description}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#0066FF] shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </ModalShell>
  );
};
