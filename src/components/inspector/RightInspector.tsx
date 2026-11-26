import React, { useState } from 'react';
import { Lock, Trash2, Unlock } from 'lucide-react';
import { LabelElement, LabelProject, PaperSetup } from '../../types/model';
import { PaperInspector } from './PaperInspector';
import { GeometrySection } from './GeometrySection';
import { BarcodeSection } from './BarcodeSection';
import { QrCodeSection } from './QrCodeSection';
import { GraphSection } from './GraphSection';
import { TableSection } from './TableSection';
import { IconSection } from './IconSection';
import { ImageSection } from './ImageSection';
import { ContentSection } from './ContentSection';
import { FontStyleSection } from './FontStyleSection';
import { PromptSection } from './PromptSection';

interface RightInspectorProps {
  project: LabelProject;
  selectedElementId: string | null;
  onUpdatePaper: (paper: PaperSetup) => void;
  onOpenPaperModal: () => void;
  onUpdateElementKind: (elementId: string, kind: LabelElement['kind']) => void;
  onUpdateElementBounds: (
    elementId: string,
    xMm: number,
    yMm: number,
    widthMm: number,
    heightMm: number,
  ) => void;
  onToggleLockElement: (elementId: string) => void;
  onDeleteElement: (elementId: string) => void;
  onOpenBarcodePicker?: () => void;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  project,
  selectedElementId,
  onUpdatePaper,
  onOpenPaperModal,
  onUpdateElementKind,
  onUpdateElementBounds,
  onToggleLockElement,
  onDeleteElement,
  onOpenBarcodePicker,
}) => {
  const [isAspectLocked, setIsAspectLocked] = useState(true);
  const selectedElement = project.elements.find((e) => e.id === selectedElementId);

  if (!selectedElement) {
    return (
      <PaperInspector
        paper={project.paper}
        onUpdatePaper={onUpdatePaper}
        onOpenPaperModal={onOpenPaperModal}
      />
    );
  }

  return (
    <aside className="no-print w-80 h-full bg-white border-l border-slate-200 overflow-y-auto flex flex-col text-slate-800 shrink-0 select-none text-xs">
      {/* Selected Element Header */}
      <div className="px-3.5 py-2.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70 shrink-0">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
            <span className="truncate">{selectedElement.name}</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono tabular-nums">
            {selectedElement.widthMm} × {selectedElement.heightMm} mm · #{selectedElement.id.slice(0, 6)}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onToggleLockElement(selectedElement.id)}
            title={selectedElement.locked ? '解锁图元' : '锁定图元'}
            className={`p-1.5 rounded border transition-colors ${
              selectedElement.locked
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            {selectedElement.locked ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            disabled={selectedElement.locked}
            onClick={() => onDeleteElement(selectedElement.id)}
            title="删除图元"
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        <GeometrySection
          element={selectedElement}
          paper={project.paper}
          isAspectLocked={isAspectLocked}
          onToggleAspectLock={() => {
            const nextLock = !isAspectLocked;
            setIsAspectLocked(nextLock);
            if (selectedElement.kind.type === 'qrcode') {
              onUpdateElementKind(selectedElement.id, {
                ...selectedElement.kind,
                lockAspectRatio: nextLock,
              });
            } else if (selectedElement.kind.type === 'image') {
              onUpdateElementKind(selectedElement.id, {
                ...selectedElement.kind,
                aspectRatioLock: nextLock,
              });
            }
          }}
          onUpdateBounds={onUpdateElementBounds}
        />

        {selectedElement.kind.type === 'barcode' && (
          <BarcodeSection
            element={selectedElement}
            kind={selectedElement.kind}
            onChangeKind={(newKind) => onUpdateElementKind(selectedElement.id, newKind)}
            onOpenBarcodePicker={onOpenBarcodePicker}
          />
        )}

        {selectedElement.kind.type === 'qrcode' && (
          <QrCodeSection
            element={selectedElement}
            kind={selectedElement.kind}
            onChangeKind={(newKind) => onUpdateElementKind(selectedElement.id, newKind)}
            onUpdateBounds={onUpdateElementBounds}
            onSetAspectLock={setIsAspectLocked}
          />
        )}

        {selectedElement.kind.type === 'graph' && (
          <GraphSection
            kind={selectedElement.kind}
            onChangeKind={(newKind) => onUpdateElementKind(selectedElement.id, newKind)}
          />
        )}

        {selectedElement.kind.type === 'table' && (
          <TableSection
            kind={selectedElement.kind}
            onChangeKind={(newKind) => onUpdateElementKind(selectedElement.id, newKind)}
          />
        )}

        {selectedElement.kind.type === 'icon' && (
          <IconSection
            kind={selectedElement.kind}
            onChangeKind={(newKind) => onUpdateElementKind(selectedElement.id, newKind)}
          />
        )}

        {selectedElement.kind.type === 'image' && (
          <ImageSection
            kind={selectedElement.kind}
            onChangeKind={(newKind) => onUpdateElementKind(selectedElement.id, newKind)}
            onSetAspectLock={setIsAspectLocked}
          />
        )}

        {'segments' in selectedElement.kind && (
          <ContentSection
            element={selectedElement}
            project={project}
            onChangeKind={(newKind) => onUpdateElementKind(selectedElement.id, newKind)}
          />
        )}

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
      </div>
    </aside>
  );
};
