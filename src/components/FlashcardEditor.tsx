import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { AIService } from '../services/AIService';

export const FlashcardEditor: React.FC = () => {
  const selectedDeckId = useAppStore(s => s.selectedDeckId);
  const addFlashcard = useAppStore(s => s.addFlashcard);
  const loadFlashcards = useAppStore(s => s.loadFlashcards);

  const [content, setContent] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!content.trim()) return;
    setLoading(true);
    const generated = AIService.generateQuestions(content, 'auto');
    // pick first generated question as default
    if (generated.length > 0) {
      setQuestion(generated[0].question as string);
      const ans = Array.isArray(generated[0].answer) ? (generated[0].answer as string[]).join('; ') : (generated[0].answer as string);
      setAnswer(ans);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    if (!selectedDeckId) return alert('Select or create a deck first');
    if (!question.trim() || !answer.trim()) return alert('Provide question and answer');
    addFlashcard(selectedDeckId, question.trim(), answer.trim());
    loadFlashcards(selectedDeckId);
    setQuestion('');
    setAnswer('');
    setContent('');
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Create Flashcard</h3>

      <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Paste notes or topic here (markdown supported)" className="w-full min-h-[90px] p-3 rounded border mb-2" />

      <div className="flex gap-2 mb-3">
        <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">{loading ? 'Generating...' : 'Generate Questions'}</button>
        <button onClick={() => { setContent(''); setQuestion(''); setAnswer(''); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded">Clear</button>
      </div>

      <input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Question" className="w-full mb-2 px-3 py-2 rounded border" />
      <input value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Answer" className="w-full mb-2 px-3 py-2 rounded border" />

      <div className="flex gap-2">
        <button onClick={handleAdd} className="bg-green-600 px-4 py-2 text-white rounded">Add Card</button>
      </div>
    </div>
  );
};
