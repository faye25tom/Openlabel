import React, { useState } from 'react';
import { DataSegment, DEFAULT_FONT, DEFAULT_PROMPT, LabelElement } from '../types/model';

interface OcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecognizedElement: (element: LabelElement) => void;
}

export const OcrModal: React.FC<OcrModalProps> = ({
  isOpen,
  onClose,
  onAddRecognizedElement,
}) => {
  const [inputText, setInputText] = useState<string>(
    'SKU: OL-9002-PRO\nMFG: 2026-10-17\nEXP: 2027-04-17\nSN: 882049102941'
  );
  const [extractedType, setExtractedType] = useState<'text' | 'barcode'>('text');

  if (!isOpen) return null;

  const handleApply = () => {
    const lines = inputText.trim().split('\n');
    const firstLine = lines[0] || 'RECOGNIZED CONTENT';

    const el: LabelElement = {
      id: `el-ocr-${Date.now()}`,
      name: extractedType === 'barcode' ? 'OCR Barcode' : 'OCR Text',
      xMm: 8,
      yMm: 8,
      widthMm: extractedType === 'barcode' ? 50 : 40,
      heightMm: extractedType === 'barcode' ? 15 : 8,
      locked: false,
      kind:
        extractedType === 'barcode'
          ? {
              type: 'barcode',
              symbology: 'code128',
              segments: [{ type: 'constant', text: firstLine.replace(/[^A-Za-z0-9-]/g, '') }],
              activeSegmentIdx: 0,
              showHumanReadable: true,
              font: { ...DEFAULT_FONT, sizePt: 8, align: 'center' },
              prompt: DEFAULT_PROMPT,
            }
          : {
              type: 'text',
              segments: [{ type: 'constant', text: inputText }],
              activeSegmentIdx: 0,
              font: { ...DEFAULT_FONT, sizePt: 9, align: 'left' },
              prompt: DEFAULT_PROMPT,
            },
    };

    onAddRecognizedElement(el);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs select-none">
      <div className="w-[520px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900">
              Recognize & OCR Extractor
            </span>
            <span className="text-xs text-slate-500 font-mono">
              (Quick Import)
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg w-6 h-6 flex items-center justify-center rounded cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Extract text or generate barcodes from physical package label photos, OCR scans, or clipboard text.
          </p>

          <div>
            <label className="block text-slate-600 font-medium mb-1.5">
              Recognized Content / Clipboard Text:
            </label>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Generate Target Element:
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="ocr-type"
                  checked={extractedType === 'text'}
                  onChange={() => setExtractedType('text')}
                  className="text-sky-600"
                />
                <span>Multi-line Text Element</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="ocr-type"
                  checked={extractedType === 'barcode'}
                  onChange={() => setExtractedType('barcode')}
                  className="text-sky-600"
                />
                <span>Industrial Barcode (Code128)</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleApply}
            className="w-full py-2 bg-[#0084ff] hover:bg-[#0073e6] text-white font-medium rounded-lg text-xs"
          >
            Insert Recognized Element onto Canvas
          </button>
        </div>
      </div>
    </div>
  );
};
