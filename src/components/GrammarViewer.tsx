import React from 'react';

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
      <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-lg">No grammar points found for the selected lessons. Try selecting Lesson 1 or 2!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {allGrammar.map((g, index) => (
        <div key={index} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-600">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-gray-900">{g.point}</h3>
            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">Lesson {g.lesson}</span>
          </div>
          <p className="text-gray-700 mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100">
            {g.explanation}
          </p>
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Examples</h4>
            {g.examples.map((ex, i) => (
              <div key={i} className="pl-4 border-l-2 border-gray-200">
                <p className="text-lg font-medium text-gray-900">{ex.chinese}</p>
                <p className="text-gray-500 italic text-sm">{ex.pinyin}</p>
                <p className="text-gray-700">{ex.english}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GrammarViewer;
