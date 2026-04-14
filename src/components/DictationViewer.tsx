import React, { useState, useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';
import { speakChinese } from '../utils/audio';
import { awardXP } from '../utils/gamification';
import { type User } from 'firebase/auth';

interface Word {
  word: string;
  pinyin: string;
  definition: string;
}

interface DictationViewerProps {
  words: Word[];
  user: User | null;
}

const DictationViewer: React.FC<DictationViewerProps> = ({ words, user }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [canvasSize, setCanvasSize] = useState(300);
  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);

  const currentWord = words[currentIndex];

  useEffect(() => {
    const updateSize = () => {
      const size = Math.min(300, window.innerWidth - 40);
      setCanvasSize(size);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (targetRef.current && currentWord) {
      targetRef.current.innerHTML = '';
      setIsComplete(false);
      setShowHint(false);
      
      writerRef.current = HanziWriter.create(targetRef.current, currentWord.word[0], {
        width: canvasSize,
        height: canvasSize,
        padding: 10,
        showOutline: true,
        strokeColor: '#2563eb',
      });

      writerRef.current.quiz({
        onComplete: () => {
          setIsComplete(true);
          if (user) awardXP(user.uid, 15);
          speakChinese(currentWord.word);
        }
      });
    }
  }, [currentWord, canvasSize, user]);

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Re-shuffle or loop
      setCurrentIndex(0);
    }
  };

  const playAudio = () => {
    speakChinese(currentWord.word);
  };

  if (!currentWord) return <div>No words selected for dictation.</div>;

  return (
    <div className="flex flex-col items-center max-w-md mx-auto p-4 animate-in fade-in duration-500">
      <div className="mb-8 text-center w-full">
        <h2 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Dictation Mode</h2>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <button 
            onClick={playAudio}
            className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto hover:bg-blue-700 transition-all shadow-lg active:scale-95 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
          <p className="mt-4 text-gray-400 text-xs font-bold uppercase">Click to hear word</p>
        </div>

        <div className="flex flex-col gap-2 mb-8">
          <p className="text-xl font-medium text-gray-700">{currentWord.definition}</p>
          {showHint && <p className="text-blue-600 font-bold italic">{currentWord.pinyin}</p>}
          <button 
            onClick={() => setShowHint(!showHint)}
            className="text-[10px] font-black text-blue-400 uppercase hover:text-blue-600 transition-colors"
          >
            {showHint ? "Hide Hint" : "Show Pinyin Hint"}
          </button>
        </div>
      </div>

      <div 
        ref={targetRef} 
        className={`bg-white border-4 rounded-3xl shadow-xl transition-all duration-300 ${
          isComplete ? 'border-green-400 scale-105' : 'border-blue-50 hover:border-blue-100'
        }`}
        style={{ width: `${canvasSize}px`, height: `${canvasSize}px` }}
      ></div>

      <div className="mt-8 w-full">
        {isComplete ? (
          <button 
            onClick={handleNext}
            className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 shadow-lg animate-in zoom-in duration-300"
          >
            Next Word →
          </button>
        ) : (
          <p className="text-center text-gray-400 font-bold text-xs uppercase italic animate-pulse">
            Draw the character to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default DictationViewer;
