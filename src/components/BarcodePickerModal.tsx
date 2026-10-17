import React, { useState } from 'react';
import { BarcodeSymbology } from '../types/model';

interface BarcodePickerModalProps {
  isOpen: boolean;
  activeSymbology?: BarcodeSymbology;
  onClose: () => void;
  onSelectSymbology: (symbology: BarcodeSymbology) => void;
}

export const BARCODE_SYMBOLOGIES: {
  id: BarcodeSymbology;
  name: string;
  category: 'Common' | 'Standard' | 'Postal/Pharma';
  description: string;
}[] = [
  { id: 'codabar', name: 'CODABAR', category: 'Common', description: 'Library, blood bank, delivery logistics' },
  { id: 'code128', name: 'CODE 128', category: 'Common', description: 'Universal high-density alphanumeric' },
  { id: 'code128a', name: 'CODE128 A', category: 'Standard', description: 'Uppercase letters, numbers, control codes' },
  { id: 'code128b', name: 'CODE128 B', category: 'Standard', description: 'Upper & lowercase letters and numbers' },
  { id: 'code128c', name: 'CODE128 C', category: 'Standard', description: 'Double density numeric digits (00-99)' },
  { id: 'code16k', name: 'CODE 16K', category: 'Standard', description: 'Multi-row stacked high-density symbology' },
  { id: 'code49', name: 'CODE 49', category: 'Standard', description: 'Ultra-compact stacked 2D barcode' },
  { id: 'code39', name: 'CODE 39', category: 'Common', description: 'Automotive and defense industrial standard' },
  { id: 'code39ext', name: 'CODE 39 EXTENDED', category: 'Standard', description: 'Full 128 ASCII Code 39 extension' },
  { id: 'code93', name: 'CODE 93', category: 'Standard', description: 'High density compact Code 39 successor' },
  { id: 'ean13', name: 'EAN-13', category: 'Common', description: 'International retail consumer product code' },
  { id: 'ean8', name: 'EAN-8', category: 'Common', description: 'Compact retail packages code' },
  { id: 'upca', name: 'UPC-A', category: 'Common', description: 'North American retail barcode standard' },
  { id: 'upce', name: 'UPC-E', category: 'Common', description: 'Zero-suppressed compact UPC code' },
  { id: 'itf14', name: 'ITF-14', category: 'Standard', description: 'Master shipping carton 14-digit code' },
  { id: 'itf', name: 'INTERLEAVED 2 OF 5', category: 'Standard', description: 'Warehouse distribution numeric code' },
  { id: 'gs1-128', name: 'GS1-128', category: 'Standard', description: 'Global supply chain application identifiers' },
  { id: 'pharmacode', name: 'PHARMACODE', category: 'Postal/Pharma', description: 'Pharmaceutical packaging control code' },
];

export const BarcodePickerModal: React.FC<BarcodePickerModalProps> = ({
  isOpen,
  activeSymbology = 'code128',
  onClose,
  onSelectSymbology,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = BARCODE_SYMBOLOGIES.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs select-none">
      <div className="w-[340px] max-h-[520px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header (Matching Screenshot 1) */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">All Barcode</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm w-6 h-6 flex items-center justify-center rounded cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Search Bar (Matching Screenshot 1) */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="w-full pl-8 pr-7 py-1.5 bg-[#f1f5f9]/70 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Barcode List (Matching Screenshot 1) */}
        <div className="flex-1 overflow-y-auto p-1 text-xs">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No matching barcodes
            </div>
          ) : (
            filtered.map((b) => {
              const isSelected = b.id === activeSymbology;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    onSelectSymbology(b.id);
                    onClose();
                  }}
                  className={`w-full px-3 py-2 text-left rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-xs tracking-tight">{b.name}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[240px]">
                      {b.description}
                    </span>
                  </div>
                  {isSelected && <span className="text-sky-600 text-xs">✓</span>}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
