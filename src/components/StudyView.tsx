import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { FlashcardCard } from './FlashcardCard';

export const StudyView: React.FC = () => {
  const selectedDeckId = useAppStore(s => s.selectedDeckId);
  const flashcards = useAppStore(s => s.flashcards);
  const startStudySession = useAppStore(s => s.startStudySession);
  const endStudySession = useAppStore(s => s.endStudySession);
  const studySession = useAppStore(s => s.studySession);
  const recordCardReview = useAppStore(s => s.recordCardReview);
  const moveToNextCard = useAppStore(s => s.moveToNextCard);
  const [mode, setMode] = useState<'learn'|'test'|'review'>('learn');

  // per-card timer for test mode
  const [cardTimeLeft, setCardTimeLeft] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (studySession && studySession.mode === 'test') {
      // when card index changes, reset per-card timer
      setCardTimeLeft(30); // 30s per card default
    }
    return () => clearTimeout(timer);
  }, [studySession?.currentIndex]);

  useEffect(() => {
    let t: any;
    if (studySession && studySession.mode === 'test' && cardTimeLeft > 0) {
      t = setTimeout(() => setCardTimeLeft(v => Math.max(0, v - 1)), 1000);
    }
    if (studySession && studySession.mode === 'test' && cardTimeLeft === 0 && studySession.cards.length > 0) {
      // time expired for current card: record as failed and advance
      const current = studySession.cards[studySession.currentIndex];
      if (current) {
        recordCardReview(current.id, 0);
        moveToNextCard();
      }
    }
    return () => clearTimeout(t);
  }, [cardTimeLeft, studySession]);

  const duePreview = useMemo(() => {
    if (!selectedDeckId) return null;
    // show the next due card in preview (first in flashcards)
    return flashcards[0] || null;
  }, [selectedDeckId, flashcards]);

  const start = () => {
    if (!selectedDeckId) return alert('Select a deck first');
    startStudySession(selectedDeckId, mode);
  };

  if (!selectedDeckId) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">Select a deck to start studying.</div>
    );
  }

  if (studySession) {
    const current = studySession.cards[studySession.currentIndex];
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Studying — {studySession.mode.toUpperCase()}</h3>
          <div className="text-sm text-gray-500">{studySession.currentIndex + 1}/{studySession.cards.length} • Score: {studySession.score}</div>
        </div>

        {studySession.mode === 'test' && (
          <div className="mb-3 text-sm text-gray-600">Per-card time left: {cardTimeLeft}s</div>
        )}

        {current ? (
          <div>
            <FlashcardCard card={current} onRate={(q) => { recordCardReview(current.id, q); moveToNextCard(); }} />
            <div className="mt-4 flex gap-2 justify-between">
              <button onClick={() => { moveToNextCard(); }} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded">Skip</button>
              <button onClick={() => { endStudySession(); }} className="px-3 py-2 bg-red-500 text-white rounded">End Session</button>
            </div>
          </div>
        ) : (
          <div>No more cards — session complete.</div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Study</h3>
        <div className="text-sm text-gray-500">{flashcards.length} cards</div>
      </div>

      <div className="flex gap-2 mb-4">
        <select value={mode} onChange={e=>setMode(e.target.value as any)} className="px-3 py-2 rounded border">
          <option value="learn">Learn (sequential)</option>
          <option value="test">Test (timed)</option>
          <option value="review">Review (problem cards)</option>
        </select>
        <button onClick={start} className="bg-blue-600 text-white px-4 py-2 rounded">Start</button>
      </div>

      {duePreview ? (
        <div>
          <FlashcardCard card={duePreview} />
        </div>
      ) : (
        <div className="text-sm text-gray-500">No cards in deck yet. Add some to begin studying.</div>
      )}
    </div>
  );
};
