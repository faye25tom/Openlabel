import { useCallback, useEffect, useState } from 'react';
import {
  BarcodeSymbology,
  DataTable,
  LabelElement,
  LabelProject,
  PaperSetup,
} from '../types/model';
import { SAMPLE_TEMPLATES } from '../data/sampleTemplates';
import { createBarcodeElement, createBlankProject } from '../data/elementFactory';

export interface TabState {
  id: string;
  name: string;
  project: LabelProject;
  history: LabelProject[];
  redoStack: LabelProject[];
  selectedElementId: string | null;
  zoom: number;
}

export interface UseLabelWorkspaceOptions {
  onRequestSave?: () => void;
  onRequestPrint?: () => void;
}

export function useLabelWorkspace(options?: UseLabelWorkspaceOptions) {
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

  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const project = currentTab.project;
  const selectedElement =
    project.elements.find((e) => e.id === currentTab.selectedElementId) || null;

  const commitProjectChange = useCallback(
    (newProject: LabelProject, newSelectedId?: string | null) => {
      setTabs((prevTabs) =>
        prevTabs.map((t) => {
          if (t.id === activeTabId) {
            return {
              ...t,
              history: [...t.history.slice(-39), t.project],
              redoStack: [],
              project: newProject,
              selectedElementId:
                newSelectedId !== undefined ? newSelectedId : t.selectedElementId,
            };
          }
          return t;
        }),
      );
    },
    [activeTabId],
  );

  const updateProjectTransient = useCallback(
    (updater: (prev: LabelProject) => LabelProject) => {
      setTabs((prevTabs) =>
        prevTabs.map((t) =>
          t.id === activeTabId ? { ...t, project: updater(t.project) } : t,
        ),
      );
    },
    [activeTabId],
  );

  const pushHistorySnapshot = useCallback(
    (snapshot: LabelProject) => {
      setTabs((prevTabs) =>
        prevTabs.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                history: [...t.history.slice(-39), snapshot],
                redoStack: [],
              }
            : t,
        ),
      );
    },
    [activeTabId],
  );

  const handleUndo = useCallback(() => {
    setTabs((prevTabs) =>
      prevTabs.map((t) => {
        if (t.id === activeTabId && t.history.length > 0) {
          const prev = t.history[t.history.length - 1];
          const newHistory = t.history.slice(0, -1);
          const stillHasSelected = prev.elements.some(
            (el) => el.id === t.selectedElementId,
          );
          return {
            ...t,
            history: newHistory,
            redoStack: [t.project, ...t.redoStack],
            project: prev,
            selectedElementId: stillHasSelected
              ? t.selectedElementId
              : prev.elements[0]?.id || null,
          };
        }
        return t;
      }),
    );
  }, [activeTabId]);

  const handleRedo = useCallback(() => {
    setTabs((prevTabs) =>
      prevTabs.map((t) => {
        if (t.id === activeTabId && t.redoStack.length > 0) {
          const next = t.redoStack[0];
          const newRedo = t.redoStack.slice(1);
          const stillHasSelected = next.elements.some(
            (el) => el.id === t.selectedElementId,
          );
          return {
            ...t,
            history: [...t.history, t.project],
            redoStack: newRedo,
            project: next,
            selectedElementId: stillHasSelected
              ? t.selectedElementId
              : next.elements[0]?.id || null,
          };
        }
        return t;
      }),
    );
  }, [activeTabId]);

  const handleAddTab = useCallback(() => {
    const newId = `tab-${Date.now()}`;
    const newName = `New Label${tabs.length + 1}`;
    const newProj = createBlankProject(newName);
    setTabs((prev) => [
      ...prev,
      {
        id: newId,
        name: newName,
        project: newProj,
        history: [],
        redoStack: [],
        selectedElementId: newProj.elements[0]?.id || null,
        zoom: 1.0,
      },
    ]);
    setActiveTabId(newId);
  }, [tabs.length]);

  const handleCloseTab = useCallback(
    (id: string) => {
      if (tabs.length <= 1) return;
      const remaining = tabs.filter((t) => t.id !== id);
      setTabs(remaining);
      if (activeTabId === id) {
        setActiveTabId(remaining[0].id);
      }
    },
    [tabs, activeTabId],
  );

  const handleSelectElement = useCallback(
    (id: string | null) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, selectedElementId: id } : t)),
      );
    },
    [activeTabId],
  );

  const handleSetZoom = useCallback(
    (newZoom: number) => {
      const clamped = Math.max(0.4, Math.min(3.0, Number(newZoom.toFixed(2))));
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, zoom: clamped } : t)),
      );
    },
    [activeTabId],
  );

  const handleUpdateElementBounds = useCallback(
    (id: string, xMm: number, yMm: number, widthMm: number, heightMm: number) => {
      const newElements = project.elements.map((el) =>
        el.id === id ? { ...el, xMm, yMm, widthMm, heightMm } : el,
      );
      commitProjectChange({ ...project, elements: newElements });
    },
    [project, commitProjectChange],
  );

  const handleUpdateElementBoundsTransient = useCallback(
    (id: string, xMm: number, yMm: number, widthMm: number, heightMm: number) => {
      updateProjectTransient((prev) => ({
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? { ...el, xMm, yMm, widthMm, heightMm } : el,
        ),
      }));
    },
    [updateProjectTransient],
  );

  const handleUpdateElementKind = useCallback(
    (elId: string, newKind: LabelElement['kind']) => {
      const newElements = project.elements.map((el) =>
        el.id === elId ? { ...el, kind: newKind } : el,
      );
      commitProjectChange({ ...project, elements: newElements });
    },
    [project, commitProjectChange],
  );

  const handleAddElement = useCallback(
    (element: LabelElement) => {
      commitProjectChange(
        {
          ...project,
          elements: [...project.elements, element],
        },
        element.id,
      );
    },
    [project, commitProjectChange],
  );

  const handleDeleteElement = useCallback(
    (id: string) => {
      const newElements = project.elements.filter((el) => el.id !== id);
      commitProjectChange(
        {
          ...project,
          elements: newElements,
        },
        currentTab.selectedElementId === id ? null : currentTab.selectedElementId,
      );
    },
    [project, currentTab.selectedElementId, commitProjectChange],
  );

  const handleToggleLockElement = useCallback(
    (id: string) => {
      const newElements = project.elements.map((el) =>
        el.id === id ? { ...el, locked: !el.locked } : el,
      );
      commitProjectChange({ ...project, elements: newElements });
    },
    [project, commitProjectChange],
  );

  const handleUpdateTableCell = useCallback(
    (elId: string, r: number, c: number, val: string) => {
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
    },
    [project, commitProjectChange],
  );

  const handleUpdatePaper = useCallback(
    (paper: PaperSetup) => {
      commitProjectChange({
        ...project,
        paper,
      });
    },
    [project, commitProjectChange],
  );

  const handleUpdatePaperWithName = useCallback(
    (name: string, paper: PaperSetup) => {
      setTabs((prevTabs) =>
        prevTabs.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                name,
                history: [...t.history.slice(-39), t.project],
                redoStack: [],
                project: {
                  ...t.project,
                  name,
                  paper,
                },
              }
            : t,
        ),
      );
    },
    [activeTabId],
  );

  const handleRotateLabel = useCallback(() => {
    const nextDeg = ((project.paper.rotationDeg + 90) % 360) as 0 | 90 | 180 | 270;
    handleUpdatePaper({
      ...project.paper,
      widthMm: project.paper.heightMm,
      heightMm: project.paper.widthMm,
      rotationDeg: nextDeg,
    });
  }, [project.paper, handleUpdatePaper]);

  const handleStepDatabase = useCallback(
    (delta: number) => {
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
    },
    [project, commitProjectChange],
  );

  const handleLoadTemplate = useCallback(
    (templateId: string) => {
      const found = SAMPLE_TEMPLATES.find((t) => t.id === templateId);
      if (found) {
        const nextProj = {
          ...found.project,
          id: `proj-${Date.now()}`,
        };
        commitProjectChange(nextProj, nextProj.elements[0]?.id || null);
      }
    },
    [commitProjectChange],
  );

  const handleOpenProject = useCallback(
    (parsed: LabelProject) => {
      commitProjectChange(parsed, parsed.elements[0]?.id || null);
    },
    [commitProjectChange],
  );

  const handleSaveProject = useCallback(() => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(project, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute(
      'download',
      `${project.name.replace(/\s+/g, '_')}.olabel`,
    );
    dlAnchorElem.click();
  }, [project]);

  const handleApplyDatabase = useCallback(
    (db: DataTable) => {
      commitProjectChange({
        ...project,
        database: db,
        currentRecordIndex: 0,
      });
    },
    [project, commitProjectChange],
  );

  const handleSelectBarcodeSymbology = useCallback(
    (symbology: BarcodeSymbology) => {
      if (selectedElement && selectedElement.kind.type === 'barcode') {
        const newElements = project.elements.map((el) =>
          el.id === selectedElement.id && el.kind.type === 'barcode'
            ? {
                ...el,
                name: `BarCode (${symbology.toUpperCase()})`,
                kind: { ...el.kind, symbology },
              }
            : el,
        );
        commitProjectChange({ ...project, elements: newElements });
      } else {
        handleAddElement(createBarcodeElement(symbology));
      }
    },
    [selectedElement, project, commitProjectChange, handleAddElement],
  );

  // Global keyboard shortcuts (Undo / Redo / Save / Print)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      } else if (key === 's') {
        e.preventDefault();
        if (options?.onRequestSave) options.onRequestSave();
        else handleSaveProject();
      } else if (key === 'p') {
        if (options?.onRequestPrint) {
          e.preventDefault();
          options.onRequestPrint();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleSaveProject, options]);

  return {
    tabs,
    activeTabId,
    currentTab,
    project,
    selectedElement,
    setActiveTabId,
    commitProjectChange,
    pushHistorySnapshot,
    handleUndo,
    handleRedo,
    handleAddTab,
    handleCloseTab,
    handleSelectElement,
    handleSetZoom,
    handleAddElement,
    handleDeleteElement,
    handleToggleLockElement,
    handleUpdateElementBounds,
    handleUpdateElementBoundsTransient,
    handleUpdateElementKind,
    handleUpdateTableCell,
    handleUpdatePaper,
    handleUpdatePaperWithName,
    handleRotateLabel,
    handleStepDatabase,
    handleLoadTemplate,
    handleOpenProject,
    handleSaveProject,
    handleApplyDatabase,
    handleSelectBarcodeSymbology,
  };
}
