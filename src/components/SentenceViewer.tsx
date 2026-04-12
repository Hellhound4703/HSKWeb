import React, { useState, useEffect, useCallback } from 'react';
import { type User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, setDoc, increment, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import sentenceData from '../data/sentences-data.json';
import { speakChinese } from '../utils/audio';

interface SentenceExercise {
  id: string;
  level: number;
  type: 'reorder' | 'fill';
  parts?: string[];
  sentencePrefix?: string;
  blankPinyin?: string;
  sentenceSuffix?: string;
  translation: string;
  answer: string; // For reorder, this is the concatenated string
  correct?: string; // Legacy field
}

interface SentenceViewerProps {
  user: User | null;
  level: number;
}

const SentenceViewer: React.FC<SentenceViewerProps> = ({ user, level }) => {
  const [exercises, setExercises] = useState<SentenceExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userReorder, setUserReorder] = useState<string[]>([]);
  const [userFill, setUserFill] = useState('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const initExercises = useCallback(() => {
    const filtered = (sentenceData as any[]).filter(ex => ex.level === level) as SentenceExercise[];
    const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 10);
    setExercises(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setFinished(false);
    resetCurrentState(shuffled[0]);
  }, [level]);

  useEffect(() => {
    initExercises();
  }, [initExercises]);

  const resetCurrentState = (exercise: SentenceExercise | undefined) => {
    if (!exercise) return;
    setUserReorder([]);
    setUserFill('');
    setFeedback(null);
  };

  const handleReorderClick = (part: string, index: number, isRemoving: boolean) => {
    if (feedback) return;
    if (isRemoving) {
      setUserReorder(userReorder.filter((_, i) => i !== index));
    } else {
      setUserReorder([...userReorder, part]);
    }
  };

  const checkAnswer = async () => {
    const current = exercises[currentIndex];
    const fullAnswer = current.correct || current.answer;
    let isCorrect = false;

    if (current.type === 'reorder') {
      const userAnswer = userReorder.join('');
      isCorrect = userAnswer === fullAnswer;
    } else {
      isCorrect = userFill.trim() === current.answer;
    }

    if (isCorrect) {
      setScore(score + 1);
      setFeedback({ isCorrect: true, message: 'Correct! Well done.' });
      speakChinese(fullAnswer);
    } else {
      setFeedback({ isCorrect: false, message: `Incorrect. The correct answer is: ${fullAnswer}` });
    }

    // Mistake tracking
    if (user) {
      try {
        const mistakeRef = doc(db, 'users', user.uid, 'stats', `hsk${level}_mistakes`);
        await setDoc(mistakeRef, {}, { merge: true });
        await updateDoc(mistakeRef, {
          sentences: isCorrect 
            ? arrayRemove(current.id) 
            : arrayUnion(current.id)
        });
      } catch (e) {
        console.error("Error logging mistake", e);
      }
    }
  };

  const nextQuestion = async () => {
    if (currentIndex < exercises.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      resetCurrentState(exercises[nextIdx]);
    } else {
      setFinished(true);
      if (user) {
        try {
          const statsRef = doc(db, 'users', user.uid, 'stats', `hsk${level}_sentences`);
          await setDoc(statsRef, {
            totalSessions: increment(1),
            totalCorrect: increment(score),
            lastSessionDate: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.error("Error saving sentence progress", e);
        }
      }
    }
  };

  if (exercises.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md mx-auto">
        <p className="text-gray-500 font-bold">No sentence practice available for HSK {level} yet.</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="text-center p-12 bg-white rounded-3xl shadow-xl border-2 border-blue-50 max-w-md mx-auto">
        <h3 className="text-3xl font-black text-blue-800 mb-4">Finished!</h3>
        <p className="text-5xl font-black text-blue-600 mb-6">{score} / {exercises.length}</p>
        <button 
          onClick={initExercises}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  const current = exercises[currentIndex];
  const fullSentenceText = current.type === 'fill' ? `${current.sentencePrefix}${current.answer}${current.sentenceSuffix}` : (current.correct || current.answer);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question {currentIndex + 1} / {exercises.length}</span>
        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Score: {score}</span>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-10 mb-8 relative">
        <div className="mb-8 text-center">
          <p className="text-sm sm:text-lg text-gray-500 italic mb-2">"{current.translation}"</p>
          <div className="h-1 w-12 bg-blue-100 mx-auto rounded-full"></div>
        </div>

        {current.type === 'reorder' ? (
          <div className="space-y-10">
            <div className="min-h-[100px] p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-wrap gap-2 items-center justify-center">
              {userReorder.map((part, idx) => (
                <button
                  key={idx}
                  onClick={() => handleReorderClick(part, idx, true)}
                  disabled={!!feedback}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95 text-lg"
                >
                  {part}
                </button>
              ))}
              {userReorder.length === 0 && <p className="text-gray-300 font-bold uppercase tracking-widest text-xs">Tap words below</p>}
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {current.parts?.map((part, idx) => {
                const countInAnswer = userReorder.filter(p => p === part).length;
                const totalInParts = current.parts?.filter(p => p === part).length || 0;
                const isUsed = countInAnswer >= totalInParts;

                return (
                  <button
                    key={idx}
                    onClick={() => handleReorderClick(part, idx, false)}
                    disabled={isUsed || !!feedback}
                    className={`px-4 py-2 rounded-xl font-bold border-2 transition-all text-lg ${
                      isUsed 
                        ? 'bg-gray-100 text-transparent border-transparent' 
                        : 'bg-white text-gray-700 border-gray-100 hover:border-blue-200 hover:shadow-sm active:scale-95'
                    }`}
                  >
                    {part}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-8 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-800 leading-loose flex flex-wrap justify-center items-center gap-2">
              <span>{current.sentencePrefix}</span>
              <div className="relative inline-block group">
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-black text-blue-400 opacity-60 uppercase tracking-tighter">
                  {current.blankPinyin}
                </span>
                <input 
                  type="text"
                  value={userFill}
                  onChange={(e) => setUserFill(e.target.value)}
                  disabled={!!feedback}
                  placeholder="..."
                  className="w-24 sm:w-32 border-b-4 border-blue-200 outline-none text-center focus:border-blue-500 transition-all bg-transparent font-black"
                />
              </div>
              <span>{current.sentenceSuffix}</span>
            </div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Type the character</p>
          </div>
        )}

        {feedback && (
          <div className={`mt-10 p-6 rounded-2xl border-2 animate-in zoom-in duration-300 relative ${feedback.isCorrect ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{feedback.isCorrect ? '✅' : '❌'}</span>
                <p className="font-black uppercase tracking-wider text-sm">{feedback.isCorrect ? 'Correct!' : 'Keep practicing'}</p>
              </div>
              <button 
                onClick={() => speakChinese(fullSentenceText)}
                className="p-2 bg-white/50 text-current rounded-full hover:bg-white/80 transition-colors"
                title="Play Full Sentence"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>
            <p className="font-medium">{feedback.message}</p>
          </div>
        )}

        <div className="mt-10">
          {!feedback ? (
            <button 
              onClick={checkAnswer}
              disabled={(current.type === 'reorder' && userReorder.length === 0) || (current.type === 'fill' && !userFill)}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-black transition-all active:scale-95 disabled:opacity-30"
            >
              Check Answer
            </button>
          ) : (
            <button 
              onClick={nextQuestion}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-blue-700 transition-all active:scale-95 animate-pulse"
            >
              {currentIndex === exercises.length - 1 ? 'Finish' : 'Next Question'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SentenceViewer;
