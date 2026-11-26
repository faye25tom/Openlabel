import React from 'react';
import { Barcode, Search } from 'lucide-react';
import { BarcodeSymbology, LabelElement } from '../../types/model';
import { InspectorSection } from '../ui/InspectorSection';

interface BarcodeSectionProps {
  element: LabelElement;
  kind: Extract<LabelElement['kind'], { type: 'barcode' }>;
  onChangeKind: (kind: LabelElement['kind']) => void;
  onOpenBarcodePicker?: () => void;
}

export const BarcodeSection: React.FC<BarcodeSectionProps> = ({
  kind,
  onChangeKind,
  onOpenBarcodePicker,
}) => {
  return (
    <InspectorSection
      title="一维条码 (Barcode)"
      icon={<Barcode className="w-3.5 h-3.5" />}
      rightSlot={
        onOpenBarcodePicker && (
          <button
            type="button"
            onClick={onOpenBarcodePicker}
            className="px-2 py-0.5 bg-blue-50 text-[#0066FF] hover:bg-blue-100 border border-blue-200 rounded text-[10px] font-medium transition-colors flex items-center gap-1"
          >
            <Search className="w-2.5 h-2.5" />
            <span>All Barcode</span>
          </button>
        )
      }
    >
      <div className="space-y-2.5">
        <div>
          <label className="block text-[11px] text-slate-500 font-medium mb-1">
            码制标准 (1D Symbology)
          </label>
          <select
            value={kind.symbology}
            onChange={(e) =>
              onChangeKind({
                ...kind,
                symbology: e.target.value as BarcodeSymbology,
              })
            }
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-semibold text-slate-800 outline-none focus:border-[#0066FF]"
          >
            <optgroup label="Common 1D Barcodes">
              <option value="code128">CODE 128 (Universal High Density)</option>
              <option value="code39">CODE 39 (Standard Industrial)</option>
              <option value="ean13">EAN-13 (International Retail)</option>
              <option value="ean8">EAN-8 (Compact Retail)</option>
              <option value="upca">UPC-A (North American Retail)</option>
              <option value="upce">UPC-E (Zero-Suppressed UPC)</option>
              <option value="itf14">ITF-14 (Shipping Master Carton)</option>
              <option value="codabar">CODABAR (Logistics / Blood Bank)</option>
            </optgroup>
            <optgroup label="Extended Industrial & Alphanumeric">
              <option value="code128a">CODE 128 A (Uppercase & Control)</option>
              <option value="code128b">CODE 128 B (Upper/Lower & Ascii)</option>
              <option value="code128c">CODE 128 C (Double-density Digits)</option>
              <option value="code39ext">CODE 39 Extended (Full 128 ASCII)</option>
              <option value="code93">CODE 93 (High Density Alphanumeric)</option>
            </optgroup>
            <optgroup label="Supply Chain & Specialized">
              <option value="gs1-128">GS1-128 (UCC/EAN-128 Supply Chain)</option>
              <option value="itf">Interleaved 2 of 5 (Standard Numeric)</option>
              <option value="pharmacode">Pharmacode (Pharmaceutical Packaging)</option>
              <option value="code16k">CODE 16K (Multi-row Stacked)</option>
              <option value="code49">CODE 49 (Ultra-compact Stacked)</option>
            </optgroup>
          </select>
        </div>

        <label className="flex items-center gap-2 text-slate-700 cursor-pointer pt-0.5">
          <input
            type="checkbox"
            checked={kind.showHumanReadable}
            onChange={(e) =>
              onChangeKind({
                ...kind,
                showHumanReadable: e.target.checked,
              })
            }
            className="rounded text-[#0066FF]"
          />
          <span className="text-xs">显示供人识读字符 (Human Readable Text)</span>
        </label>
      </div>
    </InspectorSection>
  );
};
