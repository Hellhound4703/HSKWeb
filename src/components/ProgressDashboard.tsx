import React, { useEffect, useState } from 'react';
import { type User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface ProgressDashboardProps {
  user: User | null;
  level: number;
}

interface UserStats {
  totalQuizzes: number;
  totalCorrect: number;
  totalQuestions: number;
  lastQuizDate?: string;
}

interface VocabularyStats {
  learned: string[];
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ user, level }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [vocab, setVocab] = useState<VocabularyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setStats(null);
    setVocab(null);

    const progressRef = doc(db, 'users', user.uid, 'stats', `hsk${level}_overall`);
    const vocabRef = doc(db, 'users', user.uid, 'stats', `hsk${level}_vocabulary`);

    const unsubStats = onSnapshot(progressRef, 
      (doc) => {
        if (doc.exists()) {
          setStats(doc.data() as UserStats);
        } else {
          setStats(null);
        }
      },
      (err) => {
        console.error("Firestore Stats Error:", err);
        setError("Could not load stats. Please check your Firestore rules.");
        setLoading(false);
      }
    );

    const unsubVocab = onSnapshot(vocabRef, 
      (doc) => {
        if (doc.exists()) {
          setVocab(doc.data() as VocabularyStats);
        } else {
          setVocab(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore Vocab Error:", err);
        setError("Could not load vocabulary progress.");
        setLoading(false);
      }
    );

    return () => {
      unsubStats();
      unsubVocab();
    };
  }, [user, level]);

  if (!user) {
    return (
      <div className="text-center p-8 sm:p-12 bg-white rounded-xl shadow-md border border-gray-200 max-w-lg mx-auto mx-4">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Sign in to track progress</h3>
        <p className="text-sm sm:text-base text-gray-600">
          Unlock your personal dashboard, save quiz scores, and see how much you've learned.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 sm:p-20">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium text-sm sm:text-base">Fetching HSK {level} progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-xl border border-red-200 max-w-lg mx-auto mx-4">
        <h3 className="text-lg sm:text-xl font-bold text-red-800 mb-2">Something went wrong</h3>
        <p className="text-sm sm:text-red-600 mb-4">{error}</p>
        <p className="text-xs text-red-500 italic leading-relaxed">
          Ensure Firestore Database is enabled in Firebase Console and rules allow access.
        </p>
      </div>
    );
  }

  const accuracy = stats && stats.totalQuestions > 0 
    ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) 
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-2">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-blue-50">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-8 text-center sm:text-left">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
            alt={user.displayName || 'User'} 
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-4 ring-blue-100"
          />
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{user.displayName}</h2>
            <p className="text-blue-600 font-bold uppercase tracking-wider text-xs sm:text-sm">HSK Level {level} Mastery</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-blue-50 p-4 sm:p-6 rounded-xl text-center border border-blue-100">
            <p className="text-[10px] sm:text-sm font-bold text-blue-400 uppercase tracking-widest mb-1">Learned</p>
            <p className="text-2xl sm:text-4xl font-black text-blue-700">{vocab?.learned?.length || 0}</p>
            <p className="text-[8px] sm:text-xs text-blue-400 mt-1 font-bold">WORDS</p>
          </div>
          <div className="bg-purple-50 p-4 sm:p-6 rounded-xl text-center border border-purple-100">
            <p className="text-[10px] sm:text-sm font-bold text-purple-400 uppercase tracking-widest mb-1">Quizzes</p>
            <p className="text-2xl sm:text-4xl font-black text-purple-700">{stats?.totalQuizzes || 0}</p>
            <p className="text-[8px] sm:text-xs text-purple-400 mt-1 font-bold">TOTAL</p>
          </div>
          <div className="bg-green-50 p-4 sm:p-6 rounded-xl text-center border border-green-100">
            <p className="text-[10px] sm:text-sm font-bold text-green-400 uppercase tracking-widest mb-1">Accuracy</p>
            <p className="text-2xl sm:text-4xl font-black text-green-700">{accuracy}%</p>
            <p className="text-[8px] sm:text-xs text-green-400 mt-1 font-bold">AVG SCORE</p>
          </div>
          <div className="bg-orange-50 p-4 sm:p-6 rounded-xl text-center border border-orange-100">
            <p className="text-[10px] sm:text-sm font-bold text-orange-400 uppercase tracking-widest mb-1">Questions</p>
            <p className="text-2xl sm:text-4xl font-black text-orange-700">{stats?.totalQuestions || 0}</p>
            <p className="text-[8px] sm:text-xs text-orange-400 mt-1 font-bold">ANSWERED</p>
          </div>
        </div>
      </div>

      {!stats && !vocab && (
        <div className="text-center p-8 sm:p-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 text-base sm:text-lg mb-2">No HSK {level} history found.</p>
          <p className="text-xs sm:text-sm text-gray-400">Mark some words as learned or finish a quiz to see your progress here!</p>
        </div>
      )}

      {stats?.lastQuizDate && (
        <div className="text-center text-[10px] sm:text-sm text-gray-400 font-medium">
          Last HSK {level} session: {new Date(stats.lastQuizDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default ProgressDashboard;
