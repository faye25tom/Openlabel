import React, { useState } from 'react';
import {
  DataSegment,
  DEFAULT_FONT,
  DEFAULT_PROMPT,
  FontStyle,
  LabelElement,
  LabelProject,
  PaperSetup,
  PaperShape,
  PromptConfig,
  TextAlign,
  TextDirection,
} from '../types/model';
import { EvalContext, evaluateSingleSegment, evaluateSegments } from '../engine/evaluator';

interface RightInspectorProps {
  project: LabelProject;
  selectedElementId: string | null;
  onUpdatePaper: (paper: PaperSetup) => void;
  onOpenPaperModal: () => void;
  onUpdateElementKind: (elementId: string, kind: LabelElement['kind']) => void;
  onUpdateElementBounds: (elementId: string, xMm: number, yMm: number, widthMm: number, heightMm: number) => void;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  project,
  selectedElementId,
  onUpdatePaper,
  onOpenPaperModal,
  onUpdateElementKind,
  onUpdateElementBounds,
}) => {
  const selectedElement = project.elements.find((e) => e.id === selectedElementId);
  const paper = project.paper;

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

      <div className="p-4 space-y-6">
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

        {/* Graph shape specifics */}
        {selectedElement.kind.type === 'graph' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900">Graph Properties</h3>
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Line Thickness (mm)
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
                      lineThicknessMm: Number(e.target.value),
                    });
                  }
                }}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="filled-check"
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
              <label htmlFor="filled-check" className="text-slate-700">
                Filled Shape
              </label>
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
