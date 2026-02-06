import type { AIGeneratedQuestion } from '../types';

/**
 * AI Service - Rule-based question generation
 * This is a free, client-side approach that doesn't require external APIs
 * Future: Can be extended to use Hugging Face or other free-tier APIs
 */

export class AIService {
  /**
   * Parse existing Q&A pairs from content
   * Supports formats like:
   * - "Q: Question? A: Answer"
   * - "Question?\nAnswer"
   * - "Q1. Question?\nA1. Answer"
   */
  static parseExistingQAPairs(content: string): { question: string; answer: string }[] {
    const pairs: { question: string; answer: string }[] = [];
    
    // Pattern 1: "Q: ... A: ..." on same or adjacent lines
    const qaPattern1 = /Q:\s*(.+?)(?:\n|\s+)A:\s*(.+?)(?=\n|$)/gi;
    let match;
    while ((match = qaPattern1.exec(content)) !== null) {
      const q = match[1].trim();
      const a = match[2].trim();
      if (q.length > 5 && a.length > 2) {
        pairs.push({ question: q, answer: a });
      }
    }

    // Pattern 2: "Question?\nAnswer" (question on one line, answer on next)
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (let i = 0; i < lines.length - 1; i++) {
      const current = lines[i];
      const next = lines[i + 1];
      // If current line ends with ? and next line doesn't, likely a Q&A pair
      if (current.endsWith('?') && !next.endsWith('?') && next.length > 2 && next.length < 200 && !next.toLowerCase().startsWith('what') && !next.toLowerCase().startsWith('which')) {
        pairs.push({ question: current, answer: next });
      }
    }

    return pairs;
  }

  /**
   * Generate questions from content using rule-based approach
   */
  static generateQuestions(content: string, format: 'auto' | 'multiple-choice' | 'true-false' | 'fill-blank' | 'enumeration' = 'auto'): AIGeneratedQuestion[] {
    const questions: AIGeneratedQuestion[] = [];

    if (format === 'auto' || format === 'multiple-choice') {
      const mcQuestion = this.generateMultipleChoice(content);
      if (mcQuestion) questions.push(mcQuestion);
    }

    if (format === 'auto' || format === 'true-false') {
      const tfQuestion = this.generateTrueFalse(content);
      if (tfQuestion) questions.push(tfQuestion);
    }

    if (format === 'auto' || format === 'fill-blank') {
      const fbQuestion = this.generateFillInBlank(content);
      if (fbQuestion) questions.push(fbQuestion);
    }

    if (format === 'auto' || format === 'enumeration') {
      const enumQuestion = this.generateEnumeration(content);
      if (enumQuestion) questions.push(enumQuestion);
    }

    return questions;
  }

  /**
   * Generate multiple choice questions
   */
  private static generateMultipleChoice(content: string): AIGeneratedQuestion | null {
    // Extract key terms and concepts
    const keyTerms = this.extractKeyTerms(content);
    if (keyTerms.length === 0) return null;

    const mainConcept = keyTerms[0];
    const wrongOptions = keyTerms.slice(1, 4);

    // If we don't have enough wrong options, generate some
    if (wrongOptions.length < 3) {
      const generated = this.generateWrongAnswers(mainConcept);
      wrongOptions.push(...generated);
    }

    const options = this.shuffleArray([mainConcept, ...wrongOptions.slice(0, 3)]);

    const question: AIGeneratedQuestion = {
      type: 'multiple-choice',
      question: `Which of the following is related to "${mainConcept}"?`,
      options,
      answer: mainConcept,
      difficulty: this.calculateDifficulty(content),
      generatedFrom: content,
      confidence: 0.8,
    };

    return question;
  }

  /**
   * Generate true/false questions
   */
  private static generateTrueFalse(content: string): AIGeneratedQuestion | null {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length === 0) return null;

    const sentence = sentences[0].trim();
    const isTrue = Math.random() > 0.5;

    const question: AIGeneratedQuestion = {
      type: 'true-false',
      question: isTrue ? sentence : this.alterSentence(sentence),
      answer: isTrue ? 'true' : 'false',
      difficulty: this.calculateDifficulty(content),
      generatedFrom: content,
      confidence: 0.75,
    };

