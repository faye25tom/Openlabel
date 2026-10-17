import React, { useRef } from 'react';
import { LabelElement, LabelProject, PaperSetup } from '../types/model';
import { SAMPLE_TEMPLATES } from '../data/sampleTemplates';
import { SignedCoordinateInput } from './RightInspector';
import { NumberInput } from './NumberInput';

interface TopToolbarProps {
  project: LabelProject;
  tabs: { id: string; name: string }[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onCloseTab: (id: string) => void;
  onNew: () => void;
  onOpenProject: (proj: LabelProject) => void;
  onSaveProject: () => void;
  onPrint: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  selectedElement: LabelElement | null;
  onDeleteElement: () => void;
  onOpenLabelSetup: () => void;
  onRotateLabel: () => void;
  onStepDatabase: (delta: number) => void;
  onUpdateElementBounds: (id: string, xMm: number, yMm: number, widthMm: number, heightMm: number) => void;
  onUpdateSelectedFont?: (updater: (font: any) => any) => void;
  onToggleLockElement?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onLoadTemplate: (templateId: string) => void;
  onOpenRustArchitecture: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  project,
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onNew,
  onOpenProject,
  onSaveProject,
  onPrint,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  selectedElement,
  onDeleteElement,
  onOpenLabelSetup,
  onRotateLabel,
  onStepDatabase,
  onUpdateElementBounds,
  onLoadTemplate,
  onOpenRustArchitecture,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          if (parsed && parsed.paper && parsed.elements) {
            onOpenProject(parsed);
          }
        } catch (err) {
          console.error('Invalid .olabel project file', err);
        }
      };
      reader.readAsText(file);
    }
  };

  const dbRowsCount = project.database?.rows?.length || 0;
  const currentRecordDisplay = dbRowsCount > 0 ? `${project.currentRecordIndex + 1} / ${dbRowsCount}` : 'No DB';

  return (
    <header className="w-full bg-white border-b border-slate-200 select-none z-20 flex flex-col text-slate-800 shrink-0">
      {/* Hidden file input for Open */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".olabel,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Row 1: Brand Wordmark + Document Tabs + System Menu */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-[#fafafa]">
        <div className="flex items-center gap-3">
          {/* Brand Wordmark (matching Top Bar contract: single element, no pills) */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-bold text-sm tracking-tight text-[#0084ff]">
              OpenLabel
            </span>
            <span className="text-slate-400 text-xs">/</span>
            <span className="text-xs font-medium text-slate-600">
              Industrial Studio
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-200" />

          {/* Document Tabs Bar */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`group flex items-center gap-2 px-3 py-1 rounded-t-md text-xs font-medium cursor-pointer transition-colors border-b-2 ${
                    isActive
                      ? 'bg-white text-slate-900 border-sky-500 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-200/50'
                  }`}
                >
                  <span className="text-[11px]">📄</span>
                  <span className="truncate max-w-[120px]">{tab.name}</span>
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseTab(tab.id);
                      }}
                      className="text-slate-400 hover:text-rose-500 text-xs rounded-full w-3.5 h-3.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={onAddTab}
              className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded transition-colors"
              title="New Tab"
            >
              +
            </button>
          </div>
        </div>

        {/* Right Quick Links */}
        <div className="flex items-center gap-2 text-xs">
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                onLoadTemplate(e.target.value);
                e.target.value = '';
              }
            }}
            className="px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-700 outline-none hover:border-slate-300"
          >
            <option value="" disabled>
              Load Preset Template...
            </option>
            {SAMPLE_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenRustArchitecture}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded transition-colors flex items-center gap-1 cursor-pointer"
            title="Inspect Pure Safe Rust & MCP Clean-Room Architecture"
          >
            <span className="text-amber-600">🦀</span>
            <span>Rust & MCP Spec</span>
          </button>
        </div>
      </div>

      {/* Row 2: Main Action Buttons + Geometry Inputs */}
      <div className="flex items-center justify-between px-3 py-1.5 gap-2 overflow-x-auto text-xs">
        <div className="flex items-center gap-1 shrink-0">
          <ToolbarButton icon="➕" label="New" onClick={onNew} />
          <ToolbarButton
            icon="📂"
            label="Open"
            onClick={() => fileInputRef.current?.click()}
          />
          <ToolbarButton icon="💾" label="Save" onClick={onSaveProject} />
          <ToolbarButton
            icon="🖨"
            label="Print"
            primary
            onClick={onPrint}
          />

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          <ToolbarButton
            icon="↩"
            label="Undo"
            disabled={!canUndo}
            onClick={onUndo}
          />
          <ToolbarButton
            icon="↪"
            label="Redo"
            disabled={!canRedo}
            onClick={onRedo}
          />
          <ToolbarButton
            icon="🗑"
            label="Delete"
            disabled={!selectedElement}
            onClick={onDeleteElement}
          />

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          <ToolbarButton
            icon="⚙"
            label="Label Setup"
            onClick={onOpenLabelSetup}
          />
          <ToolbarButton
            icon="🔄"
            label="Label Rotate"
            onClick={onRotateLabel}
          />

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          {/* Database Stepper Navigation */}
          <div className="flex items-center gap-1 px-1 bg-slate-50 border border-slate-200 rounded">
            <button
              onClick={() => onStepDatabase(-999999)}
              disabled={dbRowsCount === 0}
              className="px-1.5 py-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
              title="First Record"
            >
              ⏮
            </button>
            <button
              onClick={() => onStepDatabase(-1)}
              disabled={dbRowsCount === 0}
              className="px-1.5 py-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
              title="Previous Record"
            >
              ◀
            </button>
            <span className="font-mono text-[11px] text-slate-700 px-1 font-medium min-w-[50px] text-center">
              {currentRecordDisplay}
            </span>
            <button
              onClick={() => onStepDatabase(1)}
              disabled={dbRowsCount === 0}
              className="px-1.5 py-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
              title="Next Record"
            >
              ▶
            </button>
            <button
              onClick={() => onStepDatabase(999999)}
              disabled={dbRowsCount === 0}
              className="px-1.5 py-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
              title="Last Record"
            >
              ⏭
            </button>
          </div>
        </div>

        {/* Selected Element Physical Dimension Inputs (Matching Ref 4 top right) */}
        {selectedElement && (
          <div className="flex items-center gap-3 shrink-0 bg-slate-50 px-2.5 py-1 border border-slate-200 rounded">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Width</span>
              <NumberInput
                step={0.1}
                min={0.1}
                value={selectedElement.widthMm}
                onChange={(widthMm) =>
                  onUpdateElementBounds(
                    selectedElement.id,
                    selectedElement.xMm,
                    selectedElement.yMm,
                    widthMm,
                    selectedElement.heightMm
                  )
                }
                className="w-14 px-1 py-0.5 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono"
              />
              <span className="text-slate-400 text-[10px]">mm</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Height</span>
              <NumberInput
                step={0.1}
                min={0.1}
                value={selectedElement.heightMm}
                onChange={(heightMm) =>
                  onUpdateElementBounds(
                    selectedElement.id,
                    selectedElement.xMm,
                    selectedElement.yMm,
                    selectedElement.widthMm,
                    heightMm
                  )
                }
                className="w-14 px-1 py-0.5 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono"
              />
              <span className="text-slate-400 text-[10px]">mm</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">X</span>
              <SignedCoordinateInput
                value={selectedElement.xMm}
                onChange={(nx) =>
                  onUpdateElementBounds(
                    selectedElement.id,
                    nx,
                    selectedElement.yMm,
                    selectedElement.widthMm,
                    selectedElement.heightMm
                  )
                }
                className="w-14 px-1 py-0.5 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono"
              />
              <span className="text-slate-400 text-[10px]">mm</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Y</span>
              <SignedCoordinateInput
                value={selectedElement.yMm}
                onChange={(ny) =>
                  onUpdateElementBounds(
                    selectedElement.id,
                    selectedElement.xMm,
                    ny,
                    selectedElement.widthMm,
                    selectedElement.heightMm
                  )
                }
                className="w-14 px-1 py-0.5 bg-white border border-slate-300 rounded text-slate-800 text-xs font-mono"
              />
              <span className="text-slate-400 text-[10px]">mm</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

function ToolbarButton({
  icon,
  label,
  primary = false,
  disabled = false,
  onClick,
}: {
  icon: string;
  label: string;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
        primary
          ? 'bg-[#0084ff] hover:bg-[#0073e6] text-white shadow-xs'
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60 bg-white'
      }`}
    >
      <span className="text-xs">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
