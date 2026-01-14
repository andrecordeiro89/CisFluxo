import { useEffect, useRef } from 'react';
import { TVCall } from '@/types/patient-flow';

export function useTVSpeech(latestCall: TVCall | undefined) {
  const lastAnnouncedId = useRef<string | null>(null);

  useEffect(() => {
    if (!latestCall) return;
    
    // Only announce if this is a new call
    if (lastAnnouncedId.current === latestCall.id) return;
    lastAnnouncedId.current = latestCall.id;

    // Use Web Speech API for text-to-speech
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const message = `Paciente ${latestCall.patient_name}, por favor dirija-se à ${latestCall.station_name}`;
      
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Try to find a Portuguese voice
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(voice => voice.lang.startsWith('pt'));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      // Small delay to ensure voices are loaded
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);
    }
  }, [latestCall]);
}
