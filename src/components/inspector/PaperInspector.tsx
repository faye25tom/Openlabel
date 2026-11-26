import React from 'react';
import { ChevronRight, Circle, Palette, RotateCw, SlidersHorizontal, Square, RectangleHorizontal } from 'lucide-react';
import { PaperSetup, PaperShape } from '../../types/model';
import { PAPER_PRESETS } from '../../data/catalogs';
import { NumberInput } from '../ui/NumberInput';
import { InspectorSection, SegmentedControl } from '../ui/InspectorSection';

interface PaperInspectorProps {
  paper: PaperSetup;
  onUpdatePaper: (paper: PaperSetup) => void;
  onOpenPaperModal: () => void;
}

export const PaperInspector: React.FC<PaperInspectorProps> = ({
  paper,
  onUpdatePaper,
  onOpenPaperModal,
}) => {
  return (
    <aside className="no-print w-80 h-full bg-white border-l border-slate-200 overflow-y-auto flex flex-col text-slate-800 shrink-0 select-none">
      <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            标签纸张规格 (Label Size)
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">未选中图元时配置画布纸张</p>
        </div>
        <span className="text-[11px] font-mono tabular-nums font-semibold text-[#0066FF] bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded">
          {paper.widthMm}×{paper.heightMm}mm
        </span>
      </div>

      <div className="p-3 space-y-3 text-xs">
        <InspectorSection title="尺寸与快速预设" icon={<SlidersHorizontal className="w-3.5 h-3.5" />}>
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">
                  宽度 (Width)
                </label>
                <div className="flex items-center gap-1">
                  <NumberInput
                    min={0.1}
                    step={0.1}
                    value={paper.widthMm}
                    onChange={(widthMm) => onUpdatePaper({ ...paper, widthMm })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono tabular-nums focus:border-[#0066FF] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">mm</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">
                  高度 (Height)
                </label>
                <div className="flex items-center gap-1">
                  <NumberInput
                    min={0.1}
                    step={0.1}
                    value={paper.heightMm}
                    onChange={(heightMm) => onUpdatePaper({ ...paper, heightMm })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono tabular-nums focus:border-[#0066FF] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">mm</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {PAPER_PRESETS.map((preset) => {
                const active =
                  paper.widthMm === preset.widthMm &&
                  paper.heightMm === preset.heightMm &&
                  paper.columns === preset.columns;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      onUpdatePaper({
                        ...paper,
                        widthMm: preset.widthMm,
                        heightMm: preset.heightMm,
                        columns: preset.columns,
                      })
                    }
                    className={`px-2 py-1 rounded border text-[10px] font-mono transition-colors text-left ${
                      active
                        ? 'bg-blue-50 border-[#0066FF] text-[#0066FF] font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onOpenPaperModal}
              className="w-full py-1.5 px-2.5 rounded-md bg-white border border-slate-200 hover:border-[#0066FF]/50 hover:bg-blue-50/40 text-[#0066FF] text-xs font-medium flex items-center justify-between transition-colors"
            >
              <span>更多参数（列数、间距、打印偏移）</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </InspectorSection>

        <InspectorSection title="外形与方向" icon={<RotateCw className="w-3.5 h-3.5" />}>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">
                标签纸切模外形 (Shape)
              </label>
              <SegmentedControl<PaperShape>
                value={paper.shape}
                onChange={(shape) => onUpdatePaper({ ...paper, shape })}
                options={[
                  {
                    value: 'sharp',
                    label: (
                      <>
                        <Square className="w-3 h-3" />
                        <span>直角</span>
                      </>
                    ),
                  },
                  {
                    value: 'rounded',
                    label: (
                      <>
                        <RectangleHorizontal className="w-3 h-3" />
                        <span>圆角</span>
                      </>
                    ),
                  },
                  {
                    value: 'ellipse',
                    label: (
                      <>
                        <Circle className="w-3 h-3" />
                        <span>椭圆</span>
                      </>
                    ),
                  },
                ]}
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">
                画布旋转角度 (Rotation)
              </label>
              <SegmentedControl<0 | 90 | 180 | 270>
                value={paper.rotationDeg}
                onChange={(rotationDeg) => onUpdatePaper({ ...paper, rotationDeg })}
                options={[
                  { value: 0, label: '0°' },
                  { value: 90, label: '90°' },
                  { value: 180, label: '180°' },
                  { value: 270, label: '270°' },
                ]}
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorSection title="纸张底色" icon={<Palette className="w-3.5 h-3.5" />}>
          <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={paper.backgroundHex || '#ffffff'}
                onChange={(e) =>
                  onUpdatePaper({ ...paper, backgroundHex: e.target.value })
                }
                className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0.5"
              />
              <span className="font-mono text-xs text-slate-700 uppercase">
                {paper.backgroundHex || '#ffffff'}
              </span>
            </div>
            {paper.backgroundHex !== '#ffffff' && (
              <button
                type="button"
                onClick={() => onUpdatePaper({ ...paper, backgroundHex: '#ffffff' })}
                className="text-[11px] text-slate-500 hover:text-[#0066FF]"
              >
                恢复纯白
              </button>
            )}
          </div>
        </InspectorSection>
      </div>
    </aside>
  );
};
