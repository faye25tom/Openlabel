import React from 'react';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  Link2,
  Link2Off,
  Move,
} from 'lucide-react';
import { LabelElement, PaperSetup } from '../../types/model';
import { NumberInput, SignedCoordinateInput } from '../ui/NumberInput';
import { InspectorSection } from '../ui/InspectorSection';

interface GeometrySectionProps {
  element: LabelElement;
  paper: PaperSetup;
  isAspectLocked: boolean;
  onToggleAspectLock: () => void;
  onUpdateBounds: (
    elementId: string,
    xMm: number,
    yMm: number,
    widthMm: number,
    heightMm: number,
  ) => void;
}

export const GeometrySection: React.FC<GeometrySectionProps> = ({
  element,
  paper,
  isAspectLocked,
  onToggleAspectLock,
  onUpdateBounds,
}) => {
  const effectiveLock =
    element.kind.type === 'qrcode'
      ? element.kind.codeType !== 'PDF_417' &&
        element.kind.lockAspectRatio !== false &&
        isAspectLocked
      : element.kind.type === 'image'
        ? element.kind.aspectRatioLock && isAspectLocked
        : isAspectLocked;

  const ratio = element.heightMm / Math.max(0.1, element.widthMm);

  return (
    <InspectorSection
      title="位置与尺寸 (Geometry)"
      icon={<Move className="w-3.5 h-3.5" />}
      rightSlot={
        <button
          type="button"
          onClick={onToggleAspectLock}
          title={effectiveLock ? '1:1 / 等比例已锁定' : '自由比例'}
          className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 transition-colors ${
            effectiveLock
              ? 'bg-[#0066FF] text-white border-[#0066FF] font-semibold'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          {effectiveLock ? (
            <>
              <Link2 className="w-3 h-3" />
              <span>锁定比例</span>
            </>
          ) : (
            <>
              <Link2Off className="w-3 h-3" />
              <span>自由比例</span>
            </>
          )}
        </button>
      }
    >
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
              X (支持负数)
            </label>
            <div className="flex items-center gap-1">
              <SignedCoordinateInput
                value={element.xMm}
                onChange={(nx) =>
                  onUpdateBounds(
                    element.id,
                    nx,
                    element.yMm,
                    element.widthMm,
                    element.heightMm,
                  )
                }
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 outline-none focus:border-[#0066FF] font-mono tabular-nums"
              />
              <span className="text-[10px] text-slate-400 font-mono">mm</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
              Y (支持负数)
            </label>
            <div className="flex items-center gap-1">
              <SignedCoordinateInput
                value={element.yMm}
                onChange={(ny) =>
                  onUpdateBounds(
                    element.id,
                    element.xMm,
                    ny,
                    element.widthMm,
                    element.heightMm,
                  )
                }
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 outline-none focus:border-[#0066FF] font-mono tabular-nums"
              />
              <span className="text-[10px] text-slate-400 font-mono">mm</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
              宽度 (Width)
            </label>
            <div className="flex items-center gap-1">
              <NumberInput
                step={0.1}
                min={0.1}
                value={element.widthMm}
                onChange={(nw) => {
                  const nh = effectiveLock
                    ? Number((nw * (element.kind.type === 'qrcode' ? 1 : ratio)).toFixed(1))
                    : element.heightMm;
                  onUpdateBounds(element.id, element.xMm, element.yMm, nw, nh);
                }}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 outline-none focus:border-[#0066FF] font-mono tabular-nums"
              />
              <span className="text-[10px] text-slate-400 font-mono">mm</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
              高度 (Height)
            </label>
            <div className="flex items-center gap-1">
              <NumberInput
                step={0.1}
                min={0.1}
                value={element.heightMm}
                onChange={(nh) => {
                  const nw = effectiveLock
                    ? Number((nh / Math.max(0.1, element.kind.type === 'qrcode' ? 1 : ratio)).toFixed(1))
                    : element.widthMm;
                  onUpdateBounds(element.id, element.xMm, element.yMm, nw, nh);
                }}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 outline-none focus:border-[#0066FF] font-mono tabular-nums"
              />
              <span className="text-[10px] text-slate-400 font-mono">mm</span>
            </div>
          </div>
        </div>

        {/* Quick Size Presets */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70">
          <span className="text-[10px] text-slate-400">快速尺寸</span>
          <div className="flex items-center gap-1">
            {[10, 15, 20, 25, 30].map((sz) => {
              const active = element.widthMm === sz && element.heightMm === sz;
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() =>
                    onUpdateBounds(
                      element.id,
                      element.xMm,
                      element.yMm,
                      sz,
                      effectiveLock ? sz : element.heightMm,
                    )
                  }
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors ${
                    active
                      ? 'bg-[#0066FF] text-white border-[#0066FF] font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sz}mm
                </button>
              );
            })}
          </div>
        </div>

        {/* Paper Alignment */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/70">
          <button
            type="button"
            onClick={() => {
              const cx = Number(((paper.widthMm - element.widthMm) / 2).toFixed(1));
              onUpdateBounds(
                element.id,
                cx,
                element.yMm,
                element.widthMm,
                element.heightMm,
              );
            }}
            className="flex-1 py-1 text-[10px] bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-700 transition-colors flex items-center justify-center gap-1"
          >
            <AlignCenterHorizontal className="w-3 h-3 text-slate-500" />
            <span>水平居中</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const cy = Number(((paper.heightMm - element.heightMm) / 2).toFixed(1));
              onUpdateBounds(
                element.id,
                element.xMm,
                cy,
                element.widthMm,
                element.heightMm,
              );
            }}
            className="flex-1 py-1 text-[10px] bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-700 transition-colors flex items-center justify-center gap-1"
          >
            <AlignCenterVertical className="w-3 h-3 text-slate-500" />
            <span>垂直居中</span>
          </button>
        </div>
      </div>
    </InspectorSection>
  );
};
