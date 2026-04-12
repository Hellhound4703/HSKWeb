import { useState, useMemo, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import hsk1Data from './data/hsk1-data.json';
import hsk2Data from './data/hsk2-data.json';
import hsk3Data from './data/hsk3-data.json';
import hsk4Data from './data/hsk4-data.json';
import LessonSelector from './components/LessonSelector';
import FlashcardViewer from './components/FlashcardViewer';
import GrammarViewer from './components/GrammarViewer';
import QuizViewer from './components/QuizViewer';
import ProgressDashboard from './components/ProgressDashboard';
import Auth from './components/Auth';
import './App.css';

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

interface Word {
  word: string;
  pinyin: string;
  definition: string;
}

interface Lesson {
  lesson: number;
  title: string;
  vocabulary: Word[];
  grammar?: GrammarPoint[];
}

const levelDataMap: Record<number, any> = {
  1: hsk1Data,
  2: hsk2Data,
  3: hsk3Data,
  4: hsk4Data,
};

type LearningMode = 'vocabulary' | 'grammar' | 'quiz' | 'progress';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(2);
  const [selectedLessons, setSelectedLessons] = useState<number[]>([1]);
  const [learningMode, setLearningMode] = useState<LearningMode>('vocabulary');

  const lessons: Lesson[] = levelDataMap[selectedLevel];

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Reset selected lessons when level changes
  useEffect(() => {
    setSelectedLessons([1]);
  }, [selectedLevel]);

  const handleToggleLesson = (lessonId: number) => {
    setSelectedLessons(prev => 
      prev.includes(lessonId) 
        ? prev.filter(id => id !== lessonId) 
        : [...prev, lessonId]
    );
  };

  const handleToggleAll = () => {
    if (selectedLessons.length === lessons.length) {
      setSelectedLessons([]);
    } else {
      setSelectedLessons(lessons.map(l => l.lesson));
    }
  };

  const selectedWords = useMemo(() => {
    const words: Word[] = [];
    lessons.forEach(lesson => {
      if (selectedLessons.includes(lesson.lesson)) {
        words.push(...lesson.vocabulary);
      }
    });
    return words;
  }, [selectedLessons, lessons]);

  const selectedLessonsData = useMemo(() => {
    return lessons.filter(lesson => selectedLessons.includes(lesson.lesson));
  }, [selectedLessons, lessons]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-extrabold text-blue-800 mb-2">HSK Flashcards</h1>
            <p className="text-gray-600 font-medium">Textbook Mastery with Audio & Grammar</p>
          </div>
          <Auth user={user} />
        </header>

        <nav className="flex flex-col items-center mb-8 gap-6">
          <div className="flex justify-center gap-2 overflow-x-auto pb-2 w-full sm:w-auto">
            {[1, 2, 3, 4].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                  selectedLevel === level
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                HSK {level}
              </button>
            ))}
          </div>

          <div className="flex bg-white p-1 rounded-xl shadow-inner border border-gray-200 overflow-x-auto w-full sm:w-auto">
            {(['vocabulary', 'grammar', 'quiz', 'progress'] as LearningMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setLearningMode(mode)}
                className={`px-8 py-2 rounded-lg font-semibold transition-all capitalize whitespace-nowrap ${
                  learningMode === mode
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </nav>

        <main>
          {learningMode !== 'progress' && (
            <LessonSelector 
              lessons={lessons} 
              selectedLessons={selectedLessons} 
              onToggle={handleToggleLesson}
              onToggleAll={handleToggleAll}
            />
          )}

          {!user && (learningMode === 'quiz' || learningMode === 'progress') && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 text-yellow-700 text-sm font-medium">
              Note: Sign in with Google to save your scores and track your progress!
            </div>
          )}

          {learningMode !== 'progress' && (
            <div className="mb-4 text-sm font-bold text-blue-600 uppercase tracking-widest text-center">
              HSK {selectedLevel} • {learningMode}
            </div>
          )}

          {learningMode === 'vocabulary' && (
            <FlashcardViewer words={selectedWords} user={user} />
          )}

          {learningMode === 'grammar' && (
            <GrammarViewer selectedLessonsData={selectedLessonsData} />
          )}

          {learningMode === 'quiz' && (
            <QuizViewer words={selectedWords} user={user} />
          )}

          {learningMode === 'progress' && (
            <ProgressDashboard user={user} />
          )}
        </main>

        <footer className="mt-20 text-center text-gray-400 text-sm border-t border-gray-200 pt-8">
          <p>© 2026 HSK Mastery App • Powered by Textbook Data & Audio</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
