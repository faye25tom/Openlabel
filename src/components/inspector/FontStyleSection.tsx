import React from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  FlipHorizontal2,
  Italic,
  MoveHorizontal,
  MoveVertical,
  Spline,
  Strikethrough,
  StretchHorizontal,
  Type,
  Underline,
} from 'lucide-react';
import { FontStyle, TextAlign, TextDirection } from '../../types/model';
import { FONT_FAMILIES } from '../../data/catalogs';
import { NumberInput } from '../ui/NumberInput';
import { InspectorSection, SegmentedControl } from '../ui/InspectorSection';

interface FontStyleSectionProps {
  font: FontStyle;
  onChangeFont: (font: FontStyle) => void;
}

export const FontStyleSection: React.FC<FontStyleSectionProps> = ({
  font,
  onChangeFont,
}) => {
  return (
    <InspectorSection title="字体与排版 (Typography)" icon={<Type className="w-3.5 h-3.5" />}>
      <div className="space-y-2.5">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <select
              value={font.family}
              onChange={(e) => onChangeFont({ ...font, family: e.target.value })}
              className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800 text-xs bg-white outline-none focus:border-[#0066FF]"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <NumberInput
              min={0.1}
              step={0.1}
              value={font.sizePt}
              onChange={(sizePt) => onChangeFont({ ...font, sizePt })}
              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono tabular-nums outline-none focus:border-[#0066FF]"
            />
          </div>
        </div>

        {/* Direction */}
        <SegmentedControl<TextDirection>
          value={font.direction}
          onChange={(direction) => onChangeFont({ ...font, direction })}
          size="xs"
          options={[
            {
              value: 'horizontal',
              label: (
                <>
                  <MoveHorizontal className="w-3 h-3" />
                  <span>横向</span>
                </>
              ),
            },
            {
              value: 'vertical',
              label: (
                <>
                  <MoveVertical className="w-3 h-3" />
                  <span>竖排</span>
                </>
              ),
            },
            {
              value: 'arc',
              label: (
                <>
                  <Spline className="w-3 h-3" />
                  <span>弧形</span>
                </>
              ),
            },
          ]}
        />

        {/* Alignment */}
        <div className="grid grid-cols-5 gap-1 p-0.5 bg-slate-200/65 rounded-md border border-slate-200/70">
          {(
            [
              { align: 'left', icon: <AlignLeft className="w-3.5 h-3.5" />, title: '左对齐' },
              { align: 'center', icon: <AlignCenter className="w-3.5 h-3.5" />, title: '居中' },
              { align: 'right', icon: <AlignRight className="w-3.5 h-3.5" />, title: '右对齐' },
              { align: 'justify', icon: <AlignJustify className="w-3.5 h-3.5" />, title: '两端对齐' },
              { align: 'distribute', icon: <StretchHorizontal className="w-3.5 h-3.5" />, title: '分散对齐' },
            ] as { align: TextAlign; icon: React.ReactNode; title: string }[]
          ).map((item) => (
            <button
              key={item.align}
              type="button"
              title={item.title}
              onClick={() => onChangeFont({ ...font, align: item.align })}
              className={`py-1 rounded flex items-center justify-center transition-colors ${
                font.align === item.align
                  ? 'bg-[#0066FF] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {item.icon}
            </button>
          ))}
        </div>

        {/* Word Space & Scale */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-slate-600 font-medium text-[11px] mb-1">
              字间距 (Word Space)
            </label>
            <div className="flex items-center gap-1">
              <NumberInput
                step={0.1}
                value={font.wordSpacePt}
                onChange={(wordSpacePt) => onChangeFont({ ...font, wordSpacePt })}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono tabular-nums"
              />
              <span className="text-slate-500 font-mono text-[10px]">pt</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-medium text-[11px] mb-1">
              横向缩放 (Scale)
            </label>
            <div className="flex items-center gap-1">
              <NumberInput
                min={1}
                max={1000}
                step={1}
                value={font.scalePercent}
                onChange={(scalePercent) => onChangeFont({ ...font, scalePercent })}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono tabular-nums"
              />
              <span className="text-slate-500 font-mono text-[10px]">%</span>
            </div>
          </div>
        </div>

        {/* 6 Style Modifiers */}
        <div className="grid grid-cols-6 gap-1 pt-0.5">
          {[
            {
              key: 'bold',
              icon: <Bold className="w-3.5 h-3.5" />,
              active: font.bold,
              title: '加粗 (Bold)',
            },
            {
              key: 'italic',
              icon: <Italic className="w-3.5 h-3.5" />,
              active: font.italic,
              title: '斜体 (Italic)',
            },
            {
              key: 'underline',
              icon: <Underline className="w-3.5 h-3.5" />,
              active: font.underline,
              title: '下划线 (Underline)',
            },
            {
              key: 'strikethrough',
              icon: <Strikethrough className="w-3.5 h-3.5" />,
              active: font.strikethrough,
              title: '删除线 (Strikethrough)',
            },
            {
              key: 'mirrorHorizontal',
              icon: <FlipHorizontal2 className="w-3.5 h-3.5" />,
              active: font.mirrorHorizontal,
              title: '水平镜像 (Mirror)',
            },
            {
              key: 'reverseVideo',
              icon: <span className="text-[10px] font-bold font-mono">反</span>,
              active: font.reverseVideo,
              title: '黑底白字反白 (Reverse Video)',
            },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() =>
                onChangeFont({
                  ...font,
                  [item.key]: !item.active,
                })
              }
              title={item.title}
              className={`h-7 rounded border flex items-center justify-center transition-all ${
                item.active
                  ? 'bg-[#0066FF] border-[#0066FF] text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>
    </InspectorSection>
  );
};
