import { create } from 'zustand';
import type { Flashcard, Deck, StudySession, UserStats } from '../types';
import { StorageService } from '../services/StorageService';
import { SpacedRepetitionService } from '../services/SpacedRepetitionService';

interface AppStore {
  // Decks
  decks: Deck[];
  selectedDeckId: string | null;
  loadDecks: () => void;
  createDeck: (name: string, description: string, subject: string) => Deck;
  deleteDeck: (deckId: string) => void;
  selectDeck: (deckId: string | null) => void;

  // Flashcards
  flashcards: Flashcard[];
  loadFlashcards: (deckId?: string) => void;
  addFlashcard: (deckId: string, question: string, answer: string, difficulty?: 'easy' | 'medium' | 'hard') => void;
  deleteFlashcard: (cardId: string) => void;
  updateFlashcard: (cardId: string, updates: Partial<Flashcard>) => void;

  // Study Session
  studySession: StudySession | null;
  startStudySession: (deckId: string, mode: 'learn' | 'test' | 'review') => void;
  endStudySession: () => void;
  moveToNextCard: () => void;
  recordCardReview: (cardId: string, quality: number) => void;

  // User Stats
  stats: UserStats;
  loadStats: () => void;

  // UI State
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  decks: [],
  selectedDeckId: null,
  flashcards: [],
  studySession: null,
  darkMode: localStorage.getItem('mindstack_darkmode') === 'true',
  stats: StorageService.getStats(),

  // Deck actions
  loadDecks: () => {
    const decks = StorageService.getDecks();
    set({ decks });
  },

  createDeck: (name: string, description: string, subject: string) => {
    const newDeck = StorageService.createDeck(name, description, subject);
    const decks = get().decks;
    set({ decks: [...decks, newDeck] });
    return newDeck;
  },

  deleteDeck: (deckId: string) => {
    StorageService.deleteDeck(deckId);
    const decks = get().decks.filter(d => d.id !== deckId);
    const selectedDeckId = get().selectedDeckId === deckId ? null : get().selectedDeckId;
    set({ decks, selectedDeckId });
  },

  selectDeck: (deckId: string | null) => {
    set({ selectedDeckId: deckId });
    if (deckId) {
      get().loadFlashcards(deckId);
    }
  },

  // Flashcard actions
  loadFlashcards: (deckId?: string) => {
    const flashcards = StorageService.getFlashcards(deckId);
    set({ flashcards });
  },

  addFlashcard: (deckId: string, question: string, answer: string, difficulty = 'medium') => {
    const newCard = StorageService.createFlashcard(deckId, question, answer, difficulty);
    const flashcards = get().flashcards;
    set({ flashcards: [...flashcards, newCard] });

    // Update deck
    const decks = get().decks;
    const updatedDecks = decks.map(d =>
      d.id === deckId ? { ...d, cardCount: d.cardCount + 1 } : d
    );
    set({ decks: updatedDecks });
  },

  deleteFlashcard: (cardId: string) => {
    StorageService.deleteFlashcard(cardId);
    const flashcards = get().flashcards.filter(c => c.id !== cardId);
    set({ flashcards });
  },

  updateFlashcard: (cardId: string, updates: Partial<Flashcard>) => {
    StorageService.updateFlashcard(cardId, updates);
    const flashcards = get().flashcards.map(c =>
      c.id === cardId ? { ...c, ...updates } : c
    );
    set({ flashcards });
  },

  // Study session actions
  startStudySession: (deckId: string, mode: 'learn' | 'test' | 'review') => {
    let flashcards = StorageService.getFlashcards(deckId);

    if (mode === 'review') {
      flashcards = SpacedRepetitionService.getCardsDueForReview(deckId).filter(c => c.difficulty === 'hard');
    }

    if (mode === 'test') {
      // shuffle and limit number of cards for test mode
      flashcards = [...flashcards].sort(() => Math.random() - 0.5).slice(0, 30);
    }

    const studySession: StudySession = {
      deckId,
      cards: flashcards,
      currentIndex: 0,
      mode,
      startTime: Date.now(),
      score: 0,
    };
    set({ studySession });
  },

  endStudySession: () => {
    set({ studySession: null });
  },

  moveToNextCard: () => {
    const session = get().studySession;
    if (session) {
      const newIndex = session.currentIndex + 1;
      if (newIndex < session.cards.length) {
        set({ studySession: { ...session, currentIndex: newIndex } });
      }
    }
  },

  recordCardReview: (cardId: string, quality: number) => {
    // Use SpacedRepetitionService to compute scheduling and update storage
    const updated = SpacedRepetitionService.recordReview(cardId, quality);
    if (updated) {
      StorageService.updateFlashcard(cardId, updated);
      const flashcards = get().flashcards.map(c => c.id === cardId ? { ...c, ...updated } : c);
      set({ flashcards });
    }

    const session = get().studySession;
    if (session) {
      const newScore = quality >= 3 ? session.score + 1 : session.score;
      set({ studySession: { ...session, score: newScore } });
    }
  },

  // Stats actions
  loadStats: () => {
    const stats = StorageService.getStats();
    set({ stats });
  },

  // UI actions
  toggleDarkMode: () => {
    const newDarkMode = !get().darkMode;
    set({ darkMode: newDarkMode });
    localStorage.setItem('mindstack_darkmode', String(newDarkMode));
  },
}));
