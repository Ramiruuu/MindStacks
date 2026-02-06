import type { Flashcard, Deck, UserStats } from '../types';

const STORAGE_KEYS = {
  DECKS: 'mindstack_decks',
  FLASHCARDS: 'mindstack_flashcards',
  STATS: 'mindstack_stats',
};

export class StorageService {
  /**
   * Get all decks
   */
  static getDecks(): Deck[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DECKS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading decks:', error);
      return [];
    }
  }

  /**
   * Get a specific deck by ID
   */
  static getDeck(deckId: string): Deck | null {
    const decks = this.getDecks();
    return decks.find(d => d.id === deckId) || null;
  }

  /**
   * Create a new deck
   */
  static createDeck(name: string, description: string, subject: string): Deck {
    const deck: Deck = {
      id: this.generateId(),
      name,
      description,
      subject,
      created: Date.now(),
      cardCount: 0,
      totalReviews: 0,
    };

    const decks = this.getDecks();
    decks.push(deck);
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));

    return deck;
  }

  /**
   * Update a deck
   */
  static updateDeck(deckId: string, updates: Partial<Deck>): Deck | null {
    const decks = this.getDecks();
    const index = decks.findIndex(d => d.id === deckId);

    if (index === -1) return null;

    decks[index] = { ...decks[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));

    return decks[index];
  }

  /**
   * Delete a deck and all its flashcards
   */
  static deleteDeck(deckId: string): boolean {
    // Delete deck
    let decks = this.getDecks();
    decks = decks.filter(d => d.id !== deckId);
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));

    // Delete all flashcards in this deck
    let flashcards = this.getFlashcards();
    flashcards = flashcards.filter(f => f.deckId !== deckId);
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(flashcards));

    return true;
  }

  /**
   * Get all flashcards for a deck
   */
  static getFlashcards(deckId?: string): Flashcard[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FLASHCARDS);
      const allCards = data ? JSON.parse(data) : [];
      return deckId ? allCards.filter((c: Flashcard) => c.deckId === deckId) : allCards;
    } catch (error) {
      console.error('Error reading flashcards:', error);
      return [];
    }
  }

  /**
   * Get a specific flashcard
   */
  static getFlashcard(cardId: string): Flashcard | null {
    const flashcards = this.getFlashcards();
    return flashcards.find(c => c.id === cardId) || null;
  }

  /**
   * Create a new flashcard
   */
  static createFlashcard(
    deckId: string,
    question: string,
    answer: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  ): Flashcard {
    const card: Flashcard = {
      id: this.generateId(),
      deckId,
      question,
      answer,
      difficulty,
      created: Date.now(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
    };

    const flashcards = this.getFlashcards();
    flashcards.push(card);
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(flashcards));

    // Update deck card count
    const deck = this.getDeck(deckId);
    if (deck) {
      this.updateDeck(deckId, { cardCount: deck.cardCount + 1 });
    }

    return card;
  }

  /**
   * Update a flashcard
   */
  static updateFlashcard(cardId: string, updates: Partial<Flashcard>): Flashcard | null {
    const flashcards = this.getFlashcards();
    const index = flashcards.findIndex(c => c.id === cardId);

    if (index === -1) return null;

    flashcards[index] = { ...flashcards[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(flashcards));

    return flashcards[index];
  }

  /**
   * Delete a flashcard
   */
  static deleteFlashcard(cardId: string): boolean {
    const card = this.getFlashcard(cardId);
    if (!card) return false;

    let flashcards = this.getFlashcards();
    flashcards = flashcards.filter(c => c.id !== cardId);
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(flashcards));

    // Update deck card count
    const deck = this.getDeck(card.deckId);
    if (deck && deck.cardCount > 0) {
      this.updateDeck(card.deckId, { cardCount: deck.cardCount - 1 });
    }

    return true;
  }

  /**
   * Delete all flashcards in a deck
   */
  static deleteAllFlashcardsInDeck(deckId: string): boolean {
    let flashcards = this.getFlashcards();
    const cardsToDelete = flashcards.filter(c => c.deckId === deckId).length;
    flashcards = flashcards.filter(c => c.deckId !== deckId);
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(flashcards));

    // Update deck
    const deck = this.getDeck(deckId);
    if (deck) {
      this.updateDeck(deckId, { cardCount: 0 });
    }

    return cardsToDelete > 0;
  }

  /**
   * Get user statistics
   */
  static getStats(): UserStats {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      if (data) {
        return JSON.parse(data) as UserStats;
      }
      return {
        totalCards: 0,
        totalDecks: 0,
        totalReviews: 0,
        correctReviews: 0,
        streak: 0,
      };
    } catch {
      return {
        totalCards: 0,
        totalDecks: 0,
        totalReviews: 0,
        correctReviews: 0,
        streak: 0,
      };
    }
  }

  /**
   * Update user statistics
   */
  static updateStats(updates: Partial<UserStats>): void {
    const stats = this.getStats();
    const updated = { ...stats, ...updates };
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updated));
  }

  /**
   * Export data as JSON
   */
  static exportData(): {
    decks: Deck[];
    flashcards: Flashcard[];
    stats: UserStats;
    exportedAt: number;
  } {
    return {
      decks: this.getDecks(),
      flashcards: this.getFlashcards(),
      stats: this.getStats(),
      exportedAt: Date.now(),
    };
  }

  /**
   * Import data from JSON
   */
  static importData(data: {
    decks?: Deck[];
    flashcards?: Flashcard[];
    stats?: UserStats;
  }): boolean {
    try {
      if (data.decks) {
        localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(data.decks));
      }
      if (data.flashcards) {
        localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(data.flashcards));
      }
      if (data.stats) {
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(data.stats));
      }
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Clear all data
   */
  static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.DECKS);
    localStorage.removeItem(STORAGE_KEYS.FLASHCARDS);
    localStorage.removeItem(STORAGE_KEYS.STATS);
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
