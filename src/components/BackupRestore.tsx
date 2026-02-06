import React, { useRef } from 'react';
import { StorageService } from '../services/StorageService';
import Papa from 'papaparse';

export const BackupRestore: React.FC = () => {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const exportJSON = () => {
    const data = StorageService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindstack_backup_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const cards = StorageService.getFlashcards();
    const rows = cards.map(c => ({ deckId: c.deckId, question: c.question, answer: c.answer, difficulty: c.difficulty }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindstack_backup_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (StorageService.importData(parsed)) {
          alert('Import successful');
          window.location.reload();
        } else alert('Import failed');
      } catch {
        alert('Invalid JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Backup & Restore</h3>
      <div className="flex gap-2 mb-3">
        <button onClick={exportJSON} className="bg-blue-600 text-white px-3 py-2 rounded">Export JSON</button>
        <button onClick={exportCSV} className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded">Export CSV</button>
        <input ref={fileRef} type="file" accept="application/json" onChange={importJSON} className="hidden" />
        <button onClick={() => fileRef.current?.click()} className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded">Import JSON</button>
      </div>
      <p className="text-sm text-gray-500">Use this page to backup your data or restore from a previous export.</p>
    </div>
  );
};
