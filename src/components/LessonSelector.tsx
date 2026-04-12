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
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Select Lessons to Study</h3>
        <button 
          onClick={onToggleAll}
          className="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors"
        >
          {selectedLessons.length === lessons.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {lessons.map((lesson) => (
          <button
            key={lesson.lesson}
            onClick={() => onToggle(lesson.lesson)}
            className={`px-4 py-2 rounded-md text-sm transition-all duration-200 ${
              selectedLessons.includes(lesson.lesson)
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Lesson {lesson.lesson}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LessonSelector;
