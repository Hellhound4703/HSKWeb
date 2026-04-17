import { useState, useMemo, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import hsk1Data from './data/hsk1-data.json';
import hsk2Data from './data/hsk2-data.json';
import hsk3Data from './data/hsk3-data.json';
import hsk4Data from './data/hsk4-data.json';
import hsk5Data from './data/hsk5-data.json';
import hsk6Data from './data/hsk6-data.json';
import LessonSelector from './components/LessonSelector';
import FlashcardViewer from './components/FlashcardViewer';
import GrammarViewer from './components/GrammarViewer';
import QuizViewer from './components/QuizViewer';
import SRSViewer from './components/SRSViewer';
import ExamViewer from './components/ExamViewer';
import SentenceViewer from './components/SentenceViewer';
import GlobalSearch from './components/GlobalSearch';
import ProgressDashboard from './components/ProgressDashboard';
import Auth from './components/Auth';
import LessonReadingViewer from './components/LessonReadingViewer';
import DictationViewer from './components/DictationViewer';
import './App.css';

interface UserStats {
  xp: number;
  streak: number;
}

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
  hint?: string;
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
  5: hsk5Data,
  6: hsk6Data,
};

type LearningMode = 'vocabulary' | 'grammar' | 'reading' | 'dictation' | 'quiz' | 'srs' | 'sentences' | 'exams' | 'search' | 'progress';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [gamification, setGamification] = useState<UserStats>({ xp: 0, streak: 0 });
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

  // Listen for Gamification Stats
  useEffect(() => {
    if (!user) {
      setGamification({ xp: 0, streak: 0 });
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setGamification({
          xp: data.xp || 0,
          streak: data.streak || 0
        });
      }
    });
    return () => unsubscribe();
  }, [user]);

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

  const allWordsForLevel = useMemo(() => {
    const words: Word[] = [];
    lessons.forEach(lesson => words.push(...lesson.vocabulary));
    return words;
  }, [lessons]);

  const selectedLessonsData = useMemo(() => {
    return lessons.filter(lesson => selectedLessons.includes(lesson.lesson));
  }, [selectedLessons, lessons]);

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-12 px-2 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-12 gap-4 sm:gap-6 px-2">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-blue-800 mb-1 sm:mb-2">HSK Mastery</h1>
            <p className="text-gray-500 text-xs sm:text-base font-medium italic">Your personalized Chinese study app</p>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 shadow-sm animate-in slide-in-from-top-4">
                  <span className="text-lg">🔥</span>
                  <span className="font-black text-sm">{gamification.streak}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 shadow-sm animate-in slide-in-from-top-4 duration-300">
                  <span className="text-xs font-black uppercase tracking-tighter">XP</span>
                  <span className="font-black text-sm">{gamification.xp}</span>
                </div>
              </div>
            )}
            <Auth user={user} />
          </div>
        </header>

        <nav className="flex flex-col items-center mb-6 sm:mb-8 gap-3 sm:gap-6 sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm py-2 border-b border-transparent transition-all">
          <div className="flex justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 w-full no-scrollbar px-2">
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold transition-all whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${
                  selectedLevel === level
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                HSK {level}
              </button>
            ))}
          </div>

          <div className="w-full flex flex-col gap-2">
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 overflow-x-auto justify-start px-2 gap-1">
              {(['vocabulary', 'grammar', 'reading', 'dictation'] as LearningMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLearningMode(mode)}
                  className={`px-4 py-1.5 rounded-lg font-bold transition-all capitalize whitespace-nowrap text-xs flex-shrink-0 ${
                    learningMode === mode
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-600 bg-gray-50/50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 overflow-x-auto justify-start px-2 gap-1">
              {(['quiz', 'srs', 'sentences', 'exams', 'search', 'progress'] as LearningMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLearningMode(mode)}
                  className={`px-4 py-1.5 rounded-lg font-bold transition-all capitalize whitespace-nowrap text-xs flex-shrink-0 ${
                    learningMode === mode
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-600 bg-gray-50/50'
                  }`}
                >
                  {mode === 'srs' ? 'Review' : mode}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <main className="min-h-[60vh]">
          {learningMode !== 'progress' && learningMode !== 'srs' && learningMode !== 'exams' && learningMode !== 'sentences' && learningMode !== 'search' && (
            <LessonSelector 
              lessons={lessons} 
              selectedLessons={selectedLessons} 
              onToggle={handleToggleLesson}
              onToggleAll={handleToggleAll}
            />
          )}

          {!user && (learningMode === 'quiz' || learningMode === 'progress' || learningMode === 'srs' || learningMode === 'exams' || learningMode === 'sentences') && (
            <div className="mb-6 mx-2 bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 text-yellow-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              ⚠️ Sign in with Google to sync your progress!
            </div>
          )}

          {learningMode !== 'progress' && learningMode !== 'search' && (
            <div className="mb-4 text-[10px] sm:text-xs font-black text-blue-400 uppercase tracking-[0.2em] text-center">
              HSK {selectedLevel} Level • {learningMode} Mode
            </div>
          )}

          <div className="px-1 sm:px-0">
            {learningMode === 'vocabulary' && (
              <FlashcardViewer words={selectedWords} user={user} level={selectedLevel} />
            )}

            {learningMode === 'grammar' && (
              <GrammarViewer selectedLessonsData={selectedLessonsData} />
            )}

            {learningMode === 'reading' && (
              <LessonReadingViewer level={selectedLevel} selectedLessons={selectedLessons} allWords={allWordsForLevel} user={user} />
            )}

            {learningMode === 'dictation' && (
              <DictationViewer words={selectedWords} user={user} />
            )}

            {learningMode === 'quiz' && (
              <QuizViewer words={selectedWords} user={user} level={selectedLevel} />
            )}

            {learningMode === 'srs' && (
              <SRSViewer user={user} level={selectedLevel} allWords={allWordsForLevel} />
            )}

            {learningMode === 'sentences' && (
              <SentenceViewer user={user} level={selectedLevel} />
            )}

            {learningMode === 'exams' && (
              <ExamViewer user={user} level={selectedLevel} />
            )}

            {learningMode === 'search' && (
              <GlobalSearch />
            )}

            {learningMode === 'progress' && (
              <ProgressDashboard user={user} level={selectedLevel} />
            )}
          </div>
        </main>

        <footer className="mt-16 sm:mt-20 text-center text-gray-400 text-[10px] sm:text-xs border-t border-gray-200 pt-6 sm:pt-8 pb-8">
          <p>© 2026 HSK Mastery • Cloud Sync & Smart Study Tools</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
