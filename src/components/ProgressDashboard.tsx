import React, { useEffect, useState } from 'react';
import { type User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

interface ProgressDashboardProps {
  user: User | null;
  level: number;
}

interface UserStats {
  totalQuizzes: number;
  totalCorrect: number;
  totalQuestions: number;
  lastQuizDate?: string;
  studyDates?: string[]; // Array of YYYY-MM-DD
}

interface VocabularyStats {
  learned: string[];
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ user, level }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [vocab, setVocab] = useState<VocabularyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const progressRef = doc(db, 'users', user.uid, 'stats', `hsk${level}_overall`);
    const vocabRef = doc(db, 'users', user.uid, 'stats', `hsk${level}_vocabulary`);

    // Log today's study date
    const logStudyDate = async () => {
      const today = new Date().toISOString().split('T')[0];
      const snap = await getDoc(progressRef);
      if (!snap.exists()) {
        await setDoc(progressRef, { studyDates: [today] }, { merge: true });
      } else {
        const data = snap.data() as UserStats;
        if (!data.studyDates?.includes(today)) {
          await updateDoc(progressRef, { studyDates: arrayUnion(today) });
        }
      }
    };
    logStudyDate();

    const unsubStats = onSnapshot(progressRef, (doc) => {
      if (doc.exists()) setStats(doc.data() as UserStats);
    });

    const unsubVocab = onSnapshot(vocabRef, (doc) => {
      if (doc.exists()) setVocab(doc.data() as VocabularyStats);
      setLoading(false);
    });

    return () => {
      unsubStats();
      unsubVocab();
    };
  }, [user, level]);

  const generateHeatmap = () => {
    const today = new Date();
    const days = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasStudied = stats?.studyDates?.includes(dateStr);
      days.push({ date: dateStr, active: hasStudied });
    }
    return days;
  };

  const getAchievements = () => {
    const achievements = [];
    if ((vocab?.learned?.length || 0) >= 10) achievements.push({ icon: '🥉', label: 'Beginner' });
    if ((vocab?.learned?.length || 0) >= 50) achievements.push({ icon: '🥈', label: 'Scholar' });
    if ((vocab?.learned?.length || 0) >= 100) achievements.push({ icon: '🥇', label: 'Master' });
    if ((stats?.totalQuizzes || 0) >= 5) achievements.push({ icon: '🔥', label: '5 Quizzes' });
    return achievements;
  };

  if (!user) {
    return (
      <div className="text-center p-8 sm:p-12 bg-white rounded-xl shadow-md border border-gray-200 max-w-lg mx-auto">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Sign in to track progress</h3>
        <p className="text-sm sm:text-base text-gray-600">Unlock your personal dashboard, Spaced Repetition, and study heatmap.</p>
      </div>
    );
  }

  if (loading) return <div className="text-center p-12">Loading HSK {level} progress...</div>;

  const accuracy = stats && stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0;
  const heatmapDays = generateHeatmap();
  const achievements = getAchievements();

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-2 pb-12">
      {/* Stats Grid */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-blue-50">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-8 text-center sm:text-left">
          <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Avatar" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-4 ring-blue-100" />
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{user.displayName}</h2>
            <p className="text-blue-600 font-bold uppercase tracking-wider text-xs sm:text-sm">HSK Level {level} Mastery</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-blue-50 p-4 sm:p-6 rounded-xl text-center border border-blue-100">
            <p className="text-[10px] sm:text-sm font-bold text-blue-400 uppercase tracking-widest mb-1">Learned</p>
            <p className="text-2xl sm:text-4xl font-black text-blue-700">{vocab?.learned?.length || 0}</p>
          </div>
          <div className="bg-purple-50 p-4 sm:p-6 rounded-xl text-center border border-purple-100">
            <p className="text-[10px] sm:text-sm font-bold text-purple-400 uppercase tracking-widest mb-1">Quizzes</p>
            <p className="text-2xl sm:text-4xl font-black text-purple-700">{stats?.totalQuizzes || 0}</p>
          </div>
          <div className="bg-green-50 p-4 sm:p-6 rounded-xl text-center border border-green-100">
            <p className="text-[10px] sm:text-sm font-bold text-green-400 uppercase tracking-widest mb-1">Accuracy</p>
            <p className="text-2xl sm:text-4xl font-black text-green-700">{accuracy}%</p>
          </div>
          <div className="bg-orange-50 p-4 sm:p-6 rounded-xl text-center border border-orange-100">
            <p className="text-[10px] sm:text-sm font-bold text-orange-400 uppercase tracking-widest mb-1">Questions</p>
            <p className="text-2xl sm:text-4xl font-black text-orange-700">{stats?.totalQuestions || 0}</p>
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Activity (Last 4 Weeks)</h3>
        <div className="grid grid-cols-7 gap-2 max-w-xs mx-auto sm:max-w-none sm:grid-cols-14 lg:grid-cols-28">
          {heatmapDays.map((day, idx) => (
            <div 
              key={idx} 
              title={day.date}
              className={`aspect-square rounded-[2px] sm:rounded-sm transition-colors ${day.active ? 'bg-green-500' : 'bg-gray-100'}`}
            ></div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Badges & Achievements</h3>
        <div className="flex flex-wrap gap-4">
          {achievements.map((ach, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 p-4 bg-yellow-50 rounded-2xl border border-yellow-100 min-w-[80px] animate-in zoom-in duration-500">
              <span className="text-3xl">{ach.icon}</span>
              <span className="text-[10px] font-bold text-yellow-800 uppercase text-center">{ach.label}</span>
            </div>
          ))}
          {achievements.length === 0 && (
            <p className="text-gray-400 text-sm italic">Keep studying to unlock your first badge!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
