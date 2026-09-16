import { useCallback, useEffect, useRef, useState } from "react";

/**
 * อ่านออกเสียงด้วย Web Speech API ของเบราว์เซอร์
 * จัดการหยุดเสียงตอนออกจากหน้าให้ด้วย จะได้ไม่มีเสียงค้าง
 */
export function useSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "th-TH";
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    },
    [supported]
  );

  const toggle = useCallback(
    (text: string) => (isPlaying ? stop() : speak(text)),
    [isPlaying, speak, stop]
  );

  useEffect(() => stop, [stop]);

  return { isPlaying, supported, speak, stop, toggle };
}
