import React, { useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Cpu,
  FilePlus2,
  FileText,
  FolderOpen,
  Plus,
  Printer,
  Redo2,
  RotateCw,
  Save,
  SlidersHorizontal,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { LabelElement, LabelProject } from '../../types/model';
import { SAMPLE_TEMPLATES } from '../../data/sampleTemplates';
import { NumberInput, SignedCoordinateInput } from '../ui/NumberInput';

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
  onUpdateElementBounds: (
    id: string,
    xMm: number,
    yMm: number,
    widthMm: number,
    heightMm: number,
  ) => void;
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
    e.target.value = '';
  };

  const dbRowsCount = project.database?.rows?.length || 0;
  const currentRecordDisplay =
    dbRowsCount > 0 ? `${project.currentRecordIndex + 1} / ${dbRowsCount}` : '无数据源';

  return (
    <header className="no-print w-full bg-white border-b border-slate-200 select-none z-30 flex flex-col text-slate-800 shrink-0">
      <input
        type="file"
        ref={fileInputRef}
        accept=".olabel,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Row 1: Brand Emblem + Document Tabs + Templates & Rust Spec */}
      <div className="h-9 flex items-center justify-between px-3 border-b border-slate-200/80 bg-[#f8fafc] gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Geometric Studio Emblem */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#0f172a] to-[#0f766e] flex items-center justify-center shadow-xs">
              <div className="w-3.5 h-2.5 rounded-[2px] bg-white flex items-center justify-center gap-[1.5px] px-[2px]">
                <span className="w-[1.5px] h-1.5 bg-slate-900" />
                <span className="w-[1px] h-1.5 bg-slate-900" />
                <span className="w-[2px] h-1.5 bg-slate-900" />
                <span className="w-[1px] h-1.5 bg-slate-900" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="font-bold text-[13px] tracking-tight text-slate-900">
                OpenLabel
              </span>
              <span className="text-[11px] font-medium text-slate-500">Studio</span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 shrink-0" />

          {/* Document Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto min-w-0">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`group flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium cursor-pointer transition-all shrink-0 ${
                    isActive
                      ? 'bg-white text-slate-900 border border-slate-200/90 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border border-transparent'
                  }`}
                >
                  <FileText
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-[#0066FF]' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate max-w-[130px]">{tab.name}</span>
                  {tabs.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseTab(tab.id);
                      }}
                      title="关闭标签页"
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={onAddTab}
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition-colors shrink-0"
              title="新建标签页"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Quick Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                onLoadTemplate(e.target.value);
                e.target.value = '';
              }
            }}
            className="h-7 px-2.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 outline-none hover:border-slate-300 focus:border-[#0066FF] transition-colors"
          >
            <option value="" disabled>
              加载行业预设模板...
            </option>
            {SAMPLE_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenRustArchitecture}
            className="h-7 px-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-md transition-colors flex items-center gap-1.5"
            title="Inspect Pure Safe Rust & MCP Clean-Room Architecture"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-600" />
            <span>Rust &amp; MCP Spec</span>
          </button>
        </div>
      </div>

      {/* Row 2: Studio Action Ribbon + Geometry HUD */}
      <div className="h-10 flex items-center justify-between px-3 gap-2 overflow-x-auto bg-white">
        <div className="flex items-center gap-1.5 shrink-0">
          <ToolbarButton
            icon={<FilePlus2 className="w-3.5 h-3.5" />}
            label="新建"
            onClick={onNew}
            title="新建或重设标签尺寸"
          />
          <ToolbarButton
            icon={<FolderOpen className="w-3.5 h-3.5" />}
            label="打开"
            onClick={() => fileInputRef.current?.click()}
            title="打开 .olabel 工程文件"
          />
          <ToolbarButton
            icon={<Save className="w-3.5 h-3.5" />}
            label="保存"
            onClick={onSaveProject}
            title="导出为 .olabel 文件 (Ctrl+S)"
          />
          <ToolbarButton
            icon={<Printer className="w-3.5 h-3.5" />}
            label="打印 Print"
            primary
            onClick={onPrint}
            title="打开打印工作站与 TSPL2/ZPL II 编译器 (Ctrl+P)"
          />

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          <ToolbarIconButton
            icon={<Undo2 className="w-3.5 h-3.5" />}
            label="撤销"
            disabled={!canUndo}
            onClick={onUndo}
            title="撤销 (Ctrl+Z)"
          />
          <ToolbarIconButton
            icon={<Redo2 className="w-3.5 h-3.5" />}
            label="重做"
            disabled={!canRedo}
            onClick={onRedo}
            title="重做 (Ctrl+Y)"
          />
          <ToolbarIconButton
            icon={<Trash2 className="w-3.5 h-3.5" />}
            label="删除"
            disabled={!selectedElement || selectedElement.locked}
            onClick={onDeleteElement}
            danger
            title="删除选中元素 (Delete)"
          />

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          <ToolbarButton
            icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            label="标签设置"
            onClick={onOpenLabelSetup}
          />
          <ToolbarButton
            icon={<RotateCw className="w-3.5 h-3.5" />}
            label="旋转 90°"
            onClick={onRotateLabel}
          />

          <div className="h-4 w-[1px] bg-slate-200 mx-1" />

          {/* Database Record Stepper */}
          <div className="flex items-center gap-0.5 px-1 h-7 bg-slate-50 border border-slate-200 rounded-md">
            <button
              type="button"
              onClick={() => onStepDatabase(-999999)}
              disabled={dbRowsCount === 0}
              className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200/60"
              title="首条记录"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onStepDatabase(-1)}
              disabled={dbRowsCount === 0}
              className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200/60"
              title="上一条记录"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono tabular-nums text-[11px] text-slate-700 px-1.5 font-medium min-w-[54px] text-center">
              {currentRecordDisplay}
            </span>
            <button
              type="button"
              onClick={() => onStepDatabase(1)}
              disabled={dbRowsCount === 0}
              className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200/60"
              title="下一条记录"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onStepDatabase(999999)}
              disabled={dbRowsCount === 0}
              className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-200/60"
              title="末条记录"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Selected Element Compact Geometry HUD */}
        {selectedElement && (
          <div className="flex items-center gap-2 shrink-0 bg-slate-50 px-2 py-1 border border-slate-200 rounded-md">
            <HudField label="W">
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
                    selectedElement.heightMm,
                  )
                }
                className="w-13 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-slate-800 text-[11px] font-mono tabular-nums outline-none focus:border-[#0066FF]"
              />
            </HudField>
            <HudField label="H">
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
                    heightMm,
                  )
                }
                className="w-13 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-slate-800 text-[11px] font-mono tabular-nums outline-none focus:border-[#0066FF]"
              />
            </HudField>
            <HudField label="X">
              <SignedCoordinateInput
                value={selectedElement.xMm}
                onChange={(nx) =>
                  onUpdateElementBounds(
                    selectedElement.id,
                    nx,
                    selectedElement.yMm,
                    selectedElement.widthMm,
                    selectedElement.heightMm,
                  )
                }
                className="w-13 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-slate-800 text-[11px] font-mono tabular-nums outline-none focus:border-[#0066FF]"
              />
            </HudField>
            <HudField label="Y">
              <SignedCoordinateInput
                value={selectedElement.yMm}
                onChange={(ny) =>
                  onUpdateElementBounds(
                    selectedElement.id,
                    selectedElement.xMm,
                    ny,
                    selectedElement.widthMm,
                    selectedElement.heightMm,
                  )
                }
                className="w-13 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-slate-800 text-[11px] font-mono tabular-nums outline-none focus:border-[#0066FF]"
              />
            </HudField>
          </div>
        )}
      </div>
    </header>
  );
};

function HudField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-slate-500 text-[10px] font-semibold">{label}</span>
      {children}
      <span className="text-slate-400 text-[10px] font-mono">mm</span>
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  primary = false,
  disabled = false,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-7 flex items-center gap-1.5 px-2.5 rounded-md text-xs font-medium transition-all disabled:opacity-35 disabled:cursor-not-allowed ${
        primary
          ? 'bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-xs font-semibold'
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 bg-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ToolbarIconButton({
  icon,
  label,
  disabled = false,
  danger = false,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      className={`h-7 flex items-center gap-1 px-2 rounded-md text-xs font-medium border border-slate-200/80 bg-white transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
        danger
          ? 'text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}