    return question;
  }

  /**
   * Generate fill-in-the-blank questions
   */
  private static generateFillInBlank(content: string): AIGeneratedQuestion | null {
    const words = content.split(/\s+/);
    if (words.length < 5) return null;

    // Find a word of reasonable length to blank out
    const meaningfulWords = words.filter(w => w.length > 4 && !this.isCommonWord(w));
    if (meaningfulWords.length === 0) return null;

    const blankWord = meaningfulWords[Math.floor(Math.random() * meaningfulWords.length)];
    const questionText = content.replace(new RegExp(`\\b${blankWord}\\b`, 'i'), '___________');

    const question: AIGeneratedQuestion = {
      type: 'fill-blank',
      question: `Complete: ${questionText}`,
      answer: blankWord.toLowerCase(),
      difficulty: this.calculateDifficulty(content),
      generatedFrom: content,
      confidence: 0.7,
    };

    return question;
  }

  /**
   * Generate enumeration questions (list-based)
   */
  private static generateEnumeration(content: string): AIGeneratedQuestion | null {
    // Look for numbered items or bullet points
    const lines = content.split(/\n+/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return null;

    const items = lines.slice(0, Math.min(5, lines.length));

    const question: AIGeneratedQuestion = {
      type: 'enumeration',
      question: 'List the key points or items mentioned:',
      answer: items.map(item => item.replace(/^[-*•]\s*/, '').trim()),
      difficulty: this.calculateDifficulty(content),
      generatedFrom: content,
      confidence: 0.85,
    };

    return question;
  }

  /**
   * Extract key terms from content
   */
  private static extractKeyTerms(content: string): string[] {
    // Simple extraction: use capitalized words and first few meaningful words
    const words = content.split(/\s+/);
    const keyTerms: string[] = [];

    for (const word of words) {
      const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
      if (cleanWord.length > 3 && (cleanWord[0] === cleanWord[0].toUpperCase() || cleanWord.length > 6)) {
        keyTerms.push(cleanWord);
        if (keyTerms.length >= 5) break;
      }
    }

    return keyTerms.length > 0 ? keyTerms : ['Concept'];
  }

  /**
   * Generate plausible wrong answers
   */
  private static generateWrongAnswers(correctAnswer: string): string[] {
    const wrongAnswers = [
      `The opposite of ${correctAnswer}`,
      `An example not related to ${correctAnswer}`,
      `A common misconception about ${correctAnswer}`,
    ];
    return wrongAnswers;
  }

  /**
   * Alter a sentence to make it false
   */
  private static alterSentence(sentence: string): string {
    const words = sentence.split(/\s+/);
    if (words.length < 3) return sentence;

    // Try to negate or change a key word
    const negationWords: { [key: string]: string } = {
      'is': 'is not',
      'are': 'are not',
      'was': 'was not',
      'were': 'were not',
      'always': 'never',
      'true': 'false',
    };

    for (let i = 0; i < words.length; i++) {
      const lower = words[i].toLowerCase();
      if (negationWords[lower]) {
        words[i] = negationWords[lower];
        return words.join(' ');
      }
    }

    // Default: add "not" after first verb
    return sentence.replace(/\s(is|are|was|were)\s/, ' $1 not ');
  }

  /**
   * Check if word is common (should not be blanked)
   */
  private static isCommonWord(word: string): boolean {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being'];
    return commonWords.includes(word.toLowerCase());
  }

  /**
   * Calculate difficulty based on content length and complexity
   */
  private static calculateDifficulty(content: string): 'easy' | 'medium' | 'hard' {
    const wordCount = content.split(/\s+/).length;
    const avgWordLength = content.replace(/\s/g, '').length / wordCount;

    if (wordCount < 20 && avgWordLength < 6) return 'easy';
    if (wordCount > 50 || avgWordLength > 7) return 'hard';
    return 'medium';
  }

  /**
   * Shuffle array for randomization
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Future: Hugging Face API integration (when user provides API key)
   * This would handle more sophisticated NLP-based question generation
   */
  static async generateQuestionsFromAPI(
    content: string,
    apiKey: string,
  ): Promise<AIGeneratedQuestion[]> {
    try {
      // Placeholder for future API integration
      console.log('API integration coming soon with API key:', apiKey?.substring(0, 5) + '...');
      return [];
    } catch (error) {
      console.error('Error calling AI API:', error);
      // Fallback to rule-based generation
      return this.generateQuestions(content);
    }
  }
}
