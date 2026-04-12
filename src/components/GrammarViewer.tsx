import React from 'react';
import { speakChinese } from '../utils/audio';

interface GrammarExample {
  chinese: string;
  pinyin: string;
  english: string;
}

interface GrammarPoint {
  point: string;
  explanation: string;
  examples: GrammarExample[];
}

interface Lesson {
  lesson: number;
  title: string;
  grammar?: GrammarPoint[];
}

interface GrammarViewerProps {
  selectedLessonsData: Lesson[];
}

const GrammarViewer: React.FC<GrammarViewerProps> = ({ selectedLessonsData }) => {
  const allGrammar = selectedLessonsData.flatMap(lesson => 
    lesson.grammar ? lesson.grammar.map(g => ({ ...g, lesson: lesson.lesson })) : []
  );

  if (allGrammar.length === 0) {
    return (
      <div className="text-center p-8 sm:p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mx-2">
        <p className="text-gray-500 text-base sm:text-lg">No grammar points found for these lessons yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-2xl mx-auto px-2 sm:px-0">
      {allGrammar.map((g, index) => (
        <div key={index} className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border-l-4 border-blue-600 border border-gray-100">
          <div className="flex justify-between items-start mb-3 gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{g.point}</h3>
            <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded whitespace-nowrap">L {g.lesson}</span>
          </div>
          <p className="text-sm sm:text-base text-gray-700 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
            {g.explanation}
          </p>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Examples</h4>
            {g.examples.map((ex, i) => (
              <div key={i} className="pl-4 border-l-2 border-blue-100">
                <div className="flex justify-between items-start">
                  <p className="text-base sm:text-lg font-bold text-gray-900">{ex.chinese}</p>
                  <button 
                    onClick={() => speakChinese(ex.chinese)}
                    className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors ml-2"
                    title="Play Audio"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-400 italic text-xs mb-1">{ex.pinyin}</p>
                <p className="text-gray-600 text-sm sm:text-base">{ex.english}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GrammarViewer;
