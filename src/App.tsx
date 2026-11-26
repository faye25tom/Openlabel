import React, { useState } from 'react';
import { createIconElement } from './data/elementFactory';
import { useLabelWorkspace } from './state/useLabelWorkspace';
import { TopToolbar } from './components/layout/TopToolbar';
import { LeftToolbox } from './components/layout/LeftToolbox';
import { StatusBar } from './components/layout/StatusBar';
import { CanvasArea } from './components/canvas/CanvasArea';
import { RightInspector } from './components/inspector/RightInspector';
import { NewLabelModal } from './components/modals/NewLabelModal';
import { PrintDialog } from './components/modals/PrintDialog';
import { DatabaseManagerModal } from './components/modals/DatabaseManagerModal';
import { IconPickerModal } from './components/modals/IconPickerModal';
import { OcrModal } from './components/modals/OcrModal';
import { RustArchitectureModal } from './components/modals/RustArchitectureModal';
import { BarcodePickerModal } from './components/modals/BarcodePickerModal';

export default function App() {
  const [showPaperModal, setShowPaperModal] = useState<boolean>(false);
  const [showPrintDialog, setShowPrintDialog] = useState<boolean>(false);
  const [showDatabaseManager, setShowDatabaseManager] = useState<boolean>(false);
  const [showIconPicker, setShowIconPicker] = useState<boolean>(false);
  const [showOcrModal, setShowOcrModal] = useState<boolean>(false);
  const [showRustModal, setShowRustModal] = useState<boolean>(false);
  const [showBarcodePickerModal, setShowBarcodePickerModal] = useState<boolean>(false);

  const [cursorMm, setCursorMm] = useState<[number, number]>([0, 0]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('Microsoft Print to PDF');

  const workspace = useLabelWorkspace({
    onRequestPrint: () => setShowPrintDialog(true),
  });

  const { currentTab, project, selectedElement } = workspace;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#dfe4ec] text-slate-800">
      <TopToolbar
        project={project}
        tabs={workspace.tabs.map((t) => ({ id: t.id, name: t.name }))}
        activeTabId={workspace.activeTabId}
        onSelectTab={workspace.setActiveTabId}
        onAddTab={workspace.handleAddTab}
        onCloseTab={workspace.handleCloseTab}
        onNew={() => setShowPaperModal(true)}
        onOpenProject={workspace.handleOpenProject}
        onSaveProject={workspace.handleSaveProject}
        onPrint={() => setShowPrintDialog(true)}
        canUndo={currentTab.history.length > 0}
        canRedo={currentTab.redoStack.length > 0}
        onUndo={workspace.handleUndo}
        onRedo={workspace.handleRedo}
        selectedElement={selectedElement}
        onDeleteElement={() =>
          selectedElement && workspace.handleDeleteElement(selectedElement.id)
        }
        onOpenLabelSetup={() => setShowPaperModal(true)}
        onRotateLabel={workspace.handleRotateLabel}
        onStepDatabase={workspace.handleStepDatabase}
        onUpdateElementBounds={workspace.handleUpdateElementBounds}
        onLoadTemplate={workspace.handleLoadTemplate}
        onOpenRustArchitecture={() => setShowRustModal(true)}
      />

      <div className="flex-1 flex overflow-hidden relative min-h-0">
        <LeftToolbox
          elements={project.elements}
          selectedElementId={currentTab.selectedElementId}
          onSelectElement={workspace.handleSelectElement}
          onToggleLockElement={workspace.handleToggleLockElement}
          onDeleteElement={workspace.handleDeleteElement}
          onAddElement={workspace.handleAddElement}
          onOpenDatabaseManager={() => setShowDatabaseManager(true)}
          onOpenOcrModal={() => setShowOcrModal(true)}
          onOpenIconPicker={() => setShowIconPicker(true)}
          onOpenBarcodePicker={() => setShowBarcodePickerModal(true)}
        />

        <CanvasArea
          project={project}
          selectedElementId={currentTab.selectedElementId}
          onSelectElement={workspace.handleSelectElement}
          onUpdateElementBounds={workspace.handleUpdateElementBounds}
          onUpdateElementBoundsTransient={workspace.handleUpdateElementBoundsTransient}
          onPushHistorySnapshot={workspace.pushHistorySnapshot}
          onDeleteElement={workspace.handleDeleteElement}
          zoom={currentTab.zoom}
          onZoomChange={workspace.handleSetZoom}
          onCursorMove={(xMm, yMm) => setCursorMm([xMm, yMm])}
          onUpdateTableCell={workspace.handleUpdateTableCell}
        />

        <RightInspector
          project={project}
          selectedElementId={currentTab.selectedElementId}
          onUpdatePaper={workspace.handleUpdatePaper}
          onOpenPaperModal={() => setShowPaperModal(true)}
          onOpenBarcodePicker={() => setShowBarcodePickerModal(true)}
          onUpdateElementKind={workspace.handleUpdateElementKind}
          onUpdateElementBounds={workspace.handleUpdateElementBounds}
          onToggleLockElement={workspace.handleToggleLockElement}
          onDeleteElement={workspace.handleDeleteElement}
        />
      </div>

      <StatusBar
        project={project}
        selectedPrinter={selectedPrinter}
        onChangePrinter={setSelectedPrinter}
        cursorMm={cursorMm}
        zoom={currentTab.zoom}
      />

      {/* Modals */}
      <NewLabelModal
        isOpen={showPaperModal}
        initialPaper={project.paper}
        initialName={project.name}
        onClose={() => setShowPaperModal(false)}
        onConfirm={workspace.handleUpdatePaperWithName}
      />

      <PrintDialog
        isOpen={showPrintDialog}
        project={project}
        onClose={() => setShowPrintDialog(false)}
      />

      <DatabaseManagerModal
        isOpen={showDatabaseManager}
        currentDatabase={project.database}
        onClose={() => setShowDatabaseManager(false)}
        onApplyDatabase={workspace.handleApplyDatabase}
      />

      <IconPickerModal
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelectIcon={(iconName) => workspace.handleAddElement(createIconElement(iconName))}
      />

      <OcrModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        onAddRecognizedElement={workspace.handleAddElement}
      />

      <RustArchitectureModal
        isOpen={showRustModal}
        onClose={() => setShowRustModal(false)}
      />

      <BarcodePickerModal
        isOpen={showBarcodePickerModal}
        activeSymbology={
          selectedElement && selectedElement.kind.type === 'barcode'
            ? selectedElement.kind.symbology
            : 'code128'
        }
        onClose={() => setShowBarcodePickerModal(false)}
        onSelectSymbology={workspace.handleSelectBarcodeSymbology}
      />
    </div>
  );
}
