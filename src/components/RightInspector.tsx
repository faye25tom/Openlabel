import React, { useState, useEffect } from 'react';
import {
  BarcodeSymbology,
  DataSegment,
  DEFAULT_FONT,
  DEFAULT_PROMPT,
  FontStyle,
  LabelElement,
  LabelProject,
  LineStyle,
  PaperSetup,
  PaperShape,
  PromptConfig,
  ShapeKind,
  TextAlign,
  TextDirection,
  TwoDCodeType,
} from '../types/model';
import { EvalContext, evaluateSingleSegment, evaluateSegments } from '../engine/evaluator';

interface RightInspectorProps {
  project: LabelProject;
  selectedElementId: string | null;
  onUpdatePaper: (paper: PaperSetup) => void;
  onOpenPaperModal: () => void;
  onUpdateElementKind: (elementId: string, kind: LabelElement['kind']) => void;
  onUpdateElementBounds: (elementId: string, xMm: number, yMm: number, widthMm: number, heightMm: number) => void;
  onOpenBarcodePicker?: () => void;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  project,
  selectedElementId,
  onUpdatePaper,
  onOpenPaperModal,
  onUpdateElementKind,
  onUpdateElementBounds,
  onOpenBarcodePicker,
}) => {
  const [graphCategoryFilter, setGraphCategoryFilter] = useState<'all' | 'basic' | 'lines' | 'safety' | 'polygons'>('all');
  const [showBatchPaste, setShowBatchPaste] = useState(false);
  const [pasteRawText, setPasteRawText] = useState('');
  const [isAspectLocked, setIsAspectLocked] = useState(true);

  const selectedElement = project.elements.find((e) => e.id === selectedElementId);
  const paper = project.paper;

  const qrKind = selectedElement?.kind.type === 'qrcode' ? selectedElement.kind : null;
  const tableKind = selectedElement?.kind.type === 'table' ? selectedElement.kind : null;
  const graphKind = selectedElement?.kind.type === 'graph' ? selectedElement.kind : null;

  if (!selectedElement) {
    // When no element is selected, display Label Size panel (matching Reference 4 right column)
    return (
      <aside className="w-80 h-full bg-white border-l border-slate-200 overflow-y-auto p-4 flex flex-col text-slate-800 shrink-0 select-none">
        <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
          <span>Label Size</span>
          <span className="text-xs font-normal text-slate-400">70X50mm</span>
        </h2>

        <div className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1.5">
              Width (?)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                max="300"
                step="1"
                value={paper.widthMm}
                onChange={(e) =>
                  onUpdatePaper({
                    ...paper,
                    widthMm: Math.max(10, Number(e.target.value)),
                  })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
              <span className="text-slate-500 font-mono">mm</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1.5">
              Height (?)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                max="300"
                step="1"
                value={paper.heightMm}
                onChange={(e) =>
                  onUpdatePaper({
                    ...paper,
                    heightMm: Math.max(10, Number(e.target.value)),
                  })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
              <span className="text-slate-500 font-mono">mm</span>
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={onOpenPaperModal}
              className="text-sky-600 hover:text-sky-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>More Settings</span>
              <span>▸</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">
                Paper Shape
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-md">
                {(
                  [
                    { id: 'sharp', label: '▭ Sharp' },
                    { id: 'rounded', label: '▢ Rounded' },
                    { id: 'ellipse', label: '⬭ Ellipse' },
                  ] as { id: PaperShape; label: string }[]
                ).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onUpdatePaper({ ...paper, shape: s.id })}
                    className={`py-1 text-[11px] font-medium rounded transition-colors ${
                      paper.shape === s.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1.5">
                Rotation
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-md">
                {[0, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    onClick={() =>
                      onUpdatePaper({
                        ...paper,
                        rotationDeg: deg as 0 | 90 | 180 | 270,
                      })
                    }
                    className={`py-1 text-[11px] font-medium rounded transition-colors ${
                      paper.rotationDeg === deg
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1.5">
                Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={paper.backgroundHex || '#ffffff'}
                  onChange={(e) =>
                    onUpdatePaper({ ...paper, backgroundHex: e.target.value })
                  }
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <span className="font-mono text-xs text-slate-600 uppercase">
                  {paper.backgroundHex || '#ffffff'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // When element is selected: render Content, Font Style, and Prompt sections
  return (
    <aside className="w-80 h-full bg-white border-l border-slate-200 overflow-y-auto flex flex-col text-slate-800 shrink-0 select-none text-xs">
      {/* Selected Element Header */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="font-semibold text-slate-900 flex items-center gap-2">
          <span>{selectedElement.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {selectedElement.widthMm}×{selectedElement.heightMm}mm
          </span>
        </div>
        <button
          onClick={() => {
            onUpdateElementBounds(
              selectedElement.id,
              selectedElement.xMm,
              selectedElement.yMm,
              selectedElement.widthMm,
              selectedElement.heightMm
            );
          }}
          className="text-slate-400 hover:text-slate-600"
          title="Element ID"
        >
          #{selectedElement.id.slice(0, 4)}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* ELEMENT POSITION & SIZE (位置与尺寸) */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <span>📐</span>
              <span>Position & Size (位置与尺寸)</span>
            </span>
            <button
              type="button"
              onClick={() => {
                const nextLock = !isAspectLocked;
                setIsAspectLocked(nextLock);
                if (selectedElement.kind.type === 'qrcode') {
                  onUpdateElementKind(selectedElement.id, {
                    ...selectedElement.kind,
                    lockAspectRatio: nextLock,
                  });
                }
              }}
              title={isAspectLocked ? '1:1 等比例已锁定' : '自由比例'}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 transition-colors cursor-pointer ${
                isAspectLocked
                  ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{isAspectLocked ? '🔗 1:1 锁定' : '🔓 自由比例'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 font-medium mb-0.5">X (水平位置, 可为负数)</label>
              <div className="flex items-center gap-1">
                <SignedCoordinateInput
                  value={selectedElement.xMm}
                  onChange={(nx) => {
                    onUpdateElementBounds(selectedElement.id, nx, selectedElement.yMm, selectedElement.widthMm, selectedElement.heightMm);
                  }}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 outline-none focus:border-sky-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 font-mono">mm</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Y (垂直位置, 可为负数)</label>
              <div className="flex items-center gap-1">
                <SignedCoordinateInput
                  value={selectedElement.yMm}
                  onChange={(ny) => {
                    onUpdateElementBounds(selectedElement.id, selectedElement.xMm, ny, selectedElement.widthMm, selectedElement.heightMm);
                  }}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 outline-none focus:border-sky-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 font-mono">mm</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 font-medium mb-0.5">宽度 (Width)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  min="2"
                  value={selectedElement.widthMm}
                  onChange={(e) => {
                    const nw = Math.max(2, Number(e.target.value));
                    const nh = isAspectLocked || selectedElement.kind.type === 'qrcode' ? nw : selectedElement.heightMm;
                    onUpdateElementBounds(selectedElement.id, selectedElement.xMm, selectedElement.yMm, nw, nh);
                  }}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-400 font-mono">mm</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-medium mb-0.5">高度 (Height)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  min="2"
                  value={selectedElement.heightMm}
                  onChange={(e) => {
                    const nh = Math.max(2, Number(e.target.value));
                    const nw = isAspectLocked || selectedElement.kind.type === 'qrcode' ? nh : selectedElement.widthMm;
                    onUpdateElementBounds(selectedElement.id, selectedElement.xMm, selectedElement.yMm, nw, nh);
                  }}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-400 font-mono">mm</span>
              </div>
            </div>
          </div>

          {/* Quick presets & Paper Alignment */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <span className="text-[10px] text-slate-400">快速尺寸:</span>
            <div className="flex items-center gap-1">
              {[10, 15, 20, 25, 30].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    onUpdateElementBounds(
                      selectedElement.id,
                      selectedElement.xMm,
                      selectedElement.yMm,
                      sz,
                      isAspectLocked || selectedElement.kind.type === 'qrcode' ? sz : selectedElement.heightMm
                    );
                  }}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                    selectedElement.widthMm === sz && selectedElement.heightMm === sz
                      ? 'bg-sky-600 text-white border-sky-600 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sz}mm
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                const cx = Number(((paper.widthMm - selectedElement.widthMm) / 2).toFixed(1));
                onUpdateElementBounds(selectedElement.id, cx, selectedElement.yMm, selectedElement.widthMm, selectedElement.heightMm);
              }}
              className="flex-1 py-1 text-[10px] bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
            >
              ⬌ 水平居中
            </button>
            <button
              type="button"
              onClick={() => {
                const cy = Number(((paper.heightMm - selectedElement.heightMm) / 2).toFixed(1));
                onUpdateElementBounds(selectedElement.id, selectedElement.xMm, cy, selectedElement.widthMm, selectedElement.heightMm);
              }}
              className="flex-1 py-1 text-[10px] bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
            >
              ⬍ 垂直居中
            </button>
          </div>
        </div>

        {/* BARCODE SPECIFIC SYMBOLOGY SELECTOR (Screenshot 1) */}
        {selectedElement.kind.type === 'barcode' && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">Barcode Symbology</span>
              {onOpenBarcodePicker && (
                <button
                  type="button"
                  onClick={onOpenBarcodePicker}
                  className="px-2 py-0.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>All Barcode</span>
                  <span className="text-[10px]">🔍</span>
                </button>
              )}
            </div>

            {/* Direct select dropdown for Barcode Symbology */}
            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">
                Select 1D Symbology
              </label>
              <select
                value={selectedElement.kind.symbology}
                onChange={(e) => {
                  if (selectedElement.kind.type === 'barcode') {
                    onUpdateElementKind(selectedElement.id, {
                      ...selectedElement.kind,
                      symbology: e.target.value as BarcodeSymbology,
                    });
                  }
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-semibold text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer"
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

            <label className="flex items-center gap-2 pt-0.5 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedElement.kind.showHumanReadable}
                onChange={(e) => {
                  if (selectedElement.kind.type === 'barcode') {
                    onUpdateElementKind(selectedElement.id, {
                      ...selectedElement.kind,
                      showHumanReadable: e.target.checked,
                    });
                  }
                }}
                className="rounded text-sky-600"
              />
              <span className="text-xs">Show Human Readable Text</span>
            </label>
          </div>
        )}

        {/* 2D CODE SPECIFIC FORMAT SELECTOR (Screenshot 2) */}
        {selectedElement.kind.type === 'qrcode' && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">2D Code Type</span>
              <span className="text-[10px] text-slate-500 font-mono font-semibold">
                {selectedElement.kind.codeType}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { type: 'QR_Code', label: 'QR Code' },
                  { type: 'DATA_MATRIX', label: 'DataMatrix' },
                  { type: 'PDF_417', label: 'PDF-417' },
                  { type: 'HANXIN', label: 'Han Xin' },
                  { type: 'AZTEC', label: 'Aztec' },
                  { type: 'MAXICODE', label: 'MaxiCode' },
                ] as { type: TwoDCodeType; label: string }[]
              ).map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    if (selectedElement.kind.type === 'qrcode') {
                      onUpdateElementKind(selectedElement.id, {
                        ...selectedElement.kind,
                        codeType: item.type,
                      });
                    }
                  }}
                  className={`py-1.5 px-1 text-[11px] font-medium rounded border transition-colors cursor-pointer text-center ${
                    qrKind?.codeType === item.type
                      ? 'bg-sky-600 border-sky-600 text-white font-semibold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {(qrKind?.codeType === 'QR_Code' || qrKind?.codeType === 'HANXIN') && (
              <div>
                <label className="block text-slate-600 font-medium text-[11px] mb-1">
                  Error Correction Level
                </label>
                <div className="grid grid-cols-4 gap-1 p-0.5 bg-white border border-slate-200 rounded">
                  {(['L', 'M', 'Q', 'H'] as ('L' | 'M' | 'Q' | 'H')[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        if (selectedElement.kind.type === 'qrcode') {
                          onUpdateElementKind(selectedElement.id, {
                            ...selectedElement.kind,
                            errorCorrection: lvl,
                          });
                        }
                      }}
                      className={`py-0.5 text-xs font-mono rounded ${
                        qrKind?.errorCorrection === lvl
                          ? 'bg-sky-600 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QR Scale & Quiet Zone Margin */}
            <div className="pt-2 border-t border-slate-200/70 space-y-3">
              {/* 1. Module Scale / 小比例 (TSPL Cell Width Dots) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold text-[11px] flex items-center gap-1">
                    <span>码点小比例 (Module Scale)</span>
                    <span className="text-[10px] text-sky-600 font-normal">
                      {qrKind?.cellWidthDots ? `${qrKind.cellWidthDots}点 (${(qrKind.cellWidthDots * 0.125).toFixed(3)}mm)` : '自适应外框'}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const dots = qrKind?.cellWidthDots || 3;
                      const margin = qrKind?.marginModules ?? 1;
                      const approxModules = 29 + margin * 2;
                      const fitMm = Math.max(6, Math.round(approxModules * dots * 0.125));
                      onUpdateElementBounds(selectedElement.id, selectedElement.xMm, selectedElement.yMm, fitMm, fitMm);
                    }}
                    title="根据码点小比例自动调整外框大小"
                    className="text-[10px] text-sky-600 hover:text-sky-700 font-medium underline cursor-pointer"
                  >
                    按小比例适配外框
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1 p-0.5 bg-white border border-slate-200 rounded">
                  {[
                    { dots: 0, label: '自适应', scale: 100 },
                    { dots: 1, label: '1点 (极小)', scale: 40 },
                    { dots: 2, label: '2点 (紧凑)', scale: 60 },
                    { dots: 3, label: '3点 (标准)', scale: 80 },
                    { dots: 4, label: '4点 (中等)', scale: 100 },
                    { dots: 5, label: '5点 (大码)', scale: 120 },
                    { dots: 6, label: '6点 (超大)', scale: 135 },
                    { dots: 8, label: '8点 (远距)', scale: 150 },
                  ].map((item) => (
                    <button
                      key={item.dots}
                      type="button"
                      onClick={() => {
                        if (selectedElement.kind.type === 'qrcode') {
                          onUpdateElementKind(selectedElement.id, {
                            ...selectedElement.kind,
                            cellWidthDots: item.dots || undefined,
                            scalePercent: item.scale,
                          });
                        }
                      }}
                      className={`py-1 text-[10px] rounded transition-colors cursor-pointer ${
                        (qrKind?.cellWidthDots ?? 0) === item.dots
                          ? 'bg-sky-600 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Internal Scale Ratio (缩放比例) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-medium text-[11px]">
                    内部缩放微调 (Scale Ratio)
                  </label>
                  <span className="font-mono text-xs font-bold text-sky-700">
                    {qrKind?.scalePercent ?? 100}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="25"
                    max="150"
                    step="5"
                    value={qrKind?.scalePercent ?? 100}
                    onChange={(e) => {
                      if (selectedElement.kind.type === 'qrcode') {
                        onUpdateElementKind(selectedElement.id, {
                          ...selectedElement.kind,
                          scalePercent: Number(e.target.value),
                        });
                      }
                    }}
                    className="flex-1 accent-sky-600 h-1.5 bg-slate-200 rounded cursor-pointer"
                  />
                  <div className="flex items-center gap-1">
                    {[30, 50, 75, 100, 125].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          if (selectedElement.kind.type === 'qrcode') {
                            onUpdateElementKind(selectedElement.id, {
                              ...selectedElement.kind,
                              scalePercent: pct,
                            });
                          }
                        }}
                        className={`px-1.5 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                          (qrKind?.scalePercent ?? 100) === pct
                            ? 'bg-sky-600 text-white font-bold'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Quiet Zone Margin */}
              <div>
                <label className="block text-slate-600 font-medium text-[11px] mb-1">
                  空白区边距 (Quiet Zone Margin)
                </label>
                <div className="grid grid-cols-4 gap-1 p-0.5 bg-white border border-slate-200 rounded">
                  {[
                    { m: 0, label: '0 无边距' },
                    { m: 1, label: '1 紧凑' },
                    { m: 2, label: '2 标准' },
                    { m: 4, label: '4 GS1规范' },
                  ].map((item) => (
                    <button
                      key={item.m}
                      type="button"
                      onClick={() => {
                        if (selectedElement.kind.type === 'qrcode') {
                          onUpdateElementKind(selectedElement.id, {
                            ...selectedElement.kind,
                            marginModules: item.m,
                          });
                        }
                      }}
                      className={`py-1 text-[10px] rounded transition-colors cursor-pointer ${
                        (qrKind?.marginModules ?? 1) === item.m
                          ? 'bg-sky-600 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Aspect Ratio & Box Fit */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qrKind?.lockAspectRatio !== false}
                    onChange={(e) => {
                      if (selectedElement.kind.type === 'qrcode') {
                        onUpdateElementKind(selectedElement.id, {
                          ...selectedElement.kind,
                          lockAspectRatio: e.target.checked,
                        });
                        setIsAspectLocked(e.target.checked);
                      }
                    }}
                    className="rounded text-sky-600"
                  />
                  <span className="text-[11px]">保持 1:1 正方形等比</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedElement.widthMm} × {selectedElement.heightMm} mm
                </span>
              </div>

              <div className="text-[10px] text-slate-500 bg-sky-50/70 p-2 rounded border border-sky-100 flex items-start gap-1.5 leading-relaxed">
                <span>💡</span>
                <span>画布手柄缩放外框尺寸，此处可随时调节“小比例(1~8点)”与内部缩放比(25%~150%)，任意缩小均完整清晰，无任何裁切。</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1: CONTENT (Matching Ref 1, 2, 3, 6) */}
        {'segments' in selectedElement.kind && (
          <ContentSection
            element={selectedElement}
            project={project}
            onChangeKind={(newKind) => onUpdateElementKind(selectedElement.id, newKind)}
          />
        )}

        {/* SECTION 2: FONT STYLE (Matching Ref 1, 2, 3, 6 bottom) */}
        {'font' in selectedElement.kind && (
          <FontStyleSection
            font={selectedElement.kind.font}
            onChangeFont={(newFont) => {
              if ('font' in selectedElement.kind) {
                onUpdateElementKind(selectedElement.id, {
                  ...selectedElement.kind,
                  font: newFont,
                });
              }
            }}
          />
        )}

        {/* SECTION 3: PROMPT (Matching Ref 1 & 3 bottom) */}
        {'prompt' in selectedElement.kind && (
          <PromptSection
            prompt={selectedElement.kind.prompt}
            onChangePrompt={(newPrompt) => {
              if ('prompt' in selectedElement.kind) {
                onUpdateElementKind(selectedElement.id, {
                  ...selectedElement.kind,
                  prompt: newPrompt,
                });
              }
            }}
          />
        )}

        {/* TABLE EDITOR SECTION - FULLY EDITABLE WITH SPREADSHEET MATRIX & BATCH IMPORT */}
        {selectedElement.kind.type === 'table' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Table Configuration & Data
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {selectedElement.kind.rows}×{selectedElement.kind.cols} Grid
              </span>
            </div>

            {/* Quick Structure Buttons */}
            <div className="space-y-1.5">
              <label className="block text-slate-600 font-medium text-[11px]">
                Dimensions & Grid Actions
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border border-slate-200">
                  <span className="text-[11px] font-medium text-slate-500 w-10">Rows:</span>
                  <button
                    type="button"
                    title="Remove last row"
                    onClick={() => {
                      if (selectedElement.kind.type === 'table') {
                        const newRows = Math.max(1, selectedElement.kind.rows - 1);
                        const newCells = selectedElement.kind.cells.slice(0, newRows);
                        onUpdateElementKind(selectedElement.id, {
                          ...selectedElement.kind,
                          rows: newRows,
                          cells: newCells,
                        });
                      }
                    }}
                    className="w-6 h-6 bg-white hover:bg-slate-200 rounded border border-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer text-xs"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono font-bold text-xs text-slate-800">
                    {selectedElement.kind.rows}
                  </span>
                  <button
                    type="button"
                    title="Add row at end"
                    onClick={() => {
                      if (selectedElement.kind.type === 'table') {
                        const newRows = selectedElement.kind.rows + 1;
                        const newCells = [...selectedElement.kind.cells];
                        const cols = selectedElement.kind.cols;
                        newCells.push(Array(cols).fill(''));
                        onUpdateElementKind(selectedElement.id, {
                          ...selectedElement.kind,
                          rows: newRows,
                          cells: newCells,
                        });
                      }
                    }}
                    className="w-6 h-6 bg-white hover:bg-slate-200 rounded border border-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer text-xs"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border border-slate-200">
                  <span className="text-[11px] font-medium text-slate-500 w-10">Cols:</span>
                  <button
                    type="button"
                    title="Remove last column"
                    onClick={() => {
                      if (selectedElement.kind.type === 'table') {
                        const newCols = Math.max(1, selectedElement.kind.cols - 1);
                        const newCells = selectedElement.kind.cells.map((row) =>
                          row.slice(0, newCols)
                        );
                        onUpdateElementKind(selectedElement.id, {
                          ...selectedElement.kind,
                          cols: newCols,
                          cells: newCells,
                        });
                      }
                    }}
                    className="w-6 h-6 bg-white hover:bg-slate-200 rounded border border-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer text-xs"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono font-bold text-xs text-slate-800">
                    {selectedElement.kind.cols}
                  </span>
                  <button
                    type="button"
                    title="Add column at right"
                    onClick={() => {
                      if (selectedElement.kind.type === 'table') {
                        const newCols = selectedElement.kind.cols + 1;
                        const newCells = selectedElement.kind.cells.map((row) => [
                          ...row,
                          '',
                        ]);
                        onUpdateElementKind(selectedElement.id, {
                          ...selectedElement.kind,
                          cols: newCols,
                          cells: newCells,
                        });
                      }
                    }}
                    className="w-6 h-6 bg-white hover:bg-slate-200 rounded border border-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Fast presets & data tools */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBatchPaste(!showBatchPaste)}
                  className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>📋</span>
                  <span>Paste CSV / Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedElement.kind.type === 'table') {
                      onUpdateElementKind(selectedElement.id, {
                        ...selectedElement.kind,
                        rows: 3,
                        cols: 3,
                        headerRow: true,
                        cells: [
                          ['Item', 'Qty', 'Status'],
                          ['Part A-102', '50', 'PASS'],
                          ['Sensor Mod', '12', 'OK'],
                        ],
                      });
                    }
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium cursor-pointer transition-colors"
                >
                  Fill Sample
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (tableKind) {
                      const cleared = Array.from({ length: tableKind.rows }).map(() =>
                        Array(tableKind.cols).fill('')
                      );
                      onUpdateElementKind(selectedElement.id, {
                        ...tableKind,
                        cells: cleared,
                      });
                    }
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded text-[11px] font-medium cursor-pointer transition-colors ml-auto"
                >
                  Clear
                </button>
              </div>

              {/* Batch Paste Drawer */}
              {showBatchPaste && (
                <div className="p-2.5 bg-sky-50/60 border border-sky-200 rounded-lg space-y-2 mt-2">
                  <div className="text-[11px] text-sky-900 font-semibold flex items-center justify-between">
                    <span>Paste Tabular Data (TSV / CSV)</span>
                    <button
                      onClick={() => setShowBatchPaste(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={pasteRawText}
                    onChange={(e) => setPasteRawText(e.target.value)}
                    placeholder={`Header1\tHeader2\tHeader3\nValue1\tValue2\tValue3`}
                    className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-mono outline-none focus:border-sky-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!pasteRawText.trim()) return;
                        const rawLines = pasteRawText.trim().split('\n');
                        const parsedGrid = rawLines.map((line) => {
                          if (line.includes('\t')) return line.split('\t');
                          return line.split(',');
                        });
                        const newR = parsedGrid.length;
                        const newC = Math.max(...parsedGrid.map((row) => row.length));
                        const normalizedGrid = parsedGrid.map((row) => {
                          const r = [...row];
                          while (r.length < newC) r.push('');
                          return r;
                        });
                        if (selectedElement.kind.type === 'table') {
                          onUpdateElementKind(selectedElement.id, {
                            ...selectedElement.kind,
                            rows: newR,
                            cols: newC,
                            cells: normalizedGrid,
                          });
                        }
                        setShowBatchPaste(false);
                        setPasteRawText('');
                      }}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-semibold cursor-pointer"
                    >
                      Apply to Table
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Line thickness, colors, and header style */}
            <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-slate-100">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Line Thickness (mm)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={selectedElement.kind.lineThicknessMm}
                  onChange={(e) => {
                    if (selectedElement.kind.type === 'table') {
                      onUpdateElementKind(selectedElement.id, {
                        ...selectedElement.kind,
                        lineThicknessMm: Math.max(0.1, Number(e.target.value)),
                      });
                    }
                  }}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Font Size (pt)
                </label>
                <input
                  type="number"
                  min="5"
                  max="36"
                  step="0.5"
                  value={selectedElement.kind.fontSizePt ?? 8}
                  onChange={(e) => {
                    if (selectedElement.kind.type === 'table') {
                      onUpdateElementKind(selectedElement.id, {
                        ...selectedElement.kind,
                        fontSizePt: Number(e.target.value),
                      });
                    }
                  }}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
            </div>

            {/* Colors & Header Row */}
            <div className="grid grid-cols-2 gap-2.5 items-center">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Border Color
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={selectedElement.kind.borderColor || '#000000'}
                    onChange={(e) => {
                      if (selectedElement.kind.type === 'table') {
                        onUpdateElementKind(selectedElement.id, {
                          ...selectedElement.kind,
                          borderColor: e.target.value,
                        });
                      }
                    }}
                    className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0.5"
                  />
                  <span className="font-mono text-xs uppercase text-slate-600">
                    {selectedElement.kind.borderColor || '#000000'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={selectedElement.kind.headerRow ?? true}
                    onChange={(e) => {
                      if (selectedElement.kind.type === 'table') {
                        onUpdateElementKind(selectedElement.id, {
                          ...selectedElement.kind,
                          headerRow: e.target.checked,
                        });
                      }
                    }}
                    className="rounded text-sky-600"
                  />
                  <span>Header Row Style</span>
                </label>
              </div>
            </div>

            {/* Cell Alignment */}
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Cell Text Alignment
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded">
                {(['left', 'center', 'right'] as ('left' | 'center' | 'right')[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      if (selectedElement.kind.type === 'table') {
                        onUpdateElementKind(selectedElement.id, {
                          ...selectedElement.kind,
                          align: a,
                        });
                      }
                    }}
                    className={`py-1 text-xs rounded transition-colors ${
                      (selectedElement.kind.type === 'table' &&
                        selectedElement.kind.align === a) ||
                      (!('align' in selectedElement.kind) && a === 'center')
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {a === 'left' ? '⬅ Left' : a === 'center' ? '☰ Center' : '➡ Right'}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Cell Content Spreadsheet Grid */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-slate-800 font-bold text-xs">
                  Cell Content Matrix ({tableKind?.rows || 0} rows × {tableKind?.cols || 0} cols):
                </label>
                <span className="text-[10px] text-slate-400">Click cell to edit</span>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-60 overflow-y-auto space-y-2">
                {Array.from({ length: tableKind?.rows || 0 }).map((_, r) => {
                  const isH = r === 0 && tableKind?.headerRow;
                  return (
                    <div key={r} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] font-mono px-0.5 text-slate-400">
                        <span className={isH ? 'font-bold text-sky-700' : ''}>
                          {isH ? 'Row 1 (Header)' : `Row ${r + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: tableKind?.cols || 0 }).map((_, c) => {
                          const val = tableKind?.cells?.[r]?.[c] || '';
                          return (
                            <input
                              key={c}
                              type="text"
                              value={val}
                              placeholder={`Col ${c + 1}`}
                              onChange={(e) => {
                                if (selectedElement.kind.type === 'table') {
                                  const newCells = selectedElement.kind.cells.map((row) => [
                                    ...row,
                                  ]);
                                  while (newCells.length <= r) {
                                    newCells.push(Array(selectedElement.kind.cols).fill(''));
                                  }
                                  while (newCells[r].length <= c) {
                                    newCells[r].push('');
                                  }
                                  newCells[r][c] = e.target.value;
                                  onUpdateElementKind(selectedElement.id, {
                                    ...selectedElement.kind,
                                    cells: newCells,
                                  });
                                }
                              }}
                              className={`flex-1 min-w-0 px-2 py-1 text-xs border rounded outline-none focus:border-sky-500 bg-white transition-colors ${
                                isH
                                  ? 'font-bold border-sky-300 bg-sky-50/40 text-slate-900'
                                  : 'border-slate-200 text-slate-700'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* EXPANDED GRAPH SHAPES SECTION WITH 40+ INDUSTRIAL SHAPES */}
        {selectedElement.kind.type === 'graph' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Graph Shape & Appearance
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedElement.kind.shape}
              </span>
            </div>

            {/* Category Filter Tabs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-slate-600 font-medium text-[11px]">
                  Shape Palette (40+ Shapes)
                </label>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'basic', label: 'Basic' },
                  { id: 'lines', label: 'Lines' },
                  { id: 'safety', label: 'Safety' },
                  { id: 'polygons', label: 'Polygons' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setGraphCategoryFilter(cat.id as any)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      graphCategoryFilter === cat.id
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Categorized Shapes Grid */}
              <div className="max-h-56 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="grid grid-cols-4 gap-1">
                  {[
                    // Basic
                    { shape: 'rectangle' as ShapeKind, icon: '▭', label: 'Rect', cat: 'basic' },
                    { shape: 'rounded_rect' as ShapeKind, icon: '▢', label: 'Rounded', cat: 'basic' },
                    { shape: 'circle' as ShapeKind, icon: '◯', label: 'Circle', cat: 'basic' },
                    { shape: 'ellipse' as ShapeKind, icon: '⬭', label: 'Ellipse', cat: 'basic' },
                    { shape: 'capsule' as ShapeKind, icon: '💊', label: 'Capsule', cat: 'basic' },
                    { shape: 'snip_corner_rect' as ShapeKind, icon: '⎔', label: 'Snip Rect', cat: 'basic' },
                    // Lines & Arrows
                    { shape: 'line' as ShapeKind, icon: '―', label: 'H-Line', cat: 'lines' },
                    { shape: 'vertical_line' as ShapeKind, icon: '|', label: 'V-Line', cat: 'lines' },
                    { shape: 'diagonal_line_up' as ShapeKind, icon: '↗', label: 'Diag Up', cat: 'lines' },
                    { shape: 'diagonal_line_down' as ShapeKind, icon: '↘', label: 'Diag Down', cat: 'lines' },
                    { shape: 'arrow' as ShapeKind, icon: '➔', label: 'Arrow R', cat: 'lines' },
                    { shape: 'arrow_left' as ShapeKind, icon: '⬅', label: 'Arrow L', cat: 'lines' },
                    { shape: 'arrow_up' as ShapeKind, icon: '⬆', label: 'Arrow U', cat: 'lines' },
                    { shape: 'arrow_down' as ShapeKind, icon: '⬇', label: 'Arrow D', cat: 'lines' },
                    { shape: 'double_arrow' as ShapeKind, icon: '⬌', label: 'D-Arrow H', cat: 'lines' },
                    { shape: 'double_arrow_v' as ShapeKind, icon: '⬍', label: 'D-Arrow V', cat: 'lines' },
                    { shape: 'bracket_left' as ShapeKind, icon: '[', label: 'Bracket L', cat: 'lines' },
                    { shape: 'bracket_right' as ShapeKind, icon: ']', label: 'Bracket R', cat: 'lines' },
                    { shape: 'brace_left' as ShapeKind, icon: '{', label: 'Brace L', cat: 'lines' },
                    { shape: 'brace_right' as ShapeKind, icon: '}', label: 'Brace R', cat: 'lines' },
                    { shape: 'corner_bracket' as ShapeKind, icon: '⌐', label: 'Corner', cat: 'lines' },
                    { shape: 'dimension_line' as ShapeKind, icon: '⟷', label: 'Dimension', cat: 'lines' },
                    // Safety & Industry
                    { shape: 'hazard_triangle' as ShapeKind, icon: '⚠️', label: 'Hazard', cat: 'safety' },
                    { shape: 'prohibition' as ShapeKind, icon: '⊘', label: 'Prohibit', cat: 'safety' },
                    { shape: 'cross' as ShapeKind, icon: '✚', label: 'Cross', cat: 'safety' },
                    { shape: 'shield' as ShapeKind, icon: '🛡️', label: 'Shield', cat: 'safety' },
                    { shape: 'tag_shape' as ShapeKind, icon: '🏷️', label: 'Tag', cat: 'safety' },
                    { shape: 'burst_seal' as ShapeKind, icon: '💮', label: 'Seal Badge', cat: 'safety' },
                    { shape: 'speech_bubble' as ShapeKind, icon: '🗨', label: 'Callout', cat: 'safety' },
                    { shape: 'cube' as ShapeKind, icon: '📦', label: 'Carton Box', cat: 'safety' },
                    { shape: 'cylinder' as ShapeKind, icon: '🛢️', label: 'Cylinder', cat: 'safety' },
                    // Polygons & Stars
                    { shape: 'triangle' as ShapeKind, icon: '△', label: 'Triangle', cat: 'polygons' },
                    { shape: 'triangle_down' as ShapeKind, icon: '▽', label: 'Tri Down', cat: 'polygons' },
                    { shape: 'triangle_right' as ShapeKind, icon: '▷', label: 'Tri Right', cat: 'polygons' },
                    { shape: 'diamond' as ShapeKind, icon: '◇', label: 'Diamond', cat: 'polygons' },
                    { shape: 'parallelogram' as ShapeKind, icon: '▱', label: 'Parallelo', cat: 'polygons' },
                    { shape: 'trapezoid' as ShapeKind, icon: '⏢', label: 'Trapezoid', cat: 'polygons' },
                    { shape: 'pentagon' as ShapeKind, icon: '⬠', label: 'Pentagon', cat: 'polygons' },
                    { shape: 'hexagon' as ShapeKind, icon: '⬡', label: 'Hexagon', cat: 'polygons' },
                    { shape: 'octagon' as ShapeKind, icon: '🛑', label: 'Octagon', cat: 'polygons' },
                    { shape: 'star' as ShapeKind, icon: '☆', label: '5-Star', cat: 'polygons' },
                    { shape: 'star_4' as ShapeKind, icon: '✦', label: '4-Star', cat: 'polygons' },
                    { shape: 'star_6' as ShapeKind, icon: '✡', label: '6-Star', cat: 'polygons' },
                    { shape: 'star_8' as ShapeKind, icon: '✷', label: '8-Star', cat: 'polygons' },
                  ]
                    .filter((item) => graphCategoryFilter === 'all' || item.cat === graphCategoryFilter)
                    .map((item) => (
                      <button
                        key={item.shape}
                        type="button"
                        onClick={() => {
                          if (selectedElement.kind.type === 'graph') {
                            onUpdateElementKind(selectedElement.id, {
                              ...selectedElement.kind,
                              shape: item.shape,
                            });
                          }
                        }}
                        className={`py-1.5 px-0.5 flex flex-col items-center justify-center rounded transition-colors cursor-pointer text-center ${
                          graphKind?.shape === item.shape
                            ? 'bg-sky-600 text-white font-bold shadow-xs'
                            : 'text-slate-700 hover:bg-slate-200/70 bg-white border border-slate-100'
                        }`}
                      >
                        <span className="text-sm leading-none">{item.icon}</span>
                        <span className="text-[9px] mt-0.5 tracking-tight truncate w-full">
                          {item.label}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Line Thickness & Line Style */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Thickness (mm)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={selectedElement.kind.lineThicknessMm}
                  onChange={(e) => {
                    if (selectedElement.kind.type === 'graph') {
                      onUpdateElementKind(selectedElement.id, {
                        ...selectedElement.kind,
                        lineThicknessMm: Math.max(0.1, Number(e.target.value)),
                      });
                    }
                  }}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Line Style
                </label>
                <select
                  value={selectedElement.kind.lineStyle || 'solid'}
                  onChange={(e) => {
                    if (selectedElement.kind.type === 'graph') {
                      onUpdateElementKind(selectedElement.id, {
                        ...selectedElement.kind,
                        lineStyle: e.target.value as LineStyle,
                      });
                    }
                  }}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value="solid">Solid (实线)</option>
                  <option value="dashed">Dashed (虚线)</option>
                  <option value="dotted">Dotted (点线)</option>
                </select>
              </div>
            </div>

            {/* Corner Radius if rounded_rect or snip_corner_rect */}
            {(selectedElement.kind.shape === 'rounded_rect' ||
              selectedElement.kind.shape === 'snip_corner_rect') && (
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Corner Radius / Chamfer (mm)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="30"
                  step="0.5"
                  value={selectedElement.kind.cornerRadiusMm ?? 3}
                  onChange={(e) => {
                    if (selectedElement.kind.type === 'graph') {
                      onUpdateElementKind(selectedElement.id, {
                        ...selectedElement.kind,
                        cornerRadiusMm: Math.max(0.5, Number(e.target.value)),
                      });
                    }
                  }}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
            )}

            {/* Stroke Color */}
            <div className="flex items-center justify-between">
              <label className="text-slate-600 font-medium">Stroke Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedElement.kind.strokeColor || '#000000'}
                  onChange={(e) => {
                    if (selectedElement.kind.type === 'graph') {
                      onUpdateElementKind(selectedElement.id, {
                        ...selectedElement.kind,
                        strokeColor: e.target.value,
                      });
                    }
                  }}
                  className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <span className="font-mono text-xs text-slate-600 uppercase">
                  {selectedElement.kind.strokeColor || '#000000'}
                </span>
              </div>
            </div>

            {/* Filled Shape Toggle & Fill Color */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={selectedElement.kind.filled}
                    onChange={(e) => {
                      if (selectedElement.kind.type === 'graph') {
                        onUpdateElementKind(selectedElement.id, {
                          ...selectedElement.kind,
                          filled: e.target.checked,
                        });
                      }
                    }}
                    className="rounded text-sky-600"
                  />
                  <span>Filled Shape</span>
                </label>

                {selectedElement.kind.filled && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={selectedElement.kind.fillColor || '#ffffff'}
                      onChange={(e) => {
                        if (selectedElement.kind.type === 'graph') {
                          onUpdateElementKind(selectedElement.id, {
                            ...selectedElement.kind,
                            fillColor: e.target.value,
                          });
                        }
                      }}
                      className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0.5"
                    />
                    <span className="font-mono text-xs text-slate-600 uppercase">
                      {selectedElement.kind.fillColor || '#ffffff'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

/* =========================================================================
   SUB-COMPONENT: Content Section (5 tabs + Add Field + Dynamic Form)
========================================================================= */

function ContentSection({
  element,
  project,
  onChangeKind,
}: {
  element: LabelElement;
  project: LabelProject;
  onChangeKind: (kind: LabelElement['kind']) => void;
}) {
  if (!('segments' in element.kind)) return null;

  const kind = element.kind;
  const segments = kind.segments;
  const activeIdx = Math.min(kind.activeSegmentIdx ?? 0, Math.max(0, segments.length - 1));
  const activeSegment = segments[activeIdx] || { type: 'constant', text: '' };

  const activeTab = activeSegment.type;

  const updateActiveSegment = (newSeg: DataSegment) => {
    const newSegments = [...segments];
    newSegments[activeIdx] = newSeg;
    onChangeKind({
      ...kind,
      segments: newSegments,
      activeSegmentIdx: activeIdx,
    });
  };

  const addField = () => {
    const newSeg: DataSegment = { type: 'constant', text: '-01' };
    onChangeKind({
      ...kind,
      segments: [...segments, newSeg],
      activeSegmentIdx: segments.length,
    });
  };

  const removeField = (idx: number) => {
    if (segments.length <= 1) return;
    const newSegments = segments.filter((_, i) => i !== idx);
    onChangeKind({
      ...kind,
      segments: newSegments,
      activeSegmentIdx: Math.max(0, idx - 1),
    });
  };

  // Evaluation context for real-time preview in inspector
  const evalCtx: EvalContext = {
    labelSequenceIndex: 0,
    dbRowIndex: project.currentRecordIndex,
    table: project.database,
    fixedNow: new Date(),
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm">Content</h3>
        {segments.length > 1 && (
          <span className="text-[11px] text-slate-400 font-mono">
            {segments.length} Fields
          </span>
        )}
      </div>

      {/* Top 5 Segment Type Selectors (Matching Reference 1, 2, 3, 6 icons) */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-lg">
        {[
          { type: 'constant', icon: '📄', label: 'Constant' },
          { type: 'database', icon: '🛢', label: 'Database' },
          { type: 'serial', icon: '🔢', label: 'Serial' },
          { type: 'date', icon: '📅', label: 'Date' },
          { type: 'time', icon: '🕒', label: 'Time' },
        ].map((item) => {
          const isActive = activeTab === item.type;
          return (
            <button
              key={item.type}
              onClick={() => {
                if (item.type === 'constant') {
                  updateActiveSegment({
                    type: 'constant',
                    text: 'Double click to input content',
                  });
                } else if (item.type === 'database') {
                  updateActiveSegment({
                    type: 'database',
                    sourceName: project.database?.name || 'Inventory.xlsx',
                    headerField: project.database?.headers?.[0] || 'SKU',
                    showHeaderPrefix: false,
                    dataType: 'Text',
                  });
                } else if (item.type === 'serial') {
                  updateActiveSegment({
                    type: 'serial',
                    startValue: 1,
                    direction: 'incremental',
                    repeat: 1,
                    interval: 1,
                    memory: false,
                    paddingWidth: 0,
                  });
                } else if (item.type === 'date') {
                  updateActiveSegment({
                    type: 'date',
                    realTime: false,
                    format: 'yyyy年MM月dd日(数字)',
                    yearOffset: 0,
                    monthOffset: 0,
                    dayOffset: 0,
                  });
                } else if (item.type === 'time') {
                  updateActiveSegment({
                    type: 'time',
                    realTime: true,
                    format: 'HH:mm:ss',
                    minuteOffset: 0,
                  });
                }
              }}
              className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="text-[10px] mt-0.5 tracking-tight truncate w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Multiple Fields Pill Bar (If user clicked "Add Field") */}
      {segments.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[10px] text-slate-400 shrink-0">Field:</span>
          {segments.map((seg, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                idx === activeIdx
                  ? 'bg-sky-100 text-sky-800 border border-sky-300 font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => onChangeKind({ ...kind, activeSegmentIdx: idx })}
            >
              <span>#{idx + 1} {seg.type}</span>
              {segments.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeField(idx);
                  }}
                  className="text-slate-400 hover:text-rose-600 ml-0.5"
                  title="Remove Field"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* DYNAMIC FORMS BASED ON ACTIVE SEGMENT */}
      <div className="pt-1">
        {/* 1. CONSTANT (Matching Ref 1) */}
        {activeSegment.type === 'constant' && (
          <div>
            <textarea
              rows={4}
              value={activeSegment.text}
              onChange={(e) => updateActiveSegment({ ...activeSegment, text: e.target.value })}
              placeholder="Double click to input content"
              className="w-full px-2.5 py-2 border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none leading-relaxed resize-none"
            />
          </div>
        )}

        {/* 2. DATABASE (Matching Ref 2) */}
        {activeSegment.type === 'database' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Data Source
              </label>
              <select
                value={activeSegment.sourceName}
                onChange={(e) =>
                  updateActiveSegment({ ...activeSegment, sourceName: e.target.value })
                }
                className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs bg-white outline-none focus:border-sky-500"
              >
                <option value={project.database?.name || 'Inventory.xlsx'}>
                  {project.database?.name || 'Inventory.xlsx'}
                </option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-600 font-medium">Header</label>
                <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeSegment.showHeaderPrefix}
                    onChange={(e) =>
                      updateActiveSegment({
                        ...activeSegment,
                        showHeaderPrefix: e.target.checked,
                      })
                    }
                    className="rounded text-sky-600"
                  />
                  <span>Show [header]</span>
                </label>
              </div>
              <select
                value={activeSegment.headerField}
                onChange={(e) =>
                  updateActiveSegment({ ...activeSegment, headerField: e.target.value })
                }
                className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs bg-white outline-none focus:border-sky-500"
              >
                {(project.database?.headers || ['SKU', 'ProductName', 'LotNumber', 'Location']).map(
                  (h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Type</label>
              <select
                value={activeSegment.dataType}
                onChange={(e) =>
                  updateActiveSegment({
                    ...activeSegment,
                    dataType: e.target.value as 'Text' | 'Number' | 'Date',
                  })
                }
                className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs bg-white outline-none focus:border-sky-500"
              >
                <option value="Text">Text</option>
                <option value="Number">Number</option>
                <option value="Date">Date</option>
              </select>
            </div>
          </div>
        )}

        {/* 3. SERIAL (Matching Ref 6) */}
        {activeSegment.type === 'serial' && (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Start Value
              </label>
              <input
                type="number"
                value={activeSegment.startValue}
                onChange={(e) =>
                  updateActiveSegment({
                    ...activeSegment,
                    startValue: Number(e.target.value),
                  })
                }
                className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs font-mono outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Counter</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="counter-dir"
                    checked={activeSegment.direction === 'incremental'}
                    onChange={() =>
                      updateActiveSegment({
                        ...activeSegment,
                        direction: 'incremental',
                      })
                    }
                    className="text-sky-600"
                  />
                  <span>Incremental</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="counter-dir"
                    checked={activeSegment.direction === 'reduction'}
                    onChange={() =>
                      updateActiveSegment({
                        ...activeSegment,
                        direction: 'reduction',
                      })
                    }
                    className="text-sky-600"
                  />
                  <span>Reduction</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Repeat</label>
                <input
                  type="number"
                  min="1"
                  value={activeSegment.repeat}
                  onChange={(e) =>
                    updateActiveSegment({
                      ...activeSegment,
                      repeat: Math.max(1, Number(e.target.value)),
                    })
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Interval</label>
                <input
                  type="number"
                  min="1"
                  value={activeSegment.interval}
                  onChange={(e) =>
                    updateActiveSegment({
                      ...activeSegment,
                      interval: Math.max(1, Number(e.target.value)),
                    })
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 items-center">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Padding Digits</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={activeSegment.paddingWidth || 0}
                  onChange={(e) =>
                    updateActiveSegment({
                      ...activeSegment,
                      paddingWidth: Math.max(0, Number(e.target.value)),
                    })
                  }
                  placeholder="e.g. 5 for 00001"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs outline-none focus:border-sky-500"
                />
              </div>
              <div className="pt-4">
                <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeSegment.memory}
                    onChange={(e) =>
                      updateActiveSegment({
                        ...activeSegment,
                        memory: e.target.checked,
                      })
                    }
                    className="rounded text-sky-600"
                  />
                  <span>Memory (?)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 4. DATE (Matching Ref 3) */}
        {activeSegment.type === 'date' && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-600 font-medium">Current Date</label>
                <label className="flex items-center gap-1 text-sky-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={activeSegment.realTime}
                    onChange={(e) =>
                      updateActiveSegment({
                        ...activeSegment,
                        realTime: e.target.checked,
                      })
                    }
                    className="rounded text-sky-600"
                  />
                  <span>real time 👑</span>
                </label>
              </div>
              <input
                type="text"
                readOnly
                value={evaluateSingleSegment(activeSegment, evalCtx)}
                className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded text-slate-700 font-mono text-xs cursor-default outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Date Format</label>
              <select
                value={activeSegment.format}
                onChange={(e) =>
                  updateActiveSegment({ ...activeSegment, format: e.target.value })
                }
                className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs bg-white outline-none focus:border-sky-500"
              >
                <option value="yyyy年MM月dd日(数字)">yyyy年MM月dd日(数字)</option>
                <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                <option value="yyyy/MM/dd">yyyy/MM/dd</option>
                <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                <option value="yyMMdd">yyMMdd</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Year Offset</label>
                <input
                  type="number"
                  value={activeSegment.yearOffset}
                  onChange={(e) =>
                    updateActiveSegment({
                      ...activeSegment,
                      yearOffset: Number(e.target.value),
                    })
                  }
                  className="w-full px-1.5 py-1 border border-slate-300 rounded text-slate-800 text-xs outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Month Offset</label>
                <input
                  type="number"
                  value={activeSegment.monthOffset}
                  onChange={(e) =>
                    updateActiveSegment({
                      ...activeSegment,
                      monthOffset: Number(e.target.value),
                    })
                  }
                  className="w-full px-1.5 py-1 border border-slate-300 rounded text-slate-800 text-xs outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Day Offset</label>
                <input
                  type="number"
                  value={activeSegment.dayOffset}
                  onChange={(e) =>
                    updateActiveSegment({
                      ...activeSegment,
                      dayOffset: Number(e.target.value),
                    })
                  }
                  className="w-full px-1.5 py-1 border border-slate-300 rounded text-slate-800 text-xs outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. TIME */}
        {activeSegment.type === 'time' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-slate-600 font-medium">Time Format</label>
              <label className="flex items-center gap-1 text-sky-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={activeSegment.realTime}
                  onChange={(e) =>
                    updateActiveSegment({
                      ...activeSegment,
                      realTime: e.target.checked,
                    })
                  }
                  className="rounded text-sky-600"
                />
                <span>real time</span>
              </label>
            </div>
            <input
              type="text"
              value={activeSegment.format}
              onChange={(e) =>
                updateActiveSegment({ ...activeSegment, format: e.target.value })
              }
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 text-xs outline-none focus:border-sky-500 font-mono"
            />
            <div>
              <label className="block text-slate-600 font-medium mb-1">Minute Offset</label>
              <input
                type="number"
                value={activeSegment.minuteOffset}
                onChange={(e) =>
                  updateActiveSegment({
                    ...activeSegment,
                    minuteOffset: Number(e.target.value),
                  })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 text-xs outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Right-aligned "+ Add Field 👑" Button (Matching Ref 1, 2, 3, 6) */}
      <div className="flex justify-end pt-1">
        <button
          onClick={addField}
          className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-md border border-sky-200 font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Add Field</span>
          <span className="text-[10px]">👑</span>
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   SUB-COMPONENT: Font Style Section (Matching Ref 1, 2, 3, 6 bottom)
========================================================================= */

function FontStyleSection({
  font,
  onChangeFont,
}: {
  font: FontStyle;
  onChangeFont: (font: FontStyle) => void;
}) {
  return (
    <div className="space-y-3 pt-3 border-t border-slate-100">
      <h3 className="font-bold text-slate-900 text-sm">Font Style</h3>

      {/* Font Family & Size */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <select
            value={font.family}
            onChange={(e) => onChangeFont({ ...font, family: e.target.value })}
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs bg-white outline-none focus:border-sky-500"
          >
            <option value="Microsoft YaHei">微软雅黑</option>
            <option value="SimSun">SimSun (宋体)</option>
            <option value="Arial">Arial</option>
            <option value="Consolas">Consolas</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>
        <div>
          <input
            type="number"
            min="4"
            max="120"
            step="0.5"
            value={font.sizePt}
            onChange={(e) =>
              onChangeFont({ ...font, sizePt: Math.max(4, Number(e.target.value)) })
            }
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs font-mono outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* 3 Text Direction Buttons: [ABC ➡] [⬇ ABC 👑] [ABC ⌒ 👑] */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
        {[
          { dir: 'horizontal' as TextDirection, label: 'ABC ➡' },
          { dir: 'vertical' as TextDirection, label: '⬇ ABC 👑' },
          { dir: 'arc' as TextDirection, label: 'ABC ⌒ 👑' },
        ].map((item) => (
          <button
            key={item.dir}
            onClick={() => onChangeFont({ ...font, direction: item.dir })}
            className={`py-1 text-[11px] font-medium rounded transition-colors ${
              font.direction === item.dir
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 5 Alignment Buttons: Left, Center, Right, Justify, Distribute */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-lg text-center">
        {[
          { align: 'left' as TextAlign, icon: '≣⬅' },
          { align: 'center' as TextAlign, icon: '≣' },
          { align: 'right' as TextAlign, icon: '➡≣' },
          { align: 'justify' as TextAlign, icon: '☰' },
          { align: 'distribute' as TextAlign, icon: '▤' },
        ].map((item) => (
          <button
            key={item.align}
            onClick={() => onChangeFont({ ...font, align: item.align })}
            className={`py-1 text-xs rounded transition-colors ${
              font.align === item.align
                ? 'bg-sky-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title={item.align}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* Word Space & Scale */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-slate-600 font-medium mb-1">
            Word Space
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.5"
              value={font.wordSpacePt}
              onChange={(e) =>
                onChangeFont({ ...font, wordSpacePt: Number(e.target.value) })
              }
              className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
            />
            <span className="text-slate-500 font-mono text-[11px]">pt</span>
          </div>
        </div>

        <div>
          <label className="block text-slate-600 font-medium mb-1">Scale</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="20"
              max="300"
              step="5"
              value={font.scalePercent}
              onChange={(e) =>
                onChangeFont({ ...font, scalePercent: Number(e.target.value) })
              }
              className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
            />
            <span className="text-slate-500 font-mono text-[11px]">%</span>
          </div>
        </div>
      </div>

      {/* 6 Modifier Toggles: [B] [I] [U] [S] [⛛ Mirror] [🅰 Reverse Video] */}
      <div className="grid grid-cols-6 gap-1 pt-1">
        {[
          { key: 'bold', label: 'B', active: font.bold, title: 'Bold' },
          { key: 'italic', label: 'I', active: font.italic, title: 'Italic' },
          { key: 'underline', label: 'U', active: font.underline, title: 'Underline' },
          { key: 'strikethrough', label: 'S', active: font.strikethrough, title: 'Strikethrough' },
          { key: 'mirrorHorizontal', label: '⛛', active: font.mirrorHorizontal, title: 'Mirror Horizontal' },
          { key: 'reverseVideo', label: '🅰', active: font.reverseVideo, title: 'Reverse Video (White on Black)' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() =>
              onChangeFont({
                ...font,
                [item.key]: !item.active,
              })
            }
            title={item.title}
            className={`py-1.5 rounded border text-xs font-bold transition-all cursor-pointer ${
              item.active
                ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   SUB-COMPONENT: Prompt Section (Matching Ref 1 & 3 bottom)
========================================================================= */

function PromptSection({
  prompt,
  onChangePrompt,
}: {
  prompt: PromptConfig;
  onChangePrompt: (prompt: PromptConfig) => void;
}) {
  return (
    <div className="space-y-3 pt-3 border-t border-slate-100">
      <h3 className="font-bold text-slate-900 text-sm">Prompt</h3>

      <div>
        <label className="block text-slate-600 font-medium mb-1">
          Shared Field (?)
        </label>
        <input
          type="text"
          value={prompt.sharedFieldName || ''}
          onChange={(e) =>
            onChangePrompt({
              ...prompt,
              sharedFieldName: e.target.value.trim() || undefined,
            })
          }
          placeholder="Select or add a shared field"
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
        />
      </div>

      <div className="pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
          <input
            type="checkbox"
            checked={prompt.printTimeInput}
            onChange={(e) =>
              onChangePrompt({
                ...prompt,
                printTimeInput: e.target.checked,
              })
            }
            className="rounded text-sky-600 w-3.5 h-3.5"
          />
          <span>Print-time Input 👑 (?)</span>
        </label>
        {prompt.printTimeInput && (
          <div className="mt-2 pl-5">
            <input
              type="text"
              value={prompt.promptHint}
              onChange={(e) =>
                onChangePrompt({ ...prompt, promptHint: e.target.value })
              }
              placeholder="Operator prompt hint (e.g. Scan Operator ID)"
              className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-700"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function SignedCoordinateInput({
  value,
  onChange,
  className,
  title,
}: {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  title?: string;
}) {
  const [text, setText] = useState<string>(String(value));

  useEffect(() => {
    const parsed = parseFloat(text);
    if (isNaN(parsed) || parsed !== value) {
      setText(String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow typing '-', empty, digits, single decimal point
    if (/^-?\d*\.?\d*$/.test(raw)) {
      setText(raw);
      const num = parseFloat(raw);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  const handleBlur = () => {
    const num = parseFloat(text);
    if (!isNaN(num)) {
      setText(String(num));
      onChange(num);
    } else {
      setText(String(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = parseFloat(text) || 0;
      const step = e.shiftKey ? 5 : 0.5;
      const next = Number((current + step).toFixed(1));
      setText(String(next));
      onChange(next);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseFloat(text) || 0;
      const step = e.shiftKey ? 5 : 0.5;
      const next = Number((current - step).toFixed(1));
      setText(String(next));
      onChange(next);
    }
  };

  return (
    <input
      type="text"
      title={title}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
    />
  );
}
