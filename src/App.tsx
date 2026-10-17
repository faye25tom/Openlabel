import React, { useState, useCallback } from 'react';
import {
  BarcodeSymbology,
  DEFAULT_FONT,
  DEFAULT_PAPER,
  DEFAULT_PROMPT,
  DataTable,
  LabelElement,
  LabelProject,
  PaperSetup,
} from './types/model';
import { SAMPLE_DATABASE, SAMPLE_TEMPLATES } from './data/sampleTemplates';
import { TopToolbar } from './components/TopToolbar';
import { LeftToolbox } from './components/LeftToolbox';
import { CanvasArea } from './components/CanvasArea';
import { RightInspector } from './components/RightInspector';
import { NewLabelModal } from './components/NewLabelModal';
import { PrintDialog } from './components/PrintDialog';
import { DatabaseManagerModal } from './components/DatabaseManagerModal';
import { IconPickerModal } from './components/IconPickerModal';
import { OcrModal } from './components/OcrModal';
import { RustArchitectureModal } from './components/RustArchitectureModal';
import { BarcodePickerModal } from './components/BarcodePickerModal';

interface TabState {
  id: string;
  name: string;
  project: LabelProject;
  history: LabelProject[];
  redoStack: LabelProject[];
  selectedElementId: string | null;
  zoom: number;
}

