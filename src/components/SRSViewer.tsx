import React, { useState, useEffect, useCallback } from 'react';
import { type User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, setDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import Flashcard from './Flashcard';
import { speakChinese, stopChineseAudio } from '../utils/audio';
import { awardXP } from '../utils/gamification';

interface Word {
  word: string;
  pinyin: string;
  definition: string;
  hint?: string;
  type?: 'word' | 'sentence';
}

interface SRSData {
  word: string;
  nextReview: Timestamp;
  interval: number; // in days
  easeFactor: number;
  repetitions: number;
  level: number;
}

interface SRSViewerProps {
  user: User | null;
  level: number; // The active HSK level the user selected
  allWords: Word[]; // All words for the current HSK level
}

const SRSViewer: React.FC<SRSViewerProps> = ({ user, level, allWords }) => {
  const [queue, setQueue] = useState<{word: Word, srs: SRSData}[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<{totalInDb: number, due: number}>({ totalInDb: 0, due: 0 });
  const [isInstant, setIsInstant] = useState(false);
  const [srsType, setSrsType] = useState<'vocabulary' | 'sentences'>('vocabulary');

  const fetchSRSQueue = useCallback(async (forceAll = false) => {
    if (!user) return;
    setLoading(true);
    setIsInstant(forceAll);
    try {
      const collectionName = srsType === 'vocabulary' ? `hsk${level}_srs` : `hsk${level}_sentences_srs`;
      const srsRef = collection(db, 'users', user.uid, collectionName);
      const querySnapshot = await getDocs(srsRef);
      const now = new Date();
      
      const dueItems: {word: Word, srs: SRSData}[] = [];
      const srsMap = new Map<string, SRSData>();
      let total = 0;
      
      querySnapshot.forEach((doc) => {
        total++;
        const data = doc.data() as SRSData;
        if (forceAll || data.nextReview.toDate() <= now) {
          srsMap.set(data.word, data);
        }
      });

      setDebugInfo({ totalInDb: total, due: srsMap.size });

      if (srsType === 'vocabulary') {
        // Match SRS data with Word definitions from the local JSON
        allWords.forEach(w => {
          if (srsMap.has(w.word)) {
            dueItems.push({ word: w, srs: srsMap.get(w.word)! });
          }
        });
      } else {
        // Sentences are self-contained in DB
        srsMap.forEach((data, text) => {
          dueItems.push({ 
            word: { word: text, pinyin: '', definition: 'Contextual Sentence', type: 'sentence' }, 
            srs: data 
          });
        });
      }

      // Shuffle the due items
      setQueue(dueItems.sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
      setFlipped(false);
    } catch (error) {
      console.error("Error fetching SRS queue:", error);
    } finally {
      setLoading(false);
    }
  }, [user, level, allWords, srsType]);

  useEffect(() => {
    fetchSRSQueue(false);
  }, [fetchSRSQueue]);

  const handleGrade = async (grade: 'again' | 'hard' | 'good' | 'easy') => {
    if (!user || !queue[currentIndex]) return;

    const current = queue[currentIndex];
    let { interval, repetitions } = current.srs;

    if (grade === 'again') {
      interval = 1;
      repetitions = 0;
    } else {
      repetitions += 1;
      const multipliers = { hard: 1.2, good: 1.5, easy: 2.0 };
      interval = Math.max(1, Math.round(interval * multipliers[grade as keyof typeof multipliers]));
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    const updatedSRS: SRSData = {
      ...current.srs,
      interval,
      repetitions,
      nextReview: Timestamp.fromDate(nextReview)
    };

    try {
      const collectionName = srsType === 'vocabulary' ? `hsk${level}_srs` : `hsk${level}_sentences_srs`;
      await setDoc(doc(db, 'users', user.uid, collectionName, current.word.word), updatedSRS);
      awardXP(user.uid, 5); // 5 XP per review
      
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setFlipped(false);
        stopChineseAudio();
      } else {
        setQueue([]); // Queue finished
        setDebugInfo(prev => ({ ...prev, due: Math.max(0, prev.due - 1) }));
        stopChineseAudio();
      }
    } catch (error) {
      console.error("Error saving SRS progress:", error);
    }
  };

  if (!user) {
    return (
      <div className="text-center p-12 bg-white rounded-xl shadow-md border border-gray-200">
        <h3 className="text-xl font-bold mb-2">Sign in to use SRS</h3>
        <p className="text-gray-500">Spaced Repetition helps you remember words forever by reviewing them at the perfect time.</p>
      </div>
    );
  }

  if (loading) return <div className="text-center p-12">Loading your review queue...</div>;

  if (queue.length === 0) {
    return (
      <div className="text-center p-12 bg-green-50 rounded-xl border-2 border-dashed border-green-200 mx-2">
        <h3 className="text-2xl font-bold text-green-800 mb-2">All Caught Up! 🎉</h3>
        <p className="text-green-600 mb-2">You have no words due for review in HSK {level}.</p>
        <p className="text-xs text-gray-400 mb-6 font-medium">
          Words in your HSK {level} library: {debugInfo.totalInDb} | Due for review: {debugInfo.due}
        </p>
        
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <button 
            onClick={() => fetchSRSQueue(false)}
            className="px-6 py-2 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-all shadow-md active:scale-95"
          >
            Check Again
          </button>
          
          {debugInfo.totalInDb > 0 && (
            <button 
              onClick={() => fetchSRSQueue(true)}
              className="px-6 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-full font-bold hover:bg-blue-50 transition-all shadow-sm active:scale-95"
            >
              🚀 Instant Review All ({debugInfo.totalInDb})
            </button>
          )}
        </div>

        {debugInfo.totalInDb === 0 && (
          <div className="mt-8 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800 font-bold mb-1">How to start reviewing:</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              1. Switch to <b>Vocabulary</b> mode.<br/>
              2. Find a word you want to memorize.<br/>
              3. Click <b>"Mark as Learned"</b> on the back of the card.<br/>
              4. It will appear here for review tomorrow!
            </p>
          </div>
        )}
      </div>
    );
  }

  const currentItem = queue[currentIndex];

  return (
    <div className="flex flex-col items-center w-full px-2">
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 mb-8 w-full max-w-xs mx-auto">
        <button
          onClick={() => setSrsType('vocabulary')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            srsType === 'vocabulary' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Vocabulary
        </button>
        <button
          onClick={() => setSrsType('sentences')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            srsType === 'sentences' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Sentences
        </button>
      </div>

      <div className="mb-4 flex flex-col items-center gap-1">
        <div className="text-blue-600 font-black text-xs uppercase tracking-widest">
          {isInstant ? '🚀 Practice Mode' : '📅 SRS Review'}: {currentIndex + 1} / {queue.length}
        </div>
        {isInstant && <p className="text-[10px] text-gray-400">Practicing all words regardless of due date</p>}
      </div>

      <Flashcard 
        word={currentItem.word} 
        flipped={flipped} 
        onFlip={() => {
          setFlipped(!flipped);
          if (!flipped) speakChinese(currentItem.word.word);
        }} 
        onPlayAudio={speakChinese}
      />

      {flipped && (
        <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button 
            onClick={() => handleGrade('again')}
            className="flex flex-col items-center p-3 sm:p-2 bg-red-50 text-red-700 rounded-xl border-2 border-red-100 hover:bg-red-100 transition-all shadow-sm active:scale-95"
          >
            <span className="font-black text-sm sm:text-base">Again</span>
            <span className="text-[9px] sm:text-[10px] opacity-60 font-bold uppercase tracking-tighter">1 day</span>
          </button>
          <button 
            onClick={() => handleGrade('hard')}
            className="flex flex-col items-center p-3 sm:p-2 bg-orange-50 text-orange-700 rounded-xl border-2 border-orange-100 hover:bg-orange-100 transition-all shadow-sm active:scale-95"
          >
            <span className="font-black text-sm sm:text-base">Hard</span>
            <span className="text-[9px] sm:text-[10px] opacity-60 font-bold uppercase tracking-tighter">Wait...</span>
          </button>
          <button 
            onClick={() => handleGrade('good')}
            className="flex flex-col items-center p-3 sm:p-2 bg-blue-50 text-blue-700 rounded-xl border-2 border-blue-100 hover:bg-blue-100 transition-all shadow-sm active:scale-95"
          >
            <span className="font-black text-sm sm:text-base">Good</span>
            <span className="text-[9px] sm:text-[10px] opacity-60 font-bold uppercase tracking-tighter">Wait...</span>
          </button>
          <button 
            onClick={() => handleGrade('easy')}
            className="flex flex-col items-center p-3 sm:p-2 bg-green-50 text-green-700 rounded-xl border-2 border-green-100 hover:bg-green-100 transition-all shadow-sm active:scale-95"
          >
            <span className="font-black text-sm sm:text-base">Easy</span>
            <span className="text-[9px] sm:text-[10px] opacity-60 font-bold uppercase tracking-tighter">Wait...</span>
          </button>
        </div>
      )}

      {!flipped && (
        <p className="mt-8 text-gray-400 text-sm animate-pulse font-medium">Tap card to reveal and grade yourself</p>
      )}
    </div>
  );
};

export default SRSViewer;
