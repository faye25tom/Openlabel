import React, { useState } from 'react';
import { LabelProject } from '../types/model';
import { compileToTspl2, compileToZpl2, Dpi } from '../engine/tspl_compiler';
import { EvalContext, evaluateSegments } from '../engine/evaluator';
import { BarcodeRenderer } from './BarcodeRenderer';
import { QrCodeRenderer } from './QrCodeRenderer';

interface PrintDialogProps {
  isOpen: boolean;
  project: LabelProject;
  onClose: () => void;
}

export const PrintDialog: React.FC<PrintDialogProps> = ({
  isOpen,
  project,
  onClose,
}) => {
  const [printer, setPrinter] = useState<string>('tspl-203');
  const [quantity, setQuantity] = useState<number>(3);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showRawCode, setShowRawCode] = useState<boolean>(false);
  const [rawCodeType, setRawCodeType] = useState<'tspl' | 'zpl'>('tspl');
  const [copied, setCopied] = useState<boolean>(false);

  // Check for any elements with Print-time Input enabled
  const printTimeElements = project.elements.filter((el) => {
    if ('prompt' in el.kind) {
      return el.kind.prompt.printTimeInput;
    }
    return false;
  });

  const [printTimeValues, setPrintTimeValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const el of project.elements) {
      if ('prompt' in el.kind && el.kind.prompt.printTimeInput) {
        initial[el.id] = el.kind.prompt.promptHint || 'INSPECTOR-01';
      }
    }
    return initial;
  });

  if (!isOpen) return null;

  // Build evaluation context for the currently previewed page
  const dbRows = project.database?.rows || [];
  const dbIndex = dbRows.length > 0 ? (project.currentRecordIndex + currentPage) % dbRows.length : 0;

  const currentEvalCtx: EvalContext = {
    labelSequenceIndex: currentPage,
    dbRowIndex: dbIndex,
    table: project.database,
    fixedNow: new Date(),
    sharedOverrides: project.sharedFields,
    printTimeInputs: printTimeValues,
  };

  // Compile raw hardware commands
  const dpi: Dpi = printer.includes('300') ? 300 : 203;
  const compiledTspl = compileToTspl2(project, currentEvalCtx, dpi);
  const compiledZpl = compileToZpl2(project, currentEvalCtx, dpi);
  const activeRawCode = rawCodeType === 'tspl' ? compiledTspl : compiledZpl;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeRawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPrn = () => {
    const blob = new Blob([activeRawCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '_')}_${rawCodeType.toUpperCase()}.prn`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const paper = project.paper;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs select-none">
      <div className="w-[840px] max-h-[90vh] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900">
              Print Workstation
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({paper.widthMm}×{paper.heightMm}mm)
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg w-6 h-6 flex items-center justify-center rounded cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body Split */}
        <div className="p-6 grid grid-cols-2 gap-6 overflow-y-auto">
          {/* Left: Print Setup */}
          <div className="space-y-4 text-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 font-medium mb-1.5">
                  Target Printer / Output Device
                </label>
                <select
                  value={printer}
                  onChange={(e) => {
                    setPrinter(e.target.value);
                    if (e.target.value.includes('zpl')) {
                      setRawCodeType('zpl');
                    } else {
                      setRawCodeType('tspl');
                    }
                  }}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded text-slate-800 text-xs bg-white outline-none focus:border-sky-500"
                >
                  <option value="tspl-203">
                    TSC / Gainscha / Deli Thermal Printer (TSPL2 @ 203 DPI)
                  </option>
                  <option value="tspl-300">
                    TSC Industrial High-Res (TSPL2 @ 300 DPI)
                  </option>
                  <option value="zpl-203">
                    Zebra Barcode Printer (ZPL II @ 203 DPI)
                  </option>
                  <option value="pdf">
                    Microsoft Print to PDF / Native Vector Print
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">
                  Print Quantity (Batch count)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                  />
                  <span className="text-slate-500 text-xs">
                    labels (Serials & DB step automatically)
                  </span>
                </div>
              </div>

              {/* Operator Print-Time Input Prompts */}
              {printTimeElements.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <span>👑</span>
                    <span>Operator Print-Time Input Required</span>
                  </div>
                  {printTimeElements.map((el) => {
                    const prompt = 'prompt' in el.kind ? el.kind.prompt : null;
                    return (
                      <div key={el.id} className="space-y-1">
                        <label className="block text-amber-900 text-[11px] font-medium">
                          {prompt?.promptHint || `${el.name} Value`}:
                        </label>
                        <input
                          type="text"
                          value={printTimeValues[el.id] || ''}
                          onChange={(e) =>
                            setPrintTimeValues({
                              ...printTimeValues,
                              [el.id]: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs text-slate-800"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Hardware Raw Instruction Switch */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRawCode(!showRawCode)}
                  className="text-sky-600 hover:text-sky-700 font-medium text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>{showRawCode ? 'Hide' : 'Inspect'} Hardware Stream (TSPL/ZPL)</span>
                  <span>{showRawCode ? '▴' : '▾'}</span>
                </button>

                {showRawCode && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-[11px]">
                        <button
                          type="button"
                          onClick={() => setRawCodeType('tspl')}
                          className={`px-2 py-0.5 rounded ${
                            rawCodeType === 'tspl' ? 'bg-white shadow-xs font-semibold' : ''
                          }`}
                        >
                          TSPL2
                        </button>
                        <button
                          type="button"
                          onClick={() => setRawCodeType('zpl')}
                          className={`px-2 py-0.5 rounded ${
                            rawCodeType === 'zpl' ? 'bg-white shadow-xs font-semibold' : ''
                          }`}
                        >
                          ZPL II
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="text-xs text-sky-600 hover:underline"
                        >
                          {copied ? 'Copied!' : 'Copy Code'}
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadPrn}
                          className="text-xs text-slate-600 hover:underline"
                        >
                          Download .prn
                        </button>
                      </div>
                    </div>

                    <textarea
                      readOnly
                      rows={6}
                      value={activeRawCode}
                      className="w-full p-2 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded leading-tight select-all outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Primary Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTriggerPrint}
                className="flex-1 py-2.5 bg-[#0084ff] hover:bg-[#0073e6] active:bg-[#0062c4] text-white font-semibold rounded-lg shadow-sm text-sm transition-colors cursor-pointer text-center"
              >
                🖨 Print / PDF
              </button>
              <button
                type="button"
                onClick={handleDownloadPrn}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                title="Send raw bytes to network thermal printer"
              >
                Save PRN
              </button>
            </div>
          </div>

          {/* Right: Live Page-by-Page Preview */}
          <div className="bg-[#eef1f6] rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-between">
            {/* Pager Bar */}
            <div className="w-full flex items-center justify-between pb-2 border-b border-slate-200/70 text-xs">
              <span className="font-medium text-slate-700">Live Batch Preview</span>
              <div className="flex items-center gap-1.5 font-mono">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded disabled:opacity-30 cursor-pointer"
                >
                  ◀
                </button>
                <span>
                  Label {currentPage + 1} of {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(quantity - 1, currentPage + 1))}
                  disabled={currentPage >= quantity - 1}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded disabled:opacity-30 cursor-pointer"
                >
                  ▶
                </button>
              </div>
            </div>

            {/* Scaled Preview Paper */}
            <div className="my-auto py-4 flex items-center justify-center">
              {(() => {
                const maxW = 340;
                const maxH = 260;
                const aspect = paper.widthMm / Math.max(1, paper.heightMm);
                let w = maxW;
                let h = maxW / aspect;
                if (h > maxH) {
                  h = maxH;
                  w = maxH * aspect;
                }
                const scale = w / (paper.widthMm * 4.0);

                return (
                  <div
                    className={`bg-white shadow-lg border border-slate-300 relative overflow-hidden transition-all duration-150 ${
                      paper.shape === 'sharp'
                        ? 'rounded-none'
                        : paper.shape === 'ellipse'
                        ? 'rounded-full'
                        : 'rounded-xl'
                    }`}
                    style={{
                      width: `${w}px`,
                      height: `${h}px`,
                      backgroundColor: paper.backgroundHex || '#ffffff',
                    }}
                  >
                    {project.elements.map((el) => {
                      const pxPerMm = (w / paper.widthMm);
                      const left = el.xMm * pxPerMm;
                      const top = el.yMm * pxPerMm;
                      const width = el.widthMm * pxPerMm;
                      const height = el.heightMm * pxPerMm;

                      return (
                        <div
                          key={el.id}
                          className="absolute pointer-events-none select-none flex items-center overflow-hidden"
                          style={{ left, top, width, height }}
                        >
                          {renderStaticPreview(el, currentEvalCtx, pxPerMm)}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="w-full text-center text-[11px] text-slate-500">
              Serial numbers and dynamic dates advance automatically on each label
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function renderStaticPreview(el: any, ctx: EvalContext, pxPerMm: number) {
  switch (el.kind.type) {
    case 'text': {
      const text = evaluateSegments(el.kind.segments, ctx);
      const font = el.kind.font;
      const fontPx = Math.max(7, ((font.sizePt * 25.4) / 72) * pxPerMm);
      return (
        <div
          className={`w-full h-full flex items-center leading-tight ${
            font.reverseVideo ? 'bg-black text-white px-1' : 'text-black'
          }`}
          style={{
            fontFamily: font.family,
            fontSize: `${fontPx}px`,
            fontWeight: font.bold ? 700 : 400,
            fontStyle: font.italic ? 'italic' : 'normal',
            justifyContent:
              font.align === 'center'
                ? 'center'
                : font.align === 'right'
                ? 'flex-end'
                : font.align === 'distribute'
                ? 'space-between'
                : 'flex-start',
          }}
        >
          <span className="truncate">{text}</span>
        </div>
      );
    }
    case 'barcode': {
      const code = evaluateSegments(el.kind.segments, ctx);
      return (
        <BarcodeRenderer
          value={code}
          format={el.kind.symbology.toUpperCase()}
          showText={el.kind.showHumanReadable}
          width={el.widthMm * pxPerMm}
          height={el.heightMm * pxPerMm}
        />
      );
    }
    case 'qrcode': {
      const content = evaluateSegments(el.kind.segments, ctx);
      return (
        <div className="w-full h-full">
          <QrCodeRenderer value={content} errorCorrection={el.kind.errorCorrection} />
        </div>
      );
    }
    case 'graph': {
      const strokeW = Math.max(1, el.kind.lineThicknessMm * pxPerMm);
      if (el.kind.shape === 'line') {
        return (
          <div
            className="w-full"
            style={{
              height: `${strokeW}px`,
              backgroundColor: el.kind.strokeColor || '#000000',
            }}
          />
        );
      }
      return (
        <div
          className="w-full h-full"
          style={{
            border: `${strokeW}px solid ${el.kind.strokeColor || '#000000'}`,
            borderRadius: el.kind.shape === 'circle' ? '9999px' : '0px',
          }}
        />
      );
    }
    case 'reverse': {
      return <div className="w-full h-full bg-black text-white text-[9px] flex items-center justify-center font-mono">REVERSE</div>;
    }
    default:
      return null;
  }
}