export default function App() {
  // Initialize with the standard product template
  const initialProject = SAMPLE_TEMPLATES[0].project;

  const [tabs, setTabs] = useState<TabState[]>([
    {
      id: 'tab-1',
      name: 'New Label1',
      project: initialProject,
      history: [],
      redoStack: [],
      selectedElementId: initialProject.elements[0]?.id || null,
      zoom: 1.0,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');

  // Modals state
  const [showPaperModal, setShowPaperModal] = useState<boolean>(false);
  const [showPrintDialog, setShowPrintDialog] = useState<boolean>(false);
  const [showDatabaseManager, setShowDatabaseManager] = useState<boolean>(false);
  const [showIconPicker, setShowIconPicker] = useState<boolean>(false);
  const [showOcrModal, setShowOcrModal] = useState<boolean>(false);
  const [showRustModal, setShowRustModal] = useState<boolean>(false);
  const [showBarcodePickerModal, setShowBarcodePickerModal] = useState<boolean>(false);

  // Status bar cursor coordinates in mm
  const [cursorMm, setCursorMm] = useState<[number, number]>([0, 0]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('Microsoft Print to PDF');

  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const project = currentTab.project;
  const selectedElement = project.elements.find((e) => e.id === currentTab.selectedElementId) || null;

  // Helper to commit state change into history
  const commitProjectChange = useCallback(
    (newProject: LabelProject, newSelectedId?: string | null) => {
      setTabs((prevTabs) =>
        prevTabs.map((t) => {
          if (t.id === activeTabId) {
            return {
              ...t,
              history: [...t.history.slice(-30), t.project],
              redoStack: [],
              project: newProject,
              selectedElementId:
                newSelectedId !== undefined ? newSelectedId : t.selectedElementId,
            };
          }
          return t;
        })
      );
    },
    [activeTabId]
  );

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    setTabs((prevTabs) =>
      prevTabs.map((t) => {
        if (t.id === activeTabId && t.history.length > 0) {
          const prev = t.history[t.history.length - 1];
          const newHistory = t.history.slice(0, -1);
          return {
            ...t,
            history: newHistory,
            redoStack: [t.project, ...t.redoStack],
            project: prev,
          };
        }
        return t;
      })
    );
  }, [activeTabId]);

  const handleRedo = useCallback(() => {
    setTabs((prevTabs) =>
      prevTabs.map((t) => {
        if (t.id === activeTabId && t.redoStack.length > 0) {
          const next = t.redoStack[0];
          const newRedo = t.redoStack.slice(1);
          return {
            ...t,
            history: [...t.history, t.project],
            redoStack: newRedo,
            project: next,
          };
        }
        return t;
      })
    );
  }, [activeTabId]);

  // Tab management
  const handleAddTab = () => {
    const newId = `tab-${Date.now()}`;
    const newName = `New Label${tabs.length + 1}`;
    const newProj: LabelProject = {
      id: `proj-${Date.now()}`,
      name: newName,
      paper: { ...DEFAULT_PAPER },
      elements: [
        {
          id: `el-text-${Date.now()}`,
          name: 'Text',
          xMm: 10,
          yMm: 12,
          widthMm: 45,
          heightMm: 8,
          locked: false,
          kind: {
            type: 'text',
            segments: [{ type: 'constant', text: 'Double click to input content' }],
            activeSegmentIdx: 0,
            font: { ...DEFAULT_FONT },
            prompt: { ...DEFAULT_PROMPT },
          },
        },
      ],
      currentRecordIndex: 0,
      sharedFields: {},
    };
    setTabs((prev) => [
      ...prev,
      {
        id: newId,
        name: newName,
        project: newProj,
        history: [],
        redoStack: [],
        selectedElementId: newProj.elements[0].id,
        zoom: 1.0,
      },
    ]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id: string) => {
    if (tabs.length <= 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[0].id);
    }
  };

  // Element bounds updates - Free placement allowed at any coordinates
  const handleUpdateElementBounds = (
    id: string,
    xMm: number,
    yMm: number,
    widthMm: number,
    heightMm: number
  ) => {
    const newElements = project.elements.map((el) => {
      if (el.id === id) {
        return {
          ...el,
          xMm: Number(xMm.toFixed(1)),
          yMm: Number(yMm.toFixed(1)),
          widthMm: Math.max(1, Number(widthMm.toFixed(1))),
          heightMm: Math.max(1, Number(heightMm.toFixed(1))),
        };
      }
      return el;
    });
    commitProjectChange({ ...project, elements: newElements });
  };

  // Add Element
  const handleAddElement = (element: LabelElement) => {
    commitProjectChange(
      {
        ...project,
        elements: [...project.elements, element],
      },
      element.id
    );
  };

  // Delete Element
  const handleDeleteElement = (id: string) => {
    const newElements = project.elements.filter((el) => el.id !== id);
    commitProjectChange(
      {
        ...project,
        elements: newElements,
      },
      null
    );
  };

  // Paper setup update
  const handleUpdatePaper = (paper: PaperSetup) => {
    commitProjectChange({
      ...project,
      paper,
    });
  };

  // Rotate Paper 90 degrees
  const handleRotateLabel = () => {
    const nextDeg = ((project.paper.rotationDeg + 90) % 360) as 0 | 90 | 180 | 270;
    // Swap width and height
    handleUpdatePaper({
      ...project.paper,
      widthMm: project.paper.heightMm,
      heightMm: project.paper.widthMm,
      rotationDeg: nextDeg,
    });
  };

  // Step Database record
  const handleStepDatabase = (delta: number) => {
    const db = project.database;
    if (!db || db.rows.length === 0) return;
    const maxIdx = db.rows.length - 1;
    let nextIdx = project.currentRecordIndex + delta;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx > maxIdx) nextIdx = maxIdx;
    commitProjectChange({
      ...project,
      currentRecordIndex: nextIdx,
    });
  };

  // Load Preset Template
  const handleLoadTemplate = (templateId: string) => {
    const found = SAMPLE_TEMPLATES.find((t) => t.id === templateId);
    if (found) {
      commitProjectChange({
        ...found.project,
        id: `proj-${Date.now()}`,
      });
    }
  };

  // Save Project as .olabel JSON
  const handleSaveProject = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `${project.name.replace(/\s+/g, '_')}.olabel`);
    dlAnchorElem.click();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* 1. TOP TOOLBAR & MULTI-TAB STRIP */}
      <TopToolbar
        project={project}
        tabs={tabs.map((t) => ({ id: t.id, name: t.name }))}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onAddTab={handleAddTab}
        onCloseTab={handleCloseTab}
        onNew={() => setShowPaperModal(true)}
        onOpenProject={(p) => commitProjectChange(p)}
        onSaveProject={handleSaveProject}
        onPrint={() => setShowPrintDialog(true)}
        canUndo={currentTab.history.length > 0}
        canRedo={currentTab.redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        selectedElement={selectedElement}
        onDeleteElement={() => selectedElement && handleDeleteElement(selectedElement.id)}
        onOpenLabelSetup={() => setShowPaperModal(true)}
        onRotateLabel={handleRotateLabel}
        onStepDatabase={handleStepDatabase}
        onUpdateElementBounds={handleUpdateElementBounds}
        onLoadTemplate={handleLoadTemplate}
        onOpenRustArchitecture={() => setShowRustModal(true)}
      />

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left 2x5 Toolbox */}
        <LeftToolbox
          onAddElement={handleAddElement}
          onOpenDatabaseManager={() => setShowDatabaseManager(true)}
          onOpenOcrModal={() => setShowOcrModal(true)}
          onOpenIconPicker={() => setShowIconPicker(true)}
          onOpenBarcodePicker={() => setShowBarcodePickerModal(true)}
        />

        {/* Center Interactive Canvas with Physical Millimeter Rulers */}
        <CanvasArea
          project={project}
          selectedElementId={currentTab.selectedElementId}
          onSelectElement={(id) => {
            setTabs((prev) =>
              prev.map((t) => (t.id === activeTabId ? { ...t, selectedElementId: id } : t))
            );
          }}
          onUpdateElementBounds={handleUpdateElementBounds}
          onDeleteElement={handleDeleteElement}
          zoom={currentTab.zoom}
          onZoomChange={(newZoom) => {
            setTabs((prev) =>
              prev.map((t) => (t.id === activeTabId ? { ...t, zoom: newZoom } : t))
            );
          }}
          onCursorMove={(xMm, yMm) => setCursorMm([xMm, yMm])}
          onUpdateTableCell={(elId, r, c, val) => {
            const newElements = project.elements.map((el) => {
              if (el.id === elId && el.kind.type === 'table') {
                const newCells = el.kind.cells.map((row) => [...row]);
                while (newCells.length <= r) {
                  newCells.push(Array(el.kind.cols).fill(''));
                }
                while (newCells[r].length <= c) {
                  newCells[r].push('');
                }
                newCells[r][c] = val;
                return {
                  ...el,
                  kind: {
                    ...el.kind,
                    cells: newCells,
                  },
                };
              }
              return el;
            });
            commitProjectChange({ ...project, elements: newElements });
          }}
        />

        {/* Right Contextual Property Inspector */}
        <RightInspector
          project={project}
          selectedElementId={currentTab.selectedElementId}
          onUpdatePaper={handleUpdatePaper}
          onOpenPaperModal={() => setShowPaperModal(true)}
          onOpenBarcodePicker={() => setShowBarcodePickerModal(true)}
          onUpdateElementKind={(elId, newKind) => {
            const newElements = project.elements.map((el) => {
              if (el.id === elId) {
                return { ...el, kind: newKind };
              }
              return el;
            });
            commitProjectChange({ ...project, elements: newElements });
          }}
          onUpdateElementBounds={handleUpdateElementBounds}
        />
      </div>

      {/* 3. BOTTOM STATUS BAR (Matching Reference 4 bottom bar) */}
      <footer className="h-7 bg-white border-t border-slate-200 px-3 flex items-center justify-between text-[11px] text-slate-600 select-none shrink-0 z-20">
        <div className="flex items-center gap-4">
          <span className="font-medium text-slate-800">
            Label: {project.paper.widthMm.toFixed(0)}X{project.paper.heightMm.toFixed(0)}mm,{' '}
            {project.paper.columns}column
          </span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Printer:</span>
            <select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="bg-transparent border-0 outline-none text-slate-800 font-medium cursor-pointer"
            >
              <option value="Microsoft Print to PDF">Microsoft Print to PDF</option>
              <option value="Thermal TSPL2 (203 DPI)">TSC / Gainscha Thermal (203 DPI)</option>
              <option value="Zebra ZPL II (300 DPI)">Zebra ZPL II (300 DPI)</option>
            </select>
          </div>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-600">
            Location: {cursorMm[0].toFixed(2)}mm {cursorMm[1].toFixed(2)}mm
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">Pure Clean-Room Engine</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono font-medium text-slate-700">
            {Math.round(currentTab.zoom * 100)}%
          </span>
        </div>
      </footer>

      {/* 4. MODALS */}
      {/* New Label / Label Size Setup Modal (Ref 5 replica) */}
      <NewLabelModal
        isOpen={showPaperModal}
        initialPaper={project.paper}
        initialName={project.name}
        onClose={() => setShowPaperModal(false)}
        onConfirm={(name, newPaper) => {
          commitProjectChange({
            ...project,
            name,
            paper: newPaper,
          });
        }}
      />

      {/* Print & TSPL/ZPL Hardware Workstation Dialog */}
      <PrintDialog
        isOpen={showPrintDialog}
        project={project}
        onClose={() => setShowPrintDialog(false)}
      />

      {/* Database / Excel Manager Modal */}
      <DatabaseManagerModal
        isOpen={showDatabaseManager}
        currentDatabase={project.database}
        onClose={() => setShowDatabaseManager(false)}
        onApplyDatabase={(db) => {
          commitProjectChange({
            ...project,
            database: db,
            currentRecordIndex: 0,
          });
        }}
      />

      {/* Icon Picker Modal */}
      <IconPickerModal
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelectIcon={(iconName) => {
          const el: LabelElement = {
            id: `el-icon-${Date.now()}`,
            name: 'Icon',
            xMm: 12,
            yMm: 12,
            widthMm: 14,
            heightMm: 14,
            locked: false,
            kind: {
              type: 'icon',
              iconName,
              color: '#000000',
            },
          };
          handleAddElement(el);
        }}
      />

      {/* Recognize & OCR Modal */}
      <OcrModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        onAddRecognizedElement={handleAddElement}
      />

      {/* Rust Architecture & MCP Code Viewer Modal */}
      <RustArchitectureModal
        isOpen={showRustModal}
        onClose={() => setShowRustModal(false)}
      />

      {/* All Barcode Picker Modal (Screenshot 1) */}
      <BarcodePickerModal
        isOpen={showBarcodePickerModal}
        activeSymbology={
          selectedElement && selectedElement.kind.type === 'barcode'
            ? selectedElement.kind.symbology
            : 'code128'
        }
        onClose={() => setShowBarcodePickerModal(false)}
        onSelectSymbology={(symbology) => {
          if (selectedElement && selectedElement.kind.type === 'barcode') {
            const newElements = project.elements.map((el) =>
              el.id === selectedElement.id && el.kind.type === 'barcode'
                ? {
                    ...el,
                    name: `BarCode (${symbology.toUpperCase()})`,
                    kind: { ...el.kind, symbology },
                  }
                : el
            );
            commitProjectChange({ ...project, elements: newElements });
          } else {
            const el: LabelElement = {
              id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: `BarCode (${symbology.toUpperCase()})`,
              xMm: 6,
              yMm: 15,
              widthMm: 50,
              heightMm: 16,
              locked: false,
              kind: {
                type: 'barcode',
                symbology,
                segments: [
                  {
                    type: 'serial',
                    startValue: 10001,
                    direction: 'incremental',
                    repeat: 1,
                    interval: 1,
                    memory: false,
                    paddingWidth: 5,
                  },
                ],
                activeSegmentIdx: 0,
                showHumanReadable: true,
                font: { ...DEFAULT_FONT, sizePt: 8, align: 'center' },
                prompt: { ...DEFAULT_PROMPT },
              },
            };
            handleAddElement(el);
          }
        }}
      />
    </div>
  );
}
