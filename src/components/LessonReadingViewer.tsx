import React, { useState, useMemo } from 'react';
import readingDataRaw from '../data/reading-data.json';
import { speakChinese, playDialogue, stopChineseAudio } from '../utils/audio';

interface Word {
  word: string;
  pinyin: string;
  definition: string;
}

interface ReadingLesson {
  lesson: number;
  title: string;
  content: string;
}

interface LessonReadingViewerProps {
  level: number;
  selectedLessons: number[];
  allWords: Word[];
}

const readingData: Record<string, ReadingLesson[]> = readingDataRaw;

const LessonReadingViewer: React.FC<LessonReadingViewerProps> = ({ level, selectedLessons, allWords }) => {
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [playingIdx, setPlayingIdx] = useState<string | null>(null);

  const lessonsToShow = useMemo(() => {
    const levelLessons = readingData[level.toString()] || [];
    return levelLessons.filter(l => selectedLessons.includes(l.lesson));
  }, [level, selectedLessons]);

  // Sort words by length (longest first) for better matching
  const sortedWords = useMemo(() => {
    return [...allWords].sort((a, b) => b.word.length - a.word.length);
  }, [allWords]);

  const tokenize = (text: string) => {
    let result: (string | Word)[] = [text];

    sortedWords.forEach(wordObj => {
      const newResult: (string | Word)[] = [];
      result.forEach(part => {
        if (typeof part === 'string') {
          const parts = part.split(wordObj.word);
          for (let i = 0; i < parts.length; i++) {
            if (parts[i] !== '') {
              newResult.push(parts[i]);
            }
            if (i < parts.length - 1) {
              newResult.push(wordObj);
            }
          }
        } else {
          newResult.push(part);
        }
      });
      result = newResult;
    });

    return result;
  };

  const handlePlaySection = async (lessonId: number, sectionIdx: number, lines: { speaker: string, text: string }[]) => {
    const id = `${lessonId}-${sectionIdx}`;
    if (playingIdx === id) {
      stopChineseAudio();
      setPlayingIdx(null);
      return;
    }
    
    setPlayingIdx(id);
    await playDialogue(lines);
    setPlayingIdx(null);
  };

  if (lessonsToShow.length === 0) {
    return (
      <div className="text-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No reading texts available for the selected lessons yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {lessonsToShow.map((lesson) => {
        // Parse content into sections (grouped by "Text X")
        const lines = lesson.content.split('\n');
        const sections: { title: string, lines: { speaker: string, text: string }[] }[] = [];
        let currentSection: { title: string, lines: { speaker: string, text: string }[] } | null = null;

        lines.forEach(line => {
          const speakerMatch = line.match(/^([^：:]+)[：:](.*)$/);
          if (speakerMatch) {
            const speaker = speakerMatch[1].trim();
            const text = speakerMatch[2].trim();
            
            if (speaker.startsWith('Text')) {
              if (currentSection) sections.push(currentSection);
              currentSection = { title: line, lines: [] };
            } else if (currentSection) {
              currentSection.lines.push({ speaker, text });
            } else {
              // Line before any "Text X" marker
              sections.push({ title: '', lines: [{ speaker, text }] });
            }
          } else if (line.trim()) {
            if (currentSection) {
              currentSection.lines.push({ speaker: '', text: line.trim() });
            } else {
              sections.push({ title: '', lines: [{ speaker: '', text: line.trim() }] });
            }
          }
        });
        if (currentSection) sections.push(currentSection);

        return (
          <div key={lesson.lesson} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 relative">
            <h3 className="text-xl font-bold text-gray-800 mb-8 border-b border-gray-50 pb-4">
              Lesson {lesson.lesson}: {lesson.title}
            </h3>

            <div className="space-y-12">
              {sections.map((section, sIdx) => (
                <div key={sIdx} className="relative group">
                  {section.title && (
                    <div className="flex justify-between items-center mb-6 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                      <span className="text-sm font-black text-blue-500 uppercase tracking-[0.2em]">{section.title}</span>
                      <button
                        onClick={() => handlePlaySection(lesson.lesson, sIdx, section.lines)}
                        className={`p-2 rounded-full transition-all shadow-sm ${
                          playingIdx === `${lesson.lesson}-${sIdx}`
                            ? 'bg-blue-600 text-white animate-pulse'
                            : 'bg-white text-blue-600 hover:bg-blue-100'
                        }`}
                        title="Listen to this section"
                      >
                        {playingIdx === `${lesson.lesson}-${sIdx}` ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="space-y-6">
                    {section.lines.map((line, lIdx) => (
                      <div key={lIdx} className="flex flex-col group/line">
                        {line.speaker && (
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 group-hover/line:text-blue-300 transition-colors">
                            {line.speaker}
                          </span>
                        )}
                        <div className="text-2xl sm:text-3xl text-gray-800 leading-loose font-chinese">
                          {tokenize(line.text).map((token, idx) => {
                            if (typeof token === 'string') {
                              return <span key={idx}>{token}</span>;
                            } else {
                              return (
                                <span
                                  key={idx}
                                  onClick={() => setSelectedWord(token)}
                                  className="cursor-pointer text-blue-600 hover:bg-blue-50 border-b-2 border-transparent hover:border-blue-200 transition-all px-0.5 rounded"
                                >
                                  {token.word}
                                </span>
                              );
                            }
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Word Detail Modal/Popover */}
      {selectedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedWord(null)}>
          <div 
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <h2 className="text-5xl font-bold text-gray-900 mb-2">{selectedWord.word}</h2>
              <p className="text-2xl text-blue-600 font-medium italic mb-4">{selectedWord.pinyin}</p>
              <hr className="w-12 border-blue-100 mx-auto mb-6" />
              <p className="text-xl text-gray-700">{selectedWord.definition}</p>
              
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => speakChinese(selectedWord.word)}
                  className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-2xl font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  Listen
                </button>
                <button
                  onClick={() => setSelectedWord(null)}
                  className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonReadingViewer;
