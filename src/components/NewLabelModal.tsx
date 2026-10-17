import React, { useState } from 'react';
import { PaperSetup, PaperShape } from '../types/model';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs select-none">
      <div className="w-[680px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">New Label</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg w-6 h-6 flex items-center justify-center rounded cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content 2-Column Split */}
        <div className="p-6 grid grid-cols-2 gap-6">
          {/* Left Column: Settings Form */}
          <div className="space-y-4 text-xs flex flex-col justify-between">
            <div className="space-y-3.5">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Label Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Please fill in (optional)"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
                />
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-xs mb-2">Label size</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">
                      Width (?)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="10"
                        max="300"
                        step="1"
                        value={paper.widthMm}
                        onChange={(e) =>
                          setPaper({
                            ...paper,
                            widthMm: Math.max(10, Number(e.target.value)),
                          })
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs outline-none focus:border-sky-500"
                      />
                      <span className="text-slate-400 font-mono">mm</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-1">
                      Height (?)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="10"
                        max="300"
                        step="1"
                        value={paper.heightMm}
                        onChange={(e) =>
                          setPaper({
                            ...paper,
                            heightMm: Math.max(10, Number(e.target.value)),
                          })
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs outline-none focus:border-sky-500"
                      />
                      <span className="text-slate-400 font-mono">mm</span>
                    </div>
                  </div>
                </div>

                {/* Quick Presets (Matching Ref 5) */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPaper({
                        ...paper,
                        widthMm: 70,
                        heightMm: 50,
                        columns: 1,
                      })
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    70X50mm, 1column
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPaper({
                        ...paper,
                        widthMm: 50,
                        heightMm: 30,
                        columns: 1,
                      })
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    50X30mm, 1column
                  </button>
                </div>
              </div>

              {/* More Settings */}
              <div className="pt-1">
                <label className="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMoreSettings}
                    onChange={(e) => setShowMoreSettings(e.target.checked)}
                    className="rounded text-sky-600"
                  />
                  <span>More Settings ⌄</span>
                </label>

                {showMoreSettings && (
                  <div className="mt-2.5 space-y-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 text-[11px] mb-0.5">
                          Columns (?)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={paper.columns}
                          onChange={(e) =>
                            setPaper({
                              ...paper,
                              columns: Math.max(1, Number(e.target.value)),
                            })
                          }
                          className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[11px] mb-0.5">
                          Gap (?)
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            value={paper.gapMm}
                            onChange={(e) =>
                              setPaper({
                                ...paper,
                                gapMm: Math.max(0, Number(e.target.value)),
                              })
                            }
                            className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs"
                          />
                          <span className="text-slate-400 font-mono text-[10px]">mm</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 text-[11px] mb-0.5">
                          Left Right (?)
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={paper.offsetLeftRightMm}
                            onChange={(e) =>
                              setPaper({
                                ...paper,
                                offsetLeftRightMm: Number(e.target.value),
                              })
                            }
                            className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs"
                          />
                          <span className="text-slate-400 font-mono text-[10px]">mm</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[11px] mb-0.5">
                          Up Down (?)
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={paper.offsetUpDownMm}
                            onChange={(e) =>
                              setPaper({
                                ...paper,
                                offsetUpDownMm: Number(e.target.value),
                              })
                            }
                            className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-xs"
                          />
                          <span className="text-slate-400 font-mono text-[10px]">mm</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[11px] mb-1">
                        Shape
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-white p-0.5 border border-slate-200 rounded">
                        {(
                          [
                            { id: 'sharp', label: '▭ Sharp' },
                            { id: 'rounded', label: '▢ Rounded' },
                            { id: 'ellipse', label: '⬭ Ellipse' },
                          ] as { id: PaperShape; label: string }[]
                        ).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setPaper({ ...paper, shape: s.id })}
                            className={`py-1 text-[11px] font-medium rounded transition-colors ${
                              paper.shape === s.id
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Confirm Button */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => {
                  onConfirm(name || 'New Label', paper);
                  onClose();
                }}
                className="w-full py-2.5 bg-[#0084ff] hover:bg-[#0073e6] active:bg-[#0062c4] text-white font-semibold rounded-lg shadow-sm text-sm transition-colors cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Dimensioned Preview (Matching Ref 5 right) */}
          <div className="bg-[#f5f7fa] rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Dimensions Preview Container */}
            <div className="relative flex items-center justify-center">
              {/* Top Horizontal Dimension Line & Label */}
              <div
                className="absolute -top-7 left-0 right-0 flex flex-col items-center pointer-events-none"
              >
                <span className="text-xs font-bold text-[#0084ff] font-mono leading-none mb-1">
                  {paper.widthMm}mm
                </span>
                <div className="w-full flex items-center">
                  <div className="w-1.5 h-1.5 border-t border-l border-[#0084ff] -rotate-45" />
                  <div className="flex-1 h-[1.5px] bg-[#0084ff]" />
                  <div className="w-1.5 h-1.5 border-t border-r border-[#0084ff] rotate-45" />
                </div>
              </div>

              {/* Left Vertical Dimension Line & Label */}
              <div
                className="absolute -left-9 top-0 bottom-0 flex items-center pointer-events-none"
              >
                <div className="flex flex-col items-center mr-1">
                  <span className="text-xs font-bold text-[#0084ff] font-mono [writing-mode:vertical-rl] rotate-180">
                    {paper.heightMm}mm
                  </span>
                </div>
                <div className="h-full flex flex-col items-center">
                  <div className="w-1.5 h-1.5 border-t border-l border-[#0084ff] rotate-45" />
                  <div className="flex-1 w-[1.5px] bg-[#0084ff]" />
                  <div className="w-1.5 h-1.5 border-b border-l border-[#0084ff] -rotate-45" />
                </div>
              </div>

              {/* Scaled Label Paper Card */}
              {(() => {
                const maxBox = 180;
                const aspect = paper.widthMm / Math.max(1, paper.heightMm);
                let w = maxBox;
                let h = maxBox / aspect;
                if (h > maxBox) {
                  h = maxBox;
                  w = maxBox * aspect;
                }

                return (
                  <div
                    className={`bg-white shadow-md border border-slate-300 flex items-center justify-center text-slate-400 font-mono text-[11px] transition-all duration-150 ${
                      paper.shape === 'sharp'
                        ? 'rounded-none'
                        : paper.shape === 'ellipse'
                        ? 'rounded-full'
                        : 'rounded-xl'
                    }`}
                    style={{ width: `${w}px`, height: `${h}px` }}
                  >
                    <span>
                      {paper.columns > 1 ? `${paper.columns} Cols` : '1 Col'}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
