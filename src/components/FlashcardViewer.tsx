import React, { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import Flashcard from './Flashcard';
import { speakChinese, stopChineseAudio } from '../utils/audio';

interface Word {
  word: string;
  pinyin: string;
  definition: string;
  hint?: string;
  lesson?: number;
}

interface FlashcardViewerProps {
  words: Word[];
  user?: User | null;
  level: number;
}

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ words, user, level }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);

  useEffect(() => {
    setShuffledWords([...words]);
    setCurrentIndex(0);
    setFlipped(false);
  }, [words]);

  // Load learned words from Firestore based on level
  useEffect(() => {
    const fetchLearnedWords = async () => {
      if (!user) {
        setLearnedWords([]);
        return;
      }
      const progressRef = doc(db, 'users', user.uid, 'stats', `hsk${level}_vocabulary`);
      const docSnap = await getDoc(progressRef);
      if (docSnap.exists()) {
        setLearnedWords(docSnap.data().learned || []);
      } else {
        setLearnedWords([]);
      }
    };
    fetchLearnedWords();
  }, [user, level]);

  const handleFlip = () => {
    const newFlippedState = !flipped;
    setFlipped(newFlippedState);
    if (newFlippedState && shuffledWords[currentIndex]) {
      speakChinese(shuffledWords[currentIndex].word);
    }
  };

  const toggleLearned = async () => {
    if (!user) {
      alert("Please sign in to mark words as learned!");
      return;
    }

    const currentWord = shuffledWords[currentIndex].word;
    const isNowLearned = !learnedWords.includes(currentWord);
    
    // Optimistic UI update
    setLearnedWords(prev => 
      isNowLearned ? [...prev, currentWord] : prev.filter(w => w !== currentWord)
    );

    try {
      const vocabRef = doc(db, 'users', user.uid, 'stats', `hsk${level}_vocabulary`);
      const vocabSnap = await getDoc(vocabRef);
      
      if (!vocabSnap.exists()) {
        await setDoc(vocabRef, { learned: [currentWord] });
      } else {
        await updateDoc(vocabRef, {
          learned: isNowLearned ? arrayUnion(currentWord) : arrayRemove(currentWord)
        });
      }

      // If marking as learned, ALSO initialize in SRS
      if (isNowLearned) {
        const srsRef = doc(db, 'users', user.uid, `hsk${level}_srs`, currentWord);
        const srsSnap = await getDoc(srsRef);
        if (!srsSnap.exists()) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          await setDoc(srsRef, {
            word: currentWord,
            nextReview: Timestamp.fromDate(tomorrow),
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0,
            level: level
          });
        }
      }
    } catch (error) {
      console.error("Error updating learned words", error);
      // Revert UI on error
      setLearnedWords(prev => 
        !isNowLearned ? [...prev, currentWord] : prev.filter(w => w !== currentWord)
      );
    }
  };

  const handleNext = () => {
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
      stopChineseAudio();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
      stopChineseAudio();
    }
  };

  const handleShuffle = () => {
    const shuffled = [...shuffledWords].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setCurrentIndex(0);
    setFlipped(false);
    stopChineseAudio();
  };

  if (shuffledWords.length === 0) {
    return (
      <div className="text-center p-8 sm:p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-base sm:text-lg">No words selected. Please choose some lessons above!</p>
      </div>
    );
  }

  const currentWord = shuffledWords[currentIndex];
  const isLearned = learnedWords.includes(currentWord.word);

  return (
    <div className="flex flex-col items-center w-full px-2">
      <div className="mb-4 text-gray-600 font-medium text-sm sm:text-base">
        Card {currentIndex + 1} of {shuffledWords.length}
      </div>
      
      <Flashcard 
        word={currentWord} 
        flipped={flipped} 
        onFlip={handleFlip} 
        onPlayAudio={speakChinese}
        isLearned={isLearned}
        onToggleLearned={() => toggleLearned()}
      />

      <div className="mt-8 sm:mt-12 flex gap-2 sm:gap-4 w-full max-w-sm justify-center">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`flex-1 px-4 py-2 sm:px-6 sm:py-2 rounded-full font-semibold text-sm sm:text-base transition-all ${
            currentIndex === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
          }`}
        >
          Prev
        </button>
        <button
          onClick={handleShuffle}
          className="px-4 py-2 sm:px-6 sm:py-2 rounded-full font-semibold text-sm sm:text-base bg-gray-800 text-white hover:bg-gray-900 transition-all"
        >
          Shuffle
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === shuffledWords.length - 1}
          className={`flex-1 px-4 py-2 sm:px-6 sm:py-2 rounded-full font-semibold text-sm sm:text-base transition-all ${
            currentIndex === shuffledWords.length - 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default FlashcardViewer;
