export interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created: number;
  lastReview?: number;
  nextReview?: number;
  interval: number; // days until next review
  easeFactor: number; // for spaced repetition (starts at 2.5)
  repetitions: number; // number of times reviewed
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  subject: string;
  created: number;
  cardCount: number;
  lastStudied?: number;
  totalReviews: number;
}

export interface StudySession {
  deckId: string;
  cards: Flashcard[];
  currentIndex: number;
  mode: 'learn' | 'test' | 'review';
  startTime: number;
  score: number;
}

export interface QuestionFormat {
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'enumeration';
  question: string;
  options?: string[]; // for multiple choice
  answer: string | string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AIGeneratedQuestion extends QuestionFormat {
  generatedFrom: string; // original content
  confidence: number; // 0-1
}

export interface UserStats {
  totalCards: number;
  totalDecks: number;
  totalReviews: number;
  correctReviews: number;
  lastStudied?: number;
  streak: number;
}
