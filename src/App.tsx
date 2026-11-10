/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MistakeRecord } from './types';
import {
  loadMistakesFromStorage,
  saveSingleMistake,
  deleteMistakeById,
  saveMistakesToStorage,
} from './utils/storage';
import { HeaderNav } from './components/HeaderNav';
import { OCRAnalysisView } from './components/OCRAnalysisView';
import { MistakeNotebookView } from './components/MistakeNotebookView';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { SamplePickerModal } from './components/SamplePickerModal';

export default function App() {
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [currentTab, setCurrentTab] = useState<'ocr' | 'notebook'>('ocr');
  const [workspaceRecord, setWorkspaceRecord] = useState<MistakeRecord | null>(null);

  // Modals
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedForPrint, setSelectedForPrint] = useState<MistakeRecord[]>([]);
  const [isSamplePickerOpen, setIsSamplePickerOpen] = useState(false);

  // Initialize mistakes from localStorage
  useEffect(() => {
    const loaded = loadMistakesFromStorage();
    setMistakes(loaded);
  }, []);

  // Save or update mistake in notebook
  const handleSaveToNotebook = (record: MistakeRecord) => {
    const updatedList = saveSingleMistake(record);
    setMistakes(updatedList);
  };

  // Delete mistake from notebook
  const handleDeleteMistake = (id: string) => {
    const updatedList = deleteMistakeById(id);
    setMistakes(updatedList);
  };

  // In-place update (e.g. mastery status)
  const handleUpdateMistake = (record: MistakeRecord) => {
    const updatedList = saveSingleMistake(record);
    setMistakes(updatedList);
  };

  // Open single item in print preview
  const handleOpenPrintSingle = (record: MistakeRecord) => {
    setSelectedForPrint([record]);
    setIsPrintModalOpen(true);
  };

  // Open multiple items in print preview
  const handleOpenPrintModal = (selected: MistakeRecord[]) => {
    if (!selected || selected.length === 0) {
      setSelectedForPrint(mistakes);
    } else {
      setSelectedForPrint(selected);
    }
    setIsPrintModalOpen(true);
  };

  // Open all mistakes in print preview
  const handleOpenPrintAll = () => {
    if (mistakes.length === 0) {
      alert('错题本中暂无错题，请先添加错题或载入示例！');
      return;
    }
    setSelectedForPrint(mistakes);
    setIsPrintModalOpen(true);
  };

  // Select a mistake from notebook to work on in OCR view
  const handleSelectForWorkspace = (record: MistakeRecord) => {
    setWorkspaceRecord(record);
    setCurrentTab('ocr');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Choose from sample picker modal
  const handleSelectSample = (sample: MistakeRecord) => {
    setWorkspaceRecord(sample);
    setCurrentTab('ocr');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      {/* Top Header & Mobile Bottom Nav */}
      <HeaderNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        notebookCount={mistakes.length}
        onOpenSamplePicker={() => setIsSamplePickerOpen(true)}
        onOpenPrintAll={handleOpenPrintAll}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'ocr' ? (
          <OCRAnalysisView
            onSaveToNotebook={handleSaveToNotebook}
            onOpenSamplePicker={() => setIsSamplePickerOpen(true)}
            onOpenPrintSingle={handleOpenPrintSingle}
            initialRecord={workspaceRecord}
          />
        ) : (
          <MistakeNotebookView
            mistakes={mistakes}
            onDeleteMistake={handleDeleteMistake}
            onUpdateMistake={handleUpdateMistake}
            onOpenPrintModal={handleOpenPrintModal}
            onSelectForWorkspace={handleSelectForWorkspace}
            onOpenSamplePicker={() => setIsSamplePickerOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        selectedMistakes={selectedForPrint}
      />

      <SamplePickerModal
        isOpen={isSamplePickerOpen}
        onClose={() => setIsSamplePickerOpen(false)}
        onSelect={handleSelectSample}
      />
    </div>
  );
}
