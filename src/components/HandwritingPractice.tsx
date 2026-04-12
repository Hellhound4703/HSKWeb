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

  useEffect(() => {
    if (targetRef.current && character) {
      targetRef.current.innerHTML = ''; // Clear previous
      writerRef.current = HanziWriter.create(targetRef.current, character[0], {
        width: 250,
        height: 250,
        padding: 5,
        showOutline: true,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 200,
        strokeColor: '#2563eb', // blue-600
      });
    }
  }, [character]);

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
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs flex flex-col items-center animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between w-full mb-4">
          <h3 className="text-lg font-bold text-gray-800">Practice Writing</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div 
          ref={targetRef} 
          className="bg-gray-50 border-2 border-gray-100 rounded-xl mb-6 shadow-inner"
          style={{ width: '250px', height: '250px' }}
        ></div>

        <div className="grid grid-cols-2 gap-2 w-full">
          <button 
            onClick={handleAnimate}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold text-sm hover:bg-blue-200 transition-colors"
          >
            Animate
          </button>
          <button 
            onClick={handleQuiz}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold text-sm hover:bg-green-200 transition-colors"
          >
            Quiz Me
          </button>
          <button 
            onClick={handleReset}
            className="col-span-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>

        <p className="mt-4 text-[10px] text-gray-400 text-center italic">
          {isQuizzing ? "Follow the strokes to write!" : "Watch the animation or start a quiz."}
        </p>
      </div>
    </div>
  );
};

export default HandwritingPractice;
