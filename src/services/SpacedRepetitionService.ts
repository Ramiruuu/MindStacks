import type { Flashcard } from '../types';
import { StorageService } from './StorageService';

/**
 * Spaced Repetition Algorithm (SM-2 based)
 * Reference: https://en.wikipedia.org/wiki/Spaced_repetition#SM-2
 */
export class SpacedRepetitionService {
  /**
   * Get flashcards due for review
   */
  static getCardsDueForReview(deckId: string): Flashcard[] {
    const cards = StorageService.getFlashcards(deckId);
    const now = Date.now();

    return cards.filter(card => {
      if (!card.nextReview) return true; // New cards are always due
      return card.nextReview <= now;
    });
  }

  /**
   * Record a review and update card scheduling
   * quality: 0-5 scale (0=complete blackout, 5=perfect)
   */
  static recordReview(cardId: string, quality: number): Flashcard | null {
    const card = StorageService.getFlashcard(cardId);
    if (!card) return null;

    // Clamp quality between 0 and 5
    quality = Math.max(0, Math.min(5, quality));

    // Update statistics
    const stats = StorageService.getStats();
    stats.totalReviews = (stats.totalReviews || 0) + 1;
    if (quality >= 3) {
      stats.correctReviews = (stats.correctReviews || 0) + 1;
    }
    StorageService.updateStats(stats);

    // Update card based on quality
    if (quality < 3) {
      // Failed review - reset
      card.interval = 1;
      card.easeFactor = Math.max(1.3, card.easeFactor - 0.2);
      card.repetitions = 0;
    } else {
      // Successful review - apply SM-2
      card.repetitions++;

      if (card.repetitions === 1) {
        card.interval = 1;
      } else if (card.repetitions === 2) {
        card.interval = 3;
      } else {
        card.interval = Math.round(card.interval * card.easeFactor);
      }

      // Update ease factor
      card.easeFactor = Math.max(
        1.3,
        card.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
      );
    }

    // Schedule next review
    card.lastReview = Date.now();
    card.nextReview = Date.now() + card.interval * 24 * 60 * 60 * 1000;

    // Update difficulty based on performance
    if (quality <= 2) {
      card.difficulty = 'hard';
    } else if (quality >= 4) {
      card.difficulty = card.difficulty === 'easy' ? 'easy' : 'medium';
    }

    return StorageService.updateFlashcard(cardId, card);
  }

  /**
   * Get cards grouped by difficulty
   */
  static getCardsByDifficulty(
    deckId: string,
  ): {
    easy: Flashcard[];
    medium: Flashcard[];
    hard: Flashcard[];
  } {
    const cards = StorageService.getFlashcards(deckId);
    return {
      easy: cards.filter(c => c.difficulty === 'easy'),
      medium: cards.filter(c => c.difficulty === 'medium'),
      hard: cards.filter(c => c.difficulty === 'hard'),
    };
  }

  /**
   * Get learning statistics for a deck
   */
  static getDeckStats(deckId: string): {
    totalCards: number;
    newCards: number;
    duecards: number;
    reviewedToday: number;
    masteredCards: number;
  } {
    const cards = StorageService.getFlashcards(deckId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newCards = cards.filter(c => !c.lastReview);
    const dueCards = this.getCardsDueForReview(deckId);
    const reviewedToday = cards.filter(c => c.lastReview && c.lastReview > today.getTime());
    const masteredCards = cards.filter(c => c.repetitions >= 10 && c.easeFactor > 2.5);

    return {
      totalCards: cards.length,
      newCards: newCards.length,
      duecards: dueCards.length,
      reviewedToday: reviewedToday.length,
      masteredCards: masteredCards.length,
    };
  }

  /**
   * Get optimal study order (interleave difficulty)
   */
  static getOptimalStudyOrder(deckId: string): Flashcard[] {
    const { easy, medium, hard } = this.getCardsByDifficulty(deckId);

    // Prioritize hard cards, then medium, then easy
    // Interleave them for better learning
    const study: Flashcard[] = [];

    const maxLength = Math.max(easy.length, medium.length, hard.length);
    for (let i = 0; i < maxLength; i++) {
      if (hard[i]) study.push(hard[i]);
      if (medium[i]) study.push(medium[i]);
      if (easy[i]) study.push(easy[i]);
    }

    return study;
  }

  /**
   * Calculate retention rate (percentage of cards above threshold ease factor)
   */
  static getRetentionRate(deckId: string): number {
    const cards = StorageService.getFlashcards(deckId);
    if (cards.length === 0) return 0;

    const retainedCards = cards.filter(c => c.easeFactor >= 2.5);
    return Math.round((retainedCards.length / cards.length) * 100);
  }

  /**
   * Get daily learning goals
   */
  static getDailyGoal(deckId: string): {
    newCardsToday: number;
    reviewsNeeded: number;
    estimatedMinutes: number;
  } {
    const deckStats = this.getDeckStats(deckId);
    const newCardsGoal = Math.ceil(deckStats.newCards / 7); // Spread over a week
    const estimatedMinutes = (newCardsGoal + deckStats.duecards) * 1.5; // ~1.5 min per card

    return {
      newCardsToday: Math.max(0, newCardsGoal - deckStats.reviewedToday),
      reviewsNeeded: deckStats.duecards,
      estimatedMinutes: Math.round(estimatedMinutes),
    };
  }
}
