import React, { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';

interface HandwritingPracticeProps {
  character: string;
  onClose: () => void;
}

const HandwritingPractice: React.FC<HandwritingPracticeProps> = ({ character, onClose }) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [isQuizzing, setIsQuizzing] = useState(false);
  const [canvasSize, setCanvasSize] = useState(250);

  useEffect(() => {
    // Responsive sizing
    const updateSize = () => {
      const width = window.innerWidth;
      const size = Math.min(250, width - 80);
      setCanvasSize(size);
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (targetRef.current && character) {
      targetRef.current.innerHTML = ''; // Clear previous
      writerRef.current = HanziWriter.create(targetRef.current, character[0], {
        width: canvasSize,
        height: canvasSize,
        padding: 5,
        showOutline: true,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 200,
        strokeColor: '#2563eb', // blue-600
      });
    }
  }, [character, canvasSize]);

  const handleAnimate = () => {
    setIsQuizzing(false);
    writerRef.current?.animateCharacter();
  };

  const handleQuiz = () => {
    setIsQuizzing(true);
    writerRef.current?.quiz();
  };

  const handleReset = () => {
    setIsQuizzing(false);
    writerRef.current?.cancelQuiz();
    writerRef.current?.showCharacter();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between w-full mb-4 items-center">
          <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Practice</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div 
          ref={targetRef} 
          className="bg-gray-50 border-2 border-gray-100 rounded-2xl mb-6 shadow-inner flex items-center justify-center overflow-hidden"
          style={{ width: `${canvasSize}px`, height: `${canvasSize}px` }}
        ></div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <button 
            onClick={handleAnimate}
            className="px-4 py-3 bg-blue-100 text-blue-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-200 transition-all active:scale-95 shadow-sm"
          >
            Animate
          </button>
          <button 
            onClick={handleQuiz}
            className="px-4 py-3 bg-green-100 text-green-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-200 transition-all active:scale-95 shadow-sm"
          >
            Quiz
          </button>
          <button 
            onClick={handleReset}
            className="col-span-2 px-4 py-2 bg-gray-50 text-gray-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
          >
            Clear / Reset
          </button>
        </div>

        <p className="mt-6 text-[10px] text-gray-400 text-center font-bold uppercase tracking-tighter">
          {isQuizzing ? "Follow the strokes!" : "Watch strokes or start a quiz"}
        </p>
      </div>
    </div>
  );
};

export default HandwritingPractice;
