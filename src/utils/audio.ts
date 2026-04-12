/**
 * Central utility for playing Chinese audio using Web Speech API
 */
export const speakChinese = (text: string) => {
  if ('speechSynthesis' in window) {
    // Cancel any currently playing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9; // Slightly slower for better clarity
    
    window.speechSynthesis.speak(utterance);
  }
};

export const stopChineseAudio = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
