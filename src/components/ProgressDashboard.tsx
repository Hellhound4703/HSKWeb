import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface ProgressDashboardProps {
  user: User | null;
}

interface UserStats {
  totalQuizzes: number;
  totalCorrect: number;
  totalQuestions: number;
  lastQuizDate?: string;
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const progressRef = doc(db, 'users', user.uid, 'stats', 'overall');
    const unsubscribe = onSnapshot(progressRef, (doc) => {
      if (doc.exists()) {
        setStats(doc.data() as UserStats);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="text-center p-12 bg-white rounded-xl shadow-md border border-gray-200 max-w-lg mx-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Sign in to track progress</h3>
        <p className="text-gray-600">
          Unlock your personal dashboard, save quiz scores, and see how much you've learned.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center p-12">Loading stats...</div>;
  }

  const accuracy = stats && stats.totalQuestions > 0 
    ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) 
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-50">
        <div className="flex items-center gap-6 mb-8">
          <img 
            src={user.photoURL || ''} 
            alt={user.displayName || 'User'} 
            className="w-20 h-20 rounded-full ring-4 ring-blue-100"
          />
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">{user.displayName}</h2>
            <p className="text-gray-500">Learning HSK Level 1-4</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-xl text-center">
            <p className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-1">Quizzes Taken</p>
            <p className="text-4xl font-black text-blue-700">{stats?.totalQuizzes || 0}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-xl text-center">
            <p className="text-sm font-bold text-green-400 uppercase tracking-widest mb-1">Quiz Accuracy</p>
            <p className="text-4xl font-black text-green-700">{accuracy}%</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-xl text-center">
            <p className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-1">Total Questions</p>
            <p className="text-4xl font-black text-purple-700">{stats?.totalQuestions || 0}</p>
          </div>
        </div>
      </div>

      {!stats && (
        <div className="text-center p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500">Take your first quiz to see detailed statistics!</p>
        </div>
      )}

      {stats?.lastQuizDate && (
        <div className="text-center text-sm text-gray-400">
          Last study session: {new Date(stats.lastQuizDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default ProgressDashboard;
