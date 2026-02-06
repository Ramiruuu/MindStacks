import React, { useState } from 'react';
import type { Flashcard } from '../types';

interface FlashcardCardProps {
  card: Flashcard;
  onFlip?: () => void;
  onRate?: (quality: number) => void;
  isFlipped?: boolean;
  showControls?: boolean;
}

export const FlashcardCard: React.FC<FlashcardCardProps> = ({
  card,
  onFlip,
  onRate,
  isFlipped = false,
  showControls = true,
}) => {
  const [flipped, setFlipped] = useState(isFlipped);

  const handleFlip = () => {
    setFlipped(!flipped);
    onFlip?.();
  };

  return (
    <div className="w-full">
      {/* Card */}
      <div
        onClick={handleFlip}
        className={`relative w-full h-64 sm:h-72 md:h-80 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
          flipped ? 'flip-card-inner flipped' : 'flip-card-inner'
        }`}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className={`absolute w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 
            rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center
            ${flipped ? 'hidden' : ''}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-4">QUESTION</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white break-words">
            {card.question}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-6 italic">
            Click to reveal answer
          </p>
        </div>

        {/* Back */}
        <div
          className={`absolute w-full h-full bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 
            rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center
            ${!flipped ? 'hidden' : ''}`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-4">ANSWER</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white break-words">
            {card.answer}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-6 italic">
            Click to show question
          </p>
        </div>
      </div>

      {/* Controls */}
      {showControls && flipped && onRate && (
        <div className="mt-6 flex flex-wrap gap-2 sm:gap-3 justify-center">
          <button
            onClick={() => onRate(1)}
            className="px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm sm:text-base font-medium transition"
          >
            Hard (1)
          </button>
          <button
            onClick={() => onRate(2)}
            className="px-3 sm:px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm sm:text-base font-medium transition"
          >
            Difficult (2)
          </button>
          <button
            onClick={() => onRate(3)}
            className="px-3 sm:px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm sm:text-base font-medium transition"
          >
            Good (3)
          </button>
          <button
            onClick={() => onRate(4)}
            className="px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm sm:text-base font-medium transition"
          >
            Easy (4)
          </button>
          <button
            onClick={() => onRate(5)}
            className="px-3 sm:px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm sm:text-base font-medium transition"
          >
            Perfect (5)
          </button>
        </div>
      )}

      {/* Difficulty Badge */}
      <div className="mt-4 flex justify-center">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
            card.difficulty === 'easy'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : card.difficulty === 'medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {card.difficulty.charAt(0).toUpperCase() + card.difficulty.slice(1)}
        </span>
      </div>
    </div>
  );
};
