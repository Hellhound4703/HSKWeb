import React, { useState, useEffect, useCallback } from 'react';
import { type User } from 'firebase/auth';
import { db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Flashcard from './Flashcard';

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
}

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ words, user }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);

  useEffect(() => {
    setShuffledWords([...words]);
    setCurrentIndex(0);
    setFlipped(false);
  }, [words]);

  // Load learned words from Firestore
  useEffect(() => {
    const fetchLearnedWords = async () => {
      if (!user) {
        setLearnedWords([]);
        return;
      }
      const progressRef = doc(db, 'users', user.uid, 'stats', 'vocabulary');
      const docSnap = await getDoc(progressRef);
      if (docSnap.exists()) {
        setLearnedWords(docSnap.data().learned || []);
      } else {
        setLearnedWords([]);
      }
    };
    fetchLearnedWords();
  }, [user]);

  const speakWord = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleFlip = () => {
    const newFlippedState = !flipped;
    setFlipped(newFlippedState);
    if (newFlippedState && shuffledWords[currentIndex]) {
      speakWord(shuffledWords[currentIndex].word);
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
      const progressRef = doc(db, 'users', user.uid, 'stats', 'vocabulary');
      const docSnap = await getDoc(progressRef);
      
      if (!docSnap.exists()) {
        await setDoc(progressRef, { learned: [currentWord] });
      } else {
        await updateDoc(progressRef, {
          learned: isNowLearned ? arrayUnion(currentWord) : arrayRemove(currentWord)
        });
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
      window.speechSynthesis.cancel();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
      window.speechSynthesis.cancel();
    }
  };

  const handleShuffle = () => {
    const shuffled = [...shuffledWords].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setCurrentIndex(0);
    setFlipped(false);
    window.speechSynthesis.cancel();
  };

  if (shuffledWords.length === 0) {
    return (
      <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-lg">No words selected. Please choose some lessons above!</p>
      </div>
    );
  }

  const currentWord = shuffledWords[currentIndex];
  const isLearned = learnedWords.includes(currentWord.word);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-gray-600 font-medium">
        Card {currentIndex + 1} of {shuffledWords.length}
      </div>
      
      <Flashcard 
        word={currentWord} 
        flipped={flipped} 
        onFlip={handleFlip} 
        onPlayAudio={speakWord}
        isLearned={isLearned}
        onToggleLearned={() => toggleLearned()}
      />

      <div className="mt-12 flex gap-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            currentIndex === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
          }`}
        >
          Previous
        </button>
        <button
          onClick={handleShuffle}
          className="px-6 py-2 rounded-full font-semibold bg-gray-800 text-white hover:bg-gray-900 transition-all"
        >
          Shuffle
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === shuffledWords.length - 1}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
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
