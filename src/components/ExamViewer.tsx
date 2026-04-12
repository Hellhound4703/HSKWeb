import React, { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import pastPapersData from '../data/past-papers.json';

interface Exam {
  id: string;
  level: number;
  year: string;
  sections: {
    listening: number;
    reading: number;
    writing?: number;
  };
  passingTotal: number;
}

interface ExamScore {
  listening: number;
  reading: number;
  writing?: number;
  total: number;
  date: string;
}

interface ExamViewerProps {
  user: User | null;
  level: number;
}

const ExamViewer: React.FC<ExamViewerProps> = ({ user, level }) => {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [scores, setScores] = useState<Record<string, ExamScore>>({});
  const [formData, setFormData] = useState({ listening: 0, reading: 0, writing: 0 });
  const [saving, setSaving] = useState(false);

  const levelExams = pastPapersData.filter(paper => paper.level === level);

  useEffect(() => {
    if (!user) return;

    const examsRef = collection(db, 'users', user.uid, 'exams');
    const unsubscribe = onSnapshot(examsRef, (snapshot) => {
      const newScores: Record<string, ExamScore> = {};
      snapshot.forEach(doc => {
        newScores[doc.id] = doc.data() as ExamScore;
      });
      setScores(newScores);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedExam) return;

    setSaving(true);
    const total = formData.listening + formData.reading + (selectedExam.sections.writing ? formData.writing : 0);
    const examScore: ExamScore = {
      ...formData,
      total,
      date: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'exams', `hsk${level}_${selectedExam.id}`), examScore);
      setSelectedExam(null);
      setFormData({ listening: 0, reading: 0, writing: 0 });
    } catch (error) {
      console.error("Error saving exam score:", error);
    } finally {
      setSaving(false);
    }
  };

  if (selectedExam) {
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=HSK+${level}+${selectedExam.id}+listening`;
    const googleSearchUrl = `https://www.google.com/search?q=HSK+${level}+${selectedExam.id}+test+paper+pdf`;

    return (
      <div className="max-w-2xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button 
          onClick={() => setSelectedExam(null)}
          className="mb-6 flex items-center text-blue-600 font-bold text-sm hover:underline"
        >
          ← Back to Papers
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8">
          <div className="bg-blue-600 p-8 text-white text-center">
            <h2 className="text-3xl font-black mb-2">{selectedExam.id}</h2>
            <p className="opacity-80 font-medium">Official HSK Level {level} Past Paper</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <a 
                href={youtubeSearchUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border-2 border-red-100 hover:bg-red-100 transition-all font-bold text-center"
              >
                <span className="text-2xl">📺</span>
                Find Listening Audio
              </a>
              <a 
                href={googleSearchUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-2xl border-2 border-blue-100 hover:bg-blue-100 transition-all font-bold text-center"
              >
                <span className="text-2xl">📄</span>
                Find Exam PDF
              </a>
            </div>

            <form onSubmit={handleSubmitScore} className="space-y-6">
              <h3 className="text-xl font-black text-gray-800 text-center mb-6">Log Your Scores</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Listening (/100)</label>
                  <input 
                    type="number" 
                    max="100" min="0"
                    required
                    value={formData.listening}
                    onChange={(e) => setFormData({...formData, listening: parseInt(e.target.value) || 0})}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Reading (/100)</label>
                  <input 
                    type="number" 
                    max="100" min="0"
                    required
                    value={formData.reading}
                    onChange={(e) => setFormData({...formData, reading: parseInt(e.target.value) || 0})}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all font-bold text-lg"
                  />
                </div>
                {selectedExam.sections.writing && (
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Writing (/100)</label>
                    <input 
                      type="number" 
                      max="100" min="0"
                      required
                      value={formData.writing}
                      onChange={(e) => setFormData({...formData, writing: parseInt(e.target.value) || 0})}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all font-bold text-lg"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 pb-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {levelExams.map((exam) => {
          const scoreKey = `hsk${level}_${exam.id}`;
          const pastScore = scores[scoreKey];
          const isPassed = pastScore && pastScore.total >= exam.passingTotal;

          return (
            <div key={exam.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black text-gray-800">{exam.id}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{exam.year} Edition</p>
                </div>
                {pastScore && (
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isPassed ? 'Passed' : 'Failed'}
                  </div>
                )}
              </div>

              {pastScore ? (
                <div className="mb-6 space-y-1">
                  <p className="text-2xl font-black text-blue-600">{pastScore.total} <span className="text-xs text-gray-400 font-bold">/ {exam.sections.writing ? 300 : 200}</span></p>
                  <p className="text-[10px] text-gray-400 font-medium">Last attempt: {new Date(pastScore.date).toLocaleDateString()}</p>
                </div>
              ) : (
                <div className="mb-6 flex items-center justify-center h-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No history</p>
                </div>
              )}

              <button 
                onClick={() => setSelectedExam(exam)}
                className="mt-auto py-3 bg-blue-50 text-blue-700 rounded-xl font-black text-sm hover:bg-blue-600 hover:text-white transition-all active:scale-95"
              >
                {pastScore ? 'Retake Exam' : 'Take Exam'}
              </button>
            </div>
          );
        })}
      </div>

      {!user && (
        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 text-yellow-700 rounded-r-xl">
          <p className="text-xs font-bold uppercase tracking-wider">⚠️ Login to save your scores</p>
        </div>
      )}
    </div>
  );
};

export default ExamViewer;
