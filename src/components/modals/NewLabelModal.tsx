import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Circle, RectangleHorizontal, SlidersHorizontal, Square } from 'lucide-react';
import { PaperSetup, PaperShape } from '../../types/model';
import { PAPER_PRESETS } from '../../data/catalogs';
import { NumberInput } from '../ui/NumberInput';
import { ModalShell } from '../ui/ModalShell';
import { SegmentedControl } from '../ui/InspectorSection';

interface NewLabelModalProps {
  isOpen: boolean;
  initialPaper: PaperSetup;
  initialName?: string;
  onClose: () => void;
  onConfirm: (name: string, paper: PaperSetup) => void;
}

export const NewLabelModal: React.FC<NewLabelModalProps> = ({
  isOpen,
  initialPaper,
  initialName = 'New Label1',
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState(initialName);
  const [paper, setPaper] = useState<PaperSetup>({ ...initialPaper });
  const [showMoreSettings, setShowMoreSettings] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setPaper({ ...initialPaper });
      setName(initialName);
      setShowMoreSettings(true);
    }
  }, [isOpen, initialPaper, initialName]);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="标签规格与纸张设置 (Label Setup)"
      subtitle="配置物理标签纸宽高、排列列数、间隙与打印偏移"
      icon={<SlidersHorizontal className="w-4 h-4" />}
      maxWidthClass="max-w-[720px] w-full"
    >
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Settings Form */}
        <div className="space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-3.5">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                标签名称 (Label Name)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入标签工程名称"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 text-xs focus:border-[#0066FF] outline-none"
              />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 text-xs mb-2">
                纸张尺寸 (Label Size)
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-500 text-[11px] mb-1">宽度 (Width)</label>
                  <div className="flex items-center gap-1.5">
                    <NumberInput
                      min={0.1}
                      step={0.1}
                      value={paper.widthMm}
                      onChange={(widthMm) => setPaper({ ...paper, widthMm })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 text-xs font-mono tabular-nums outline-none focus:border-[#0066FF]"
                    />
                    <span className="text-slate-400 font-mono">mm</span>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 text-[11px] mb-1">高度 (Height)</label>
                  <div className="flex items-center gap-1.5">
                    <NumberInput
                      min={0.1}
                      step={0.1}
                      value={paper.heightMm}
                      onChange={(heightMm) => setPaper({ ...paper, heightMm })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 text-xs font-mono tabular-nums outline-none focus:border-[#0066FF]"
                    />
                    <span className="text-slate-400 font-mono">mm</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                {PAPER_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      setPaper({
                        ...paper,
                        widthMm: preset.widthMm,
                        heightMm: preset.heightMm,
                        columns: preset.columns,
                      })
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-[#0066FF] text-slate-700 rounded text-[11px] font-mono font-medium transition-colors text-left"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowMoreSettings(!showMoreSettings)}
                className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-[#0066FF] transition-colors"
              >
                {showMoreSettings ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                <span>高级纸张参数 (More Settings)</span>
              </button>

              {showMoreSettings && (
                <div className="mt-2.5 space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">
                        排列列数 (Columns)
                      </label>
                      <NumberInput
                        min={1}
                        max={8}
                        integer
                        value={paper.columns}
                        onChange={(columns) => setPaper({ ...paper, columns })}
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">
                        标签间隙 (Gap)
                      </label>
                      <div className="flex items-center gap-1">
                        <NumberInput
                          min={0}
                          step={0.1}
                          value={paper.gapMm}
                          onChange={(gapMm) => setPaper({ ...paper, gapMm })}
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs font-mono"
                        />
                        <span className="text-slate-400 font-mono text-[10px]">mm</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">
                        左右偏移 (L/R Offset)
                      </label>
                      <div className="flex items-center gap-1">
                        <NumberInput
                          step={0.1}
                          value={paper.offsetLeftRightMm}
                          onChange={(offsetLeftRightMm) =>
                            setPaper({ ...paper, offsetLeftRightMm })
                          }
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs font-mono"
                        />
                        <span className="text-slate-400 font-mono text-[10px]">mm</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">
                        上下偏移 (U/D Offset)
                      </label>
                      <div className="flex items-center gap-1">
                        <NumberInput
                          step={0.1}
                          value={paper.offsetUpDownMm}
                          onChange={(offsetUpDownMm) =>
                            setPaper({ ...paper, offsetUpDownMm })
                          }
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs font-mono"
                        />
                        <span className="text-slate-400 font-mono text-[10px]">mm</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">
                      切模外形 (Shape)
                    </label>
                    <SegmentedControl<PaperShape>
                      value={paper.shape}
                      onChange={(shape) => setPaper({ ...paper, shape })}
                      size="xs"
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
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onConfirm(name || 'New Label', paper);
                onClose();
              }}
              className="w-full py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold rounded-lg shadow-xs text-xs transition-colors"
            >
              确认应用规格 (Confirm)
            </button>
          </div>
        </div>

        {/* Right Blueprint Dimensioned Preview */}
        <div
          className="bg-[#eef2f7] rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(15,23,42,0.08) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Top Width Dimension */}
            <div className="absolute -top-7 left-0 right-0 flex flex-col items-center pointer-events-none">
              <span className="text-xs font-bold text-[#0066FF] font-mono tabular-nums leading-none mb-1">
                {paper.widthMm}mm
              </span>
              <div className="w-full flex items-center">
                <div className="w-1.5 h-1.5 border-t border-l border-[#0066FF] -rotate-45" />
                <div className="flex-1 h-[1.5px] bg-[#0066FF]" />
                <div className="w-1.5 h-1.5 border-t border-r border-[#0066FF] rotate-45" />
              </div>
            </div>

            {/* Left Height Dimension */}
            <div className="absolute -left-9 top-0 bottom-0 flex items-center pointer-events-none">
              <div className="flex flex-col items-center mr-1">
                <span className="text-xs font-bold text-[#0066FF] font-mono tabular-nums [writing-mode:vertical-rl] rotate-180">
                  {paper.heightMm}mm
                </span>
              </div>
              <div className="h-full flex flex-col items-center">
                <div className="w-1.5 h-1.5 border-t border-l border-[#0066FF] rotate-45" />
                <div className="flex-1 w-[1.5px] bg-[#0066FF]" />
                <div className="w-1.5 h-1.5 border-b border-l border-[#0066FF] -rotate-45" />
              </div>
            </div>

            {(() => {
              const maxBox = 185;
              const aspect = paper.widthMm / Math.max(1, paper.heightMm);
              let w = maxBox;
              let h = maxBox / aspect;
              if (h > maxBox) {
                h = maxBox;
                w = maxBox * aspect;
              }

              return (
                <div
                  className={`bg-white shadow-lg border border-slate-300 flex flex-col items-center justify-center text-slate-400 font-mono text-[11px] transition-all duration-150 ${
                    paper.shape === 'sharp'
                      ? 'rounded-none'
                      : paper.shape === 'ellipse'
                        ? 'rounded-full'
                        : 'rounded-xl'
                  }`}
                  style={{ width: `${w}px`, height: `${h}px` }}
                >
                  <span className="font-semibold text-slate-600">
                    {paper.columns > 1 ? `${paper.columns} Cols` : '1 Col'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Gap {paper.gapMm}mm
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </ModalShell>
  );
};
