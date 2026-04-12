import React from 'react';

interface Lesson {
  lesson: number;
  title: string;
}

interface LessonSelectorProps {
  lessons: Lesson[];
  selectedLessons: number[];
  onToggle: (lessonId: number) => void;
  onToggleAll: () => void;
}

const LessonSelector: React.FC<LessonSelectorProps> = ({ 
  lessons, 
  selectedLessons, 
  onToggle, 
  onToggleAll 
}) => {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mb-6 sm:mb-8 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base sm:text-xl font-bold text-gray-800">Lessons</h3>
        <button 
          onClick={onToggleAll}
          className="text-blue-500 hover:text-blue-700 text-xs sm:text-sm font-bold transition-colors uppercase tracking-wider"
        >
          {selectedLessons.length === lessons.length ? 'None' : 'All'}
        </button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
        {lessons.map((lesson) => (
          <button
            key={lesson.lesson}
            onClick={() => onToggle(lesson.lesson)}
            className={`py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 border-2 ${
              selectedLessons.includes(lesson.lesson)
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-gray-50 text-gray-500 border-transparent hover:border-gray-200'
            }`}
          >
            {lesson.lesson}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LessonSelector;
