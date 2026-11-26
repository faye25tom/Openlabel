import React, { useState } from 'react';
import { ScanText } from 'lucide-react';
import { DEFAULT_FONT, DEFAULT_PROMPT, LabelElement } from '../../types/model';
import { ModalShell } from '../ui/ModalShell';

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
    'SKU: OL-9002-PRO\nMFG: 2026-10-17\nEXP: 2027-04-17\nSN: 882049102941',
  );
  const [extractedType, setExtractedType] = useState<'text' | 'barcode'>('text');

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
              segments: [
                {
                  type: 'constant',
                  text: firstLine.replace(/[^A-Za-z0-9-]/g, ''),
                },
              ],
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
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="文字识别与快速导入 (OCR Extractor)"
      subtitle="从拍照识别或剪贴板文本快速生成标签文本或一维条码"
      icon={<ScanText className="w-4 h-4" />}
      maxWidthClass="max-w-[520px] w-full"
    >
      <div className="p-5 space-y-4 text-xs">
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">
            识别结果 / 剪贴板文本:
          </label>
          <textarea
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded-lg outline-none focus:border-[#0066FF]"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">
            生成目标图元类型:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <label
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                extractedType === 'text'
                  ? 'bg-blue-50 border-[#0066FF] text-slate-900 font-medium'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <input
                type="radio"
                name="ocr-type"
                checked={extractedType === 'text'}
                onChange={() => setExtractedType('text')}
                className="text-[#0066FF]"
              />
              <span>多行文本图元 (Text)</span>
            </label>
            <label
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                extractedType === 'barcode'
                  ? 'bg-blue-50 border-[#0066FF] text-slate-900 font-medium'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <input
                type="radio"
                name="ocr-type"
                checked={extractedType === 'barcode'}
                onChange={() => setExtractedType('barcode')}
                className="text-[#0066FF]"
              />
              <span>工业条码 (Code 128)</span>
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={handleApply}
          className="w-full py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold rounded-lg text-xs transition-colors"
        >
          插入识别图元到画布
        </button>
      </div>
    </ModalShell>
  );
};
