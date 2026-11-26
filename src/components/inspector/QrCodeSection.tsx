import React from 'react';
import { Info, QrCode } from 'lucide-react';
import { LabelElement, TwoDCodeType } from '../../types/model';
import { TWO_D_CODE_TYPES } from '../../data/catalogs';
import { InspectorSection } from '../ui/InspectorSection';

interface QrCodeSectionProps {
  element: LabelElement;
  kind: Extract<LabelElement['kind'], { type: 'qrcode' }>;
  onChangeKind: (kind: LabelElement['kind']) => void;
  onUpdateBounds: (
    elementId: string,
    xMm: number,
    yMm: number,
    widthMm: number,
    heightMm: number,
  ) => void;
  onSetAspectLock: (locked: boolean) => void;
}

const MODULE_SCALES = [
  { dots: 0, label: '自适应', scale: 100 },
  { dots: 1, label: '1点 (极小)', scale: 40 },
  { dots: 2, label: '2点 (紧凑)', scale: 60 },
  { dots: 3, label: '3点 (标准)', scale: 80 },
  { dots: 4, label: '4点 (中等)', scale: 100 },
  { dots: 5, label: '5点 (大码)', scale: 120 },
  { dots: 6, label: '6点 (超大)', scale: 135 },
  { dots: 8, label: '8点 (远距)', scale: 150 },
];

export const QrCodeSection: React.FC<QrCodeSectionProps> = ({
  element,
  kind,
  onChangeKind,
  onUpdateBounds,
  onSetAspectLock,
}) => {
  return (
    <InspectorSection
      title="二维条码 (2D Code)"
      icon={<QrCode className="w-3.5 h-3.5" />}
      rightSlot={
        <span className="text-[10px] text-slate-500 font-mono font-semibold">
          {kind.codeType}
        </span>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          {TWO_D_CODE_TYPES.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() =>
                onChangeKind({
                  ...kind,
                  codeType: item.type as TwoDCodeType,
                  lockAspectRatio: item.type !== 'PDF_417' ? kind.lockAspectRatio ?? true : false,
                })
              }
              className={`py-1.5 px-1 text-[11px] font-medium rounded border transition-colors text-center ${
                kind.codeType === item.type
                  ? 'bg-[#0066FF] border-[#0066FF] text-white font-semibold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.shortLabel}
            </button>
          ))}
        </div>

        {(kind.codeType === 'QR_Code' || kind.codeType === 'HANXIN') && (
          <div>
            <label className="block text-slate-600 font-medium text-[11px] mb-1">
              容错级别 (Error Correction)
            </label>
            <div className="grid grid-cols-4 gap-1 p-0.5 bg-white border border-slate-200 rounded">
              {(['L', 'M', 'Q', 'H'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onChangeKind({ ...kind, errorCorrection: lvl })}
                  className={`py-0.5 text-xs font-mono rounded ${
                    kind.errorCorrection === lvl
                      ? 'bg-[#0066FF] text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Module Scale Dots */}
        <div className="pt-2 border-t border-slate-200/70 space-y-2.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-semibold text-[11px] flex items-center gap-1">
                <span>码点小比例</span>
                <span className="text-[10px] text-[#0066FF] font-mono font-normal">
                  {kind.cellWidthDots
                    ? `${kind.cellWidthDots}点 (${(kind.cellWidthDots * 0.125).toFixed(3)}mm)`
                    : '自适应外框'}
                </span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const dots = kind.cellWidthDots || 3;
                  const margin = kind.marginModules ?? 1;
                  const approxModules = 29 + margin * 2;
                  const fitMm = Math.max(6, Math.round(approxModules * dots * 0.125));
                  onUpdateBounds(element.id, element.xMm, element.yMm, fitMm, fitMm);
                }}
                title="根据码点小比例自动调整外框大小"
                className="text-[10px] text-[#0066FF] hover:underline font-medium"
              >
                按小比例适配外框
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1 p-0.5 bg-white border border-slate-200 rounded">
              {MODULE_SCALES.map((item) => (
                <button
                  key={item.dots}
                  type="button"
                  onClick={() =>
                    onChangeKind({
                      ...kind,
                      cellWidthDots: item.dots || undefined,
                      scalePercent: item.scale,
                    })
                  }
                  className={`py-1 text-[10px] rounded transition-colors ${
                    (kind.cellWidthDots ?? 0) === item.dots
                      ? 'bg-[#0066FF] text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Internal Scale Ratio */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-medium text-[11px]">
                内部缩放微调 (Scale Ratio)
              </label>
              <span className="font-mono text-xs font-bold text-[#0066FF] tabular-nums">
                {kind.scalePercent ?? 100}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="25"
                max="150"
                step="5"
                value={kind.scalePercent ?? 100}
                onChange={(e) =>
                  onChangeKind({
                    ...kind,
                    scalePercent: Number(e.target.value),
                  })
                }
                className="flex-1 accent-[#0066FF] h-1.5 bg-slate-200 rounded cursor-pointer"
              />
              <div className="flex items-center gap-1">
                {[30, 50, 75, 100, 125].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onChangeKind({ ...kind, scalePercent: pct })}
                    className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                      (kind.scalePercent ?? 100) === pct
                        ? 'bg-[#0066FF] text-white font-bold'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quiet Zone Margin */}
          <div>
            <label className="block text-slate-600 font-medium text-[11px] mb-1">
              空白区边距 (Quiet Zone Margin)
            </label>
            <div className="grid grid-cols-4 gap-1 p-0.5 bg-white border border-slate-200 rounded">
              {[
                { m: 0, label: '0 无边距' },
                { m: 1, label: '1 紧凑' },
                { m: 2, label: '2 标准' },
                { m: 4, label: '4 GS1' },
              ].map((item) => (
                <button
                  key={item.m}
                  type="button"
                  onClick={() => onChangeKind({ ...kind, marginModules: item.m })}
                  className={`py-1 text-[10px] rounded transition-colors ${
                    (kind.marginModules ?? 1) === item.m
                      ? 'bg-[#0066FF] text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={kind.lockAspectRatio !== false}
                onChange={(e) => {
                  onChangeKind({ ...kind, lockAspectRatio: e.target.checked });
                  onSetAspectLock(e.target.checked);
                }}
                className="rounded text-[#0066FF]"
              />
              <span className="text-[11px]">保持 1:1 正方形等比</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono tabular-nums">
              {element.widthMm} × {element.heightMm} mm
            </span>
          </div>

          <div className="text-[10px] text-slate-500 bg-blue-50/70 p-2 rounded border border-blue-100 flex items-start gap-1.5 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-[#0066FF] shrink-0 mt-0.5" />
            <span>
              支持「码点小比例 (1~8点)」与内部缩放比调节，矢量居中渲染，任意缩小无裁切。
            </span>
          </div>
        </div>
      </div>
    </InspectorSection>
  );
};
