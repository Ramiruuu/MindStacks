import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { AIService } from '../services/AIService';

export const FlashcardEditor: React.FC = () => {
  const addFlashcard = useAppStore(s => s.addFlashcard);
  const loadFlashcards = useAppStore(s => s.loadFlashcards);

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<any[]>([]);
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('medium');
  const [questionType, setQuestionType] = useState<'auto'|'multiple-choice'|'true-false'|'fill-blank'|'enumeration'>('auto');
  const [countPerSource, setCountPerSource] = useState<number>(3);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Extract key topic/subject from content for deck naming
  const extractTopicFromContent = (text: string): string => {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return 'Study Set';
    
    // Try to find capitalized words (likely topic names)
    const firstLine = lines[0];
    const capitalizedWords = firstLine.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
    if (capitalizedWords && capitalizedWords.length > 0) {
      return capitalizedWords[0];
    }

    // Fallback: use first meaningful word(s)
    const words = firstLine.split(/\s+/).filter(w => w.length > 3);
    return words.slice(0, 2).join(' ') || 'Study Set';
  };

  // Read uploaded files (text-based only; convert PDFs to text first)
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    let combined = content ? content + '\n\n' : '';
    for (const f of Array.from(files)) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const t = await readFileAsText(f);
        combined += '\n' + t;
      } catch (err) {
        console.error('Error reading file', err);
      }
    }
    setContent(combined.trim());
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!content.trim()) return alert('Paste text or upload files first');
    setLoading(true);

    // Split content into paragraphs and generate questions per segment
    const segments = content.split(/\n{2,}/).map(s => s.trim()).filter(s => s.length > 20);
    const results: any[] = [];
    for (const seg of segments) {
      for (let i = 0; i < countPerSource; i++) {
        const qs = AIService.generateQuestions(seg, questionType);
        for (const q of qs) {
          results.push({ ...q, difficulty, source: seg });
        }
      }
    }

    // If no segments, run once on full content
    if (results.length === 0) {
      const qs = AIService.generateQuestions(content, questionType);
      for (const q of qs) results.push({ ...q, difficulty, source: content });
    }

    setGenerated(results);
    setLoading(false);
  };

  const handleAddAll = () => {
    if (generated.length === 0) return alert('Generate questions first');
    
    // Auto-create deck with smart topic-based name
    const createDeck = useAppStore(s => s.createDeck);
    const detectedTopic = extractTopicFromContent(content);
    const deckName = detectedTopic;
    const newDeck = createDeck(deckName, `Study questions on ${detectedTopic}`, 'Generated');
    const deckId = newDeck.id;

    for (const g of generated) {
      const qText = String(g.question || '').trim();
      let aText = '';
      if (Array.isArray(g.answer)) aText = g.answer.join('; ');
      else aText = String(g.answer || '');
      const diff = g.difficulty || difficulty;
      addFlashcard(deckId, qText, aText || '', diff);
    }
    loadFlashcards(deckId);
    alert(`✓ Created "${deckName}" folder with ${generated.length} study cards!`);
    setGenerated([]);
    setContent('');
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3">📚 Bulk Question Generator</h3>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="📝 Paste your notes, article, or learning material here..."
        className="w-full min-h-[140px] p-3 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 mb-3 focus:ring-2 focus:ring-indigo-500"
      />

      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            onChange={e => handleFiles(e.target.files)}
            type="file"
            multiple
            accept=".txt,.md,text/*"
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
          >
            📁 Upload Text Files
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Difficulty:</label>
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value as any)}
            className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Question Type:</label>
          <select
            value={questionType}
            onChange={e => setQuestionType(e.target.value as any)}
            className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
          >
            <option value="auto">Random (Auto)</option>
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false">True/False</option>
            <option value="fill-blank">Fill in Blank</option>
            <option value="enumeration">Enumeration</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Questions per section:</label>
          <input
            type="number"
            min={1}
            max={10}
            value={countPerSource}
            onChange={e => setCountPerSource(Number(e.target.value))}
            className="w-16 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '⏳ Generating...' : '✨ Generate Questions'}
        </button>

        <button
          onClick={() => {
            setContent('');
            setGenerated([]);
          }}
          className="px-3 py-2 bg-gray-400 text-white rounded text-sm font-medium hover:bg-gray-500"
        >
          Clear
        </button>
      </div>

      {generated.length > 0 && (
        <div className="mb-3 border rounded-lg p-4 bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              📚 Generated {generated.length} Questions ({difficulty})
            </div>
            <button
              onClick={handleAddAll}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700"
            >
              ✅ Create Deck & Add All
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-auto">
            {generated.map((g, idx) => (
              <div
                key={idx}
                className="p-3 border-l-4 border-indigo-500 rounded bg-white dark:bg-gray-800 shadow-sm"
              >
                <div className="font-medium text-xs text-indigo-700 dark:text-indigo-300 uppercase">
                  {g.type}
                </div>
                <div className="text-sm mt-1 font-medium text-gray-900 dark:text-white">
                  Q: {String(g.question)}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  ✓ Answer: {Array.isArray(g.answer) ? g.answer.join('; ') : String(g.answer)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
