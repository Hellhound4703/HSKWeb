/**
 * Central utility for playing Chinese audio using Web Speech API
 */

let voices: SpeechSynthesisVoice[] = [];

const loadVoices = () => {
  voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('zh'));
};

if ('speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export const speakChinese = (text: string, voiceType: 'a' | 'b' | 'system' = 'a') => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;

    // Try to find distinct voices
    const zhVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices().filter(v => v.lang.includes('zh'));
    
    if (zhVoices.length > 0) {
      if (voiceType === 'a') {
        utterance.voice = zhVoices[0];
      } else if (voiceType === 'b') {
        // Use second voice if available, otherwise shift pitch/rate slightly for distinction
        if (zhVoices.length > 1) {
          utterance.voice = zhVoices[1];
        } else {
          utterance.pitch = 1.2;
          utterance.rate = 0.85;
        }
      } else if (voiceType === 'system') {
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
      }
    }
    
    window.speechSynthesis.speak(utterance);
  }
};

/**
 * Plays a sequence of dialogue lines with different voices
 */
export const playDialogue = async (lines: { speaker: string, text: string }[]) => {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  // Helper to determine speaker type
  const getVoiceType = (speaker: string): 'a' | 'b' | 'system' => {
    const s = speaker.toLowerCase();
    if (s.includes('text') || s.includes('课文')) return 'system';
    // Alternate based on first letter or common patterns
    if (s === 'a' || s.includes('小丽') || s.includes('孙月')) return 'a';
    if (s === 'b' || s.includes('小刚') || s.includes('王静')) return 'b';
    return s.charCodeAt(0) % 2 === 0 ? 'a' : 'b';
  };

  for (const line of lines) {
    await new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(line.text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      
      const type = getVoiceType(line.speaker);
      const zhVoices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('zh'));
      
      if (zhVoices.length > 0) {
        if (type === 'a') utterance.voice = zhVoices[0];
        else if (type === 'b') {
          if (zhVoices.length > 1) utterance.voice = zhVoices[1];
          else { utterance.pitch = 1.2; utterance.rate = 0.85; }
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }
};

export const stopChineseAudio = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
