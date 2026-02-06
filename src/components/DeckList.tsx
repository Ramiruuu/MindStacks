import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { StorageService } from '../services/StorageService';
import Papa from 'papaparse';
import { FirebaseService } from '../services/FirebaseService';

export const DeckList: React.FC = () => {
  const decks = useAppStore(s => s.decks);
  const createDeck = useAppStore(s => s.createDeck);
  const addFlashcard = useAppStore(s => s.addFlashcard);
  const selectDeck = useAppStore(s => s.selectDeck);
  const selectedDeckId = useAppStore(s => s.selectedDeckId);

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('General');
  const [desc, setDesc] = useState('');

  const fileRef = useRef<HTMLInputElement | null>(null);
  const csvRef = useRef<HTMLInputElement | null>(null);

  const [fbConfig, setFbConfig] = useState(() => {
    try {
      const raw = localStorage.getItem('mindstack_firebase_config');
      return raw ? JSON.parse(raw) : { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '' };
    } catch {
      return { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '' };
    }
  });
  const [fbStatus, setFbStatus] = useState<string>('Not connected');

  const handleCreate = () => {
    if (!name.trim()) return;
    createDeck(name.trim(), desc.trim(), subject.trim());
    setName('');
    setDesc('');
  };

  const handleExport = () => {
    const data = StorageService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindstack_export_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileRef.current?.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (StorageService.importData(parsed)) {
          alert('Import successful');
          window.location.reload();
        } else {
          alert('Import failed');
        }
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleCSVExport = () => {
    const cards = selectedDeckId ? StorageService.getFlashcards(selectedDeckId) : StorageService.getFlashcards();
    const rows = cards.map(c => ({ deckId: c.deckId, question: c.question, answer: c.answer, difficulty: c.difficulty }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindstack_cards_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVImportClick = () => csvRef.current?.click();

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as any[];
        data.forEach(row => {
          const deckName = row.deckName || row.deckId || 'Imported';
          let deck = decks.find(d => d.name === deckName);
          if (!deck) {
            deck = createDeck(deckName, 'Imported from CSV', 'Imported');
          }
          const q = row.question || row.q || '';
          const a = row.answer || row.a || '';
          const diff = (row.difficulty || 'medium') as 'easy'|'medium'|'hard';
          if (q && a) addFlashcard(deck.id, q, a, diff);
        });
        alert('CSV import completed');
        window.location.reload();
      }
    });
  };

  const handleFbSave = async () => {
    localStorage.setItem('mindstack_firebase_config', JSON.stringify(fbConfig));
    const ok = await FirebaseService.init(fbConfig as any);
    setFbStatus(ok ? 'Connected' : 'Connect failed');
  };

  const handleFbPush = async () => {
    try {
      const uid = 'local_user';
      await FirebaseService.pushExport(uid);
      alert('Pushed export to Firebase');
    } catch (err) {
      alert('Firebase push failed: ' + (err as any).message);
    }
  };

  const handleFbFetch = async () => {
    try {
      const uid = 'local_user';
      const data = await FirebaseService.fetchLatestExport(uid);
      if (data) {
        StorageService.importData(data);
        alert('Fetched and imported latest export');
        window.location.reload();
      } else {
        alert('No remote data found');
      }
    } catch (err) {
      alert('Firebase fetch failed: ' + (err as any).message);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Decks</h3>

      <div className="space-y-3 max-h-64 overflow-auto mb-4">
        {decks.length === 0 && <p className="text-sm text-gray-500">No decks yet. Create one.</p>}
        {decks.map(d => (
          <button
            key={d.id}
            onClick={() => selectDeck(d.id)}
            className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedDeckId === d.id ? 'ring-2 ring-blue-300' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-gray-500">{d.cardCount} cards</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
        <input className="w-full mb-2 px-3 py-2 rounded border" placeholder="Deck name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full mb-2 px-3 py-2 rounded border" placeholder="Subject" value={subject} onChange={e=>setSubject(e.target.value)} />
        <input className="w-full mb-3 px-3 py-2 rounded border" placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} />
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button onClick={handleCreate} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded">Create</button>
            <button onClick={handleExport} className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded">Export JSON</button>
            <button onClick={handleCSVExport} className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded">Export CSV</button>
          </div>

          <div className="flex gap-2">
            <button onClick={handleImportClick} className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded">Import JSON</button>
            <button onClick={handleCSVImportClick} className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded">Import CSV</button>
            <input ref={fileRef} onChange={handleImport} type="file" accept="application/json" className="hidden" />
            <input ref={csvRef} onChange={handleCSVImport} type="file" accept="text/csv" className="hidden" />
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="text-sm font-medium mb-2">Firebase Sync (optional)</div>
            <input placeholder="apiKey" value={fbConfig.apiKey} onChange={e=>setFbConfig({...fbConfig, apiKey: e.target.value})} className="w-full mb-2 px-3 py-2 rounded border" />
            <input placeholder="projectId" value={fbConfig.projectId} onChange={e=>setFbConfig({...fbConfig, projectId: e.target.value})} className="w-full mb-2 px-3 py-2 rounded border" />
            <div className="flex gap-2">
              <button onClick={handleFbSave} className="bg-green-600 text-white px-3 py-2 rounded">Save & Connect</button>
              <button onClick={handleFbPush} className="bg-blue-600 text-white px-3 py-2 rounded">Push Export</button>
              <button onClick={handleFbFetch} className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded">Fetch Latest</button>
            </div>
            <div className="text-xs text-gray-500 mt-2">Status: {fbStatus}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
