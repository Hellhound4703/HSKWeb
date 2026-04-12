import React, { useState } from 'react';
import HandwritingPractice from './HandwritingPractice';

interface FlashcardProps {
  word: {
    word: string;
    pinyin: string;
    definition: string;
    hint?: string;
  };
  flipped: boolean;
  onFlip: () => void;
  onPlayAudio?: (text: string) => void;
  isLearned?: boolean;
  onToggleLearned?: (e: React.MouseEvent) => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ 
  word, 
  flipped, 
  onFlip, 
  onPlayAudio, 
  isLearned, 
  onToggleLearned 
}) => {
  const [showPractice, setShowPractice] = useState(false);

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't flip the card when clicking the audio button
    if (onPlayAudio) {
      onPlayAudio(word.word);
    }
  };

  const handleToggleLearned = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't flip the card
    if (onToggleLearned) {
      onToggleLearned(e);
    }
  };

  const togglePractice = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPractice(!showPractice);
  };

  return (
    <>
      <div 
        className="group perspective w-full max-w-[20rem] sm:max-w-sm aspect-[3/4] min-h-[24rem] cursor-pointer mx-auto"
        onClick={onFlip}
      >
        <div className={`relative preserve-3d duration-500 w-full h-full ${flipped ? 'rotate-y-180' : ''}`}>
          {/* Front Side */}
          <div className="absolute backface-hidden w-full h-full bg-white border-4 border-blue-500 rounded-xl shadow-xl flex flex-col items-center justify-center p-4 sm:p-6 text-center">
            <h2 className="text-5xl sm:text-6xl font-bold mb-4">{word.word}</h2>
            
            <button 
              onClick={togglePractice}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all border border-blue-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Practice Writing
            </button>

            <p className="text-gray-400 text-[10px] sm:text-xs mt-8 uppercase tracking-widest font-bold">Click to reveal</p>
          </div>

          {/* Back Side */}
          <div className="absolute backface-hidden rotate-y-180 w-full h-full bg-blue-50 border-4 border-blue-500 rounded-xl shadow-xl flex flex-col items-center justify-center p-4 sm:p-6 text-center relative overflow-y-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">{word.word}</h2>
            <p className="text-xl sm:text-2xl text-gray-700 italic mb-2">{word.pinyin}</p>
            
            <div className="flex gap-3 sm:gap-4 mb-4">
              <button 
                onClick={handlePlayAudio}
                className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 text-blue-600 transition-colors"
                title="Play Pronunciation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>

              {onToggleLearned && (
                <button
                  onClick={handleToggleLearned}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all border-2 ${
                    isLearned 
                      ? 'bg-green-500 text-white border-green-500' 
                      : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-400'
                  }`}
                >
                  {isLearned ? '✓ Learned' : 'Mark Learned'}
                </button>
              )}
            </div>

            <hr className="w-12 sm:w-16 border-blue-200 mb-4" />
            <p className="text-lg sm:text-xl text-gray-800 mb-4">{word.definition}</p>

            {word.hint && (
              <div className="mt-2 sm:mt-auto bg-yellow-50 p-2 sm:p-3 rounded-lg border border-yellow-100 flex items-start gap-2 w-full">
                <span className="text-yellow-600 mt-0.5 text-sm">💡</span>
                <p className="text-[10px] sm:text-xs text-yellow-800 italic text-left leading-relaxed">
                  <span className="font-bold not-italic mr-1">Hint:</span>
                  {word.hint}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPractice && (
        <HandwritingPractice 
          character={word.word} 
          onClose={() => setShowPractice(false)} 
        />
      )}
    </>
  );
};

export default Flashcard;
