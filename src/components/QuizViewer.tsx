import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, setDoc, getDoc, increment } from 'firebase/firestore';

interface Word {
  word: string;
  pinyin: string;
  definition: string;
}

interface QuizViewerProps {
  words: Word[];
  user: User | null;
}

interface Question {
  word: Word;
  options: string[];
  correctIndex: number;
}

const QuizViewer: React.FC<QuizViewerProps> = ({ words, user }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const generateQuestions = useCallback(() => {
    if (words.length < 4) return;

    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(words.length, 10));

    const newQuestions = selected.map(word => {
      const otherWords = words.filter(w => w.word !== word.word);
      const distractors = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.definition);
      
      const options = [...distractors, word.definition].sort(() => Math.random() - 0.5);
      const correctIndex = options.indexOf(word.definition);

      return { word, options, correctIndex };
    });

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setAnswered(null);
    setSelectedOption(null);
    setQuizFinished(false);
  }, [words]);

  useEffect(() => {
    generateQuestions();
  }, [generateQuestions]);

  const saveProgress = async (finalScore: number, total: number) => {
    if (!user) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const progressRef = doc(userRef, 'stats', 'overall');
      
      const currentStats = await getDoc(progressRef);
      const data = currentStats.exists() ? currentStats.data() : { totalQuizzes: 0, totalCorrect: 0, totalQuestions: 0 };

      await setDoc(progressRef, {
        totalQuizzes: increment(1),
        totalCorrect: increment(finalScore),
        totalQuestions: increment(total),
        lastQuizDate: new Date().toISOString()
      }, { merge: true });
      
      console.log("Progress saved successfully");
    } catch (error) {
      console.error("Error saving progress", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (answered !== null) return;

    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === questions[currentIndex].correctIndex;
    setAnswered(isCorrect);
    
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswered(null);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
      if (user) {
        saveProgress(score, questions.length);
      }
    }
  };

  if (words.length < 4) {
    return (
      <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-lg">Not enough vocabulary words to generate a quiz. Please select more lessons!</p>
      </div>
    );
  }

  if (quizFinished) {
    return (
      <div className="text-center p-12 bg-white rounded-xl shadow-lg border-2 border-blue-100 max-w-md mx-auto">
        <h3 className="text-3xl font-bold text-blue-800 mb-4">Quiz Finished!</h3>
        <p className="text-5xl font-extrabold text-blue-600 mb-6">{score} / {questions.length}</p>
        <p className="text-gray-600 mb-8">
          {score === questions.length ? "Perfect score! You're a pro!" : "Great job practicing!"}
        </p>
        {user && (
          <div className="mb-6 text-sm text-green-600 font-medium italic">
            {saving ? "Saving your progress..." : "Progress saved to your Google account!"}
          </div>
        )}
        <button 
          onClick={generateQuestions}
          className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-gray-100 w-full">
          <div 
            className="h-full bg-blue-500 transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        <div className="flex justify-between items-center mb-10 mt-2">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Score: {score}</span>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-7xl font-bold text-gray-900 mb-4">{currentQuestion.word.word}</h2>
          <p className="text-xl text-gray-400 font-medium">{answered !== null ? currentQuestion.word.pinyin : '???'}</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {currentQuestion.options.map((option, index) => {
            let bgColor = 'bg-gray-50 hover:bg-gray-100 border-gray-200';
            let textColor = 'text-gray-700';
            
            if (answered !== null) {
              if (index === currentQuestion.correctIndex) {
                bgColor = 'bg-green-100 border-green-500 ring-2 ring-green-500';
                textColor = 'text-green-800';
              } else if (index === selectedOption) {
                bgColor = 'bg-red-100 border-red-500 ring-2 ring-red-500';
                textColor = 'text-red-800';
              } else {
                bgColor = 'bg-gray-50 opacity-50 border-gray-100';
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={answered !== null}
                className={`${bgColor} ${textColor} p-4 rounded-xl border-2 font-medium transition-all text-left flex justify-between items-center group`}
              >
                <span>{option}</span>
                {answered !== null && index === currentQuestion.correctIndex && (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                )}
                {answered !== null && index === selectedOption && index !== currentQuestion.correctIndex && (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                )}
              </button>
            );
          })}
        </div>

        {answered !== null && (
          <div className="mt-8 text-center animate-bounce">
            <button 
              onClick={handleNext}
              className="bg-blue-600 text-white px-10 py-3 rounded-full font-bold hover:bg-blue-700 shadow-lg"
            >
              {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizViewer;
