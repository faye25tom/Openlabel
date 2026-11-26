import React from 'react';
import {
  Calendar,
  Clock,
  Database,
  FileText,
  Hash,
  Layers,
  Plus,
  X,
} from 'lucide-react';
import { DataSegment, LabelElement, LabelProject } from '../../types/model';
import { EvalContext, evaluateSingleSegment } from '../../engine/evaluator';
import { NumberInput } from '../ui/NumberInput';
import { InspectorSection } from '../ui/InspectorSection';

interface ContentSectionProps {
  element: LabelElement;
  project: LabelProject;
  onChangeKind: (kind: LabelElement['kind']) => void;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  element,
  project,
  onChangeKind,
}) => {
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

  const evalCtx: EvalContext = {
    labelSequenceIndex: 0,
    dbRowIndex: project.currentRecordIndex,
    table: project.database,
    fixedNow: new Date(),
  };

  const segmentTabs: {
    type: DataSegment['type'];
    icon: React.ReactNode;
    label: string;
  }[] = [
    { type: 'constant', icon: <FileText className="w-3.5 h-3.5" />, label: '常量' },
    { type: 'database', icon: <Database className="w-3.5 h-3.5" />, label: '数据库' },
    { type: 'serial', icon: <Hash className="w-3.5 h-3.5" />, label: '流水号' },
    { type: 'date', icon: <Calendar className="w-3.5 h-3.5" />, label: '日期' },
    { type: 'time', icon: <Clock className="w-3.5 h-3.5" />, label: '时间' },
  ];

  return (
    <InspectorSection
      title="数据内容源 (Content)"
      icon={<Layers className="w-3.5 h-3.5" />}
      rightSlot={
        segments.length > 1 ? (
          <span className="text-[10px] text-[#0066FF] font-mono font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
            {segments.length} 段拼接
          </span>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {/* 5 Segment Type Selectors */}
        <div className="grid grid-cols-5 gap-1 p-1 bg-slate-200/65 rounded-lg">
          {segmentTabs.map((item) => {
            const isActive = activeTab === item.type;
            return (
              <button
                key={item.type}
                type="button"
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
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded transition-all ${
                  isActive
                    ? 'bg-[#0066FF] text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                {item.icon}
                <span className="text-[10px] mt-0.5 tracking-tight truncate w-full text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Multi-segment Pills */}
        {segments.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {segments.map((seg, idx) => (
              <div
                key={idx}
                onClick={() => onChangeKind({ ...kind, activeSegmentIdx: idx })}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors shrink-0 ${
                  idx === activeIdx
                    ? 'bg-blue-50 text-[#0066FF] border border-blue-300 font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>
                  #{idx + 1} {seg.type}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeField(idx);
                  }}
                  className="text-slate-400 hover:text-rose-600 ml-0.5"
                  title="移除数据段"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Active Segment Editor */}
        <div>
          {activeSegment.type === 'constant' && (
            <textarea
              rows={3}
              value={activeSegment.text}
              onChange={(e) =>
                updateActiveSegment({ ...activeSegment, text: e.target.value })
              }
              placeholder="输入文本或编码内容"
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:border-[#0066FF] outline-none leading-relaxed resize-none"
            />
          )}

          {activeSegment.type === 'database' && (
            <div className="space-y-2.5">
              <div>
                <label className="block text-slate-600 font-medium text-[11px] mb-1">
                  数据源 (Data Source)
                </label>
                <select
                  value={activeSegment.sourceName}
                  onChange={(e) =>
                    updateActiveSegment({
                      ...activeSegment,
                      sourceName: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs bg-white outline-none focus:border-[#0066FF]"
                >
                  <option value={project.database?.name || 'Inventory.xlsx'}>
                    {project.database?.name || 'Inventory.xlsx'}
                  </option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 font-medium text-[11px]">
                    绑定列名 (Header)
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeSegment.showHeaderPrefix}
                      onChange={(e) =>
                        updateActiveSegment({
                          ...activeSegment,
                          showHeaderPrefix: e.target.checked,
                        })
                      }
                      className="rounded text-[#0066FF]"
                    />
                    <span>显示列名前缀</span>
                  </label>
                </div>
                <select
                  value={activeSegment.headerField}
                  onChange={(e) =>
                    updateActiveSegment({
                      ...activeSegment,
                      headerField: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs bg-white outline-none focus:border-[#0066FF]"
                >
                  {(
                    project.database?.headers || [
                      'SKU',
                      'ProductName',
                      'LotNumber',
                      'Location',
                    ]
                  ).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium text-[11px] mb-1">
                  字段类型 (Type)
                </label>
                <select
                  value={activeSegment.dataType}
                  onChange={(e) =>
                    updateActiveSegment({
                      ...activeSegment,
                      dataType: e.target.value as 'Text' | 'Number' | 'Date',
                    })
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs bg-white outline-none focus:border-[#0066FF]"
                >
                  <option value="Text">Text</option>
                  <option value="Number">Number</option>
                  <option value="Date">Date</option>
                </select>
              </div>
            </div>
          )}

          {activeSegment.type === 'serial' && (
            <div className="space-y-2.5">
              <div>
                <label className="block text-slate-600 font-medium text-[11px] mb-1">
                  起始值 (Start Value)
                </label>
                <NumberInput
                  integer
                  value={activeSegment.startValue}
                  onChange={(startValue) =>
                    updateActiveSegment({ ...activeSegment, startValue })
                  }
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono tabular-nums outline-none focus:border-[#0066FF]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium text-[11px] mb-1">
                  计数方向 (Counter)
                </label>
                <div className="flex items-center gap-4 text-xs">
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
                      className="text-[#0066FF]"
                    />
                    <span>递增 (Incremental)</span>
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
                      className="text-[#0066FF]"
                    />
                    <span>递减 (Reduction)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium text-[11px] mb-1">
                    每号重复 (Repeat)
                  </label>
                  <NumberInput
                    min={1}
                    integer
                    value={activeSegment.repeat}
                    onChange={(repeat) =>
                      updateActiveSegment({ ...activeSegment, repeat })
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono tabular-nums outline-none focus:border-[#0066FF]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium text-[11px] mb-1">
                    步长 (Interval)
                  </label>
                  <NumberInput
                    min={1}
                    integer
                    value={activeSegment.interval}
                    onChange={(interval) =>
                      updateActiveSegment({ ...activeSegment, interval })
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono tabular-nums outline-none focus:border-[#0066FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <label className="block text-slate-600 font-medium text-[11px] mb-1">
                    补零位数 (Padding)
                  </label>
                  <NumberInput
                    min={0}
                    max={10}
                    integer
                    value={activeSegment.paddingWidth || 0}
                    onChange={(paddingWidth) =>
                      updateActiveSegment({ ...activeSegment, paddingWidth })
                    }
                    placeholder="如 5 -> 00001"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono tabular-nums outline-none focus:border-[#0066FF]"
                  />
                </div>
                <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer pt-4 text-[11px]">
                  <input
                    type="checkbox"
                    checked={activeSegment.memory}
                    onChange={(e) =>
                      updateActiveSegment({
                        ...activeSegment,
                        memory: e.target.checked,
                      })
                    }
                    className="rounded text-[#0066FF]"
                  />
                  <span>断点记忆 (Memory)</span>
                </label>
              </div>
            </div>
          )}

          {activeSegment.type === 'date' && (
            <div className="space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 font-medium text-[11px]">
                    预览结果
                  </label>
                  <label className="flex items-center gap-1 text-[#0066FF] cursor-pointer font-medium text-[11px]">
                    <input
                      type="checkbox"
                      checked={activeSegment.realTime}
                      onChange={(e) =>
                        updateActiveSegment({
                          ...activeSegment,
                          realTime: e.target.checked,
                        })
                      }
                      className="rounded text-[#0066FF]"
                    />
                    <span>实时日期</span>
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
                <label className="block text-slate-600 font-medium text-[11px] mb-1">
                  日期格式 (Format)
                </label>
                <select
                  value={activeSegment.format}
                  onChange={(e) =>
                    updateActiveSegment({
                      ...activeSegment,
                      format: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs bg-white outline-none focus:border-[#0066FF]"
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
                  <label className="block text-slate-500 text-[10px] mb-0.5">
                    年偏移
                  </label>
                  <NumberInput
                    integer
                    value={activeSegment.yearOffset}
                    onChange={(yearOffset) =>
                      updateActiveSegment({ ...activeSegment, yearOffset })
                    }
                    className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono outline-none focus:border-[#0066FF]"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] mb-0.5">
                    月偏移
                  </label>
                  <NumberInput
                    integer
                    value={activeSegment.monthOffset}
                    onChange={(monthOffset) =>
                      updateActiveSegment({ ...activeSegment, monthOffset })
                    }
                    className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono outline-none focus:border-[#0066FF]"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] mb-0.5">
                    天偏移
                  </label>
                  <NumberInput
                    integer
                    value={activeSegment.dayOffset}
                    onChange={(dayOffset) =>
                      updateActiveSegment({ ...activeSegment, dayOffset })
                    }
                    className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono outline-none focus:border-[#0066FF]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSegment.type === 'time' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-600 font-medium text-[11px]">
                  时间格式 (Time Format)
                </label>
                <label className="flex items-center gap-1 text-[#0066FF] cursor-pointer font-medium text-[11px]">
                  <input
                    type="checkbox"
                    checked={activeSegment.realTime}
                    onChange={(e) =>
                      updateActiveSegment({
                        ...activeSegment,
                        realTime: e.target.checked,
                      })
                    }
                    className="rounded text-[#0066FF]"
                  />
                  <span>实时时间</span>
                </label>
              </div>
              <input
                type="text"
                value={activeSegment.format}
                onChange={(e) =>
                  updateActiveSegment({
                    ...activeSegment,
                    format: e.target.value,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 text-xs outline-none focus:border-[#0066FF] font-mono"
              />
              <div>
                <label className="block text-slate-600 font-medium text-[11px] mb-1">
                  分钟偏移 (Minute Offset)
                </label>
                <NumberInput
                  integer
                  value={activeSegment.minuteOffset}
                  onChange={(minuteOffset) =>
                    updateActiveSegment({ ...activeSegment, minuteOffset })
                  }
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono outline-none focus:border-[#0066FF]"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={addField}
            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#0066FF] rounded-md border border-blue-200 font-medium text-[11px] flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>添加拼接数据段 (Add Field)</span>
          </button>
        </div>
      </div>
    </InspectorSection>
  );
};
