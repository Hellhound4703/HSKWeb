import React, { useState, useMemo } from 'react';
import hsk1Data from '../data/hsk1-data.json';
import hsk2Data from '../data/hsk2-data.json';
import hsk3Data from '../data/hsk3-data.json';
import hsk4Data from '../data/hsk4-data.json';
import Flashcard from './Flashcard';
import { speakChinese } from '../utils/audio';

interface Word {
  word: string;
  pinyin: string;
  definition: string;
  hint?: string;
  level: number;
}

interface GrammarPoint {
  point: string;
  explanation: string;
  examples: { chinese: string; pinyin: string; english: string }[];
  level: number;
  lesson: number;
}

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  const allData = useMemo(() => {
    const words: Word[] = [];
    const grammar: GrammarPoint[] = [];

    [hsk1Data, hsk2Data, hsk3Data, hsk4Data].forEach((levelData, idx) => {
      const level = idx + 1;
      (levelData as any[]).forEach(lesson => {
        lesson.vocabulary.forEach((v: any) => words.push({ ...v, level }));
        if (lesson.grammar) {
          lesson.grammar.forEach((g: any) => grammar.push({ ...g, level, lesson: lesson.lesson }));
        }
      });
    });

    return { words, grammar };
  }, []);

  const results = useMemo(() => {
    if (query.length < 2) return { words: [], grammar: [] };
    
    const lowerQuery = query.toLowerCase();
    
    return {
      words: allData.words.filter(w => 
        w.word.includes(query) || 
        w.pinyin.toLowerCase().includes(lowerQuery) || 
        w.definition.toLowerCase().includes(lowerQuery)
      ).slice(0, 20),
      grammar: allData.grammar.filter(g => 
        g.point.toLowerCase().includes(lowerQuery) || 
        g.explanation.toLowerCase().includes(lowerQuery)
      ).slice(0, 10)
    };
  }, [query, allData]);

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm py-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text"
            placeholder="Search word, pinyin, or grammar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-gray-100 outline-none focus:border-blue-500 shadow-sm transition-all text-lg font-medium"
          />
        </div>
      </div>

      {query.length > 0 && query.length < 2 && (
        <p className="text-center text-gray-400 mt-10 font-medium italic">Type at least 2 characters to search...</p>
      )}

      {query.length >= 2 && (
        <div className="mt-8 space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Words Section */}
          <section>
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <span className="w-8 h-px bg-blue-100"></span>
              Vocabulary Results ({results.words.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.words.map((w, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedWord(w)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-left hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl font-bold text-gray-800">{w.word}</span>
                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded">HSK {w.level}</span>
                  </div>
                  <p className="text-sm text-gray-400 font-medium italic mb-1">{w.pinyin}</p>
                  <p className="text-sm text-gray-600 line-clamp-1 group-hover:text-blue-600 transition-colors">{w.definition}</p>
                </button>
              ))}
              {results.words.length === 0 && <p className="text-gray-400 text-sm italic">No words found.</p>}
            </div>
          </section>

          {/* Grammar Section */}
          <section>
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <span className="w-8 h-px bg-blue-100"></span>
              Grammar Results ({results.grammar.length})
            </h3>
            <div className="space-y-4">
              {results.grammar.map((g, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-blue-600">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-bold text-gray-900">{g.point}</h4>
                    <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded">HSK {g.level} • L{g.lesson}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{g.explanation}</p>
                  <div className="space-y-2">
                    {g.examples.slice(0, 1).map((ex, i) => (
                      <div key={i} className="pl-3 border-l-2 border-blue-50 flex items-center justify-between group">
                        <div>
                          <p className="text-sm font-bold text-gray-800">{ex.chinese}</p>
                          <p className="text-[10px] text-gray-400 italic">{ex.english}</p>
                        </div>
                        <button 
                          onClick={() => speakChinese(ex.chinese)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {results.grammar.length === 0 && <p className="text-gray-400 text-sm italic">No grammar rules found.</p>}
            </div>
          </section>
        </div>
      )}

      {/* Modal for Word Details */}
      {selectedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setSelectedWord(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-8 pb-12">
              <Flashcard 
                word={selectedWord}
                flipped={true}
                onFlip={() => {}}
                onPlayAudio={speakChinese}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
