import React from 'react';
import { MessageSquareQuote } from 'lucide-react';
import { PromptConfig } from '../../types/model';
import { InspectorSection } from '../ui/InspectorSection';

interface PromptSectionProps {
  prompt: PromptConfig;
  onChangePrompt: (prompt: PromptConfig) => void;
}

export const PromptSection: React.FC<PromptSectionProps> = ({
  prompt,
  onChangePrompt,
}) => {
  return (
    <InspectorSection
      title="打印交互与共享字段 (Prompt)"
      icon={<MessageSquareQuote className="w-3.5 h-3.5" />}
    >
      <div className="space-y-2.5">
        <div>
          <label className="block text-slate-600 font-medium text-[11px] mb-1">
            共享字段名 (Shared Field)
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
            placeholder="输入或绑定共享字段标识"
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:border-[#0066FF] outline-none"
          />
        </div>

        <div className="pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium text-xs">
            <input
              type="checkbox"
              checked={prompt.printTimeInput}
              onChange={(e) =>
                onChangePrompt({
                  ...prompt,
                  printTimeInput: e.target.checked,
                })
              }
              className="rounded text-[#0066FF] w-3.5 h-3.5"
            />
            <span>打印时即时输入 (Print-time Input)</span>
          </label>
          {prompt.printTimeInput && (
            <div className="mt-2 pl-5">
              <input
                type="text"
                value={prompt.promptHint}
                onChange={(e) =>
                  onChangePrompt({ ...prompt, promptHint: e.target.value })
                }
                placeholder="提示语 (如: 请扫描操作员工号)"
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:border-[#0066FF] outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </InspectorSection>
  );
};
