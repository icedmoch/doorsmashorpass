import { useState, useRef, useCallback } from 'react';
import { textToSpeech, startSpeechRecognition, recordAndTranscribe, stopSpeechRecognition } from '@/lib/elevenlabs';

export const useSpeech = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);



  const stopRecording = useCallback(() => {
    stopSpeechRecognition();
    setIsRecording(false);
  }, []);

  const playText = useCallback(async (text: string) => {
    abortControllerRef.current = new AbortController();
    setIsPlaying(true);

    try {
      const audioBuffer = await textToSpeech(text);
      
      if (abortControllerRef.current.signal.aborted) {
        setIsPlaying(false);
        return;
      }
      
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      setIsPlaying(false);
      throw error;
    }
  }, []);

  const stopPlaying = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handleSpeechRecognition = useCallback((onInterimResult?: (text: string) => void): Promise<string> => {
    setIsRecording(true);
    return new Promise((resolve, reject) => {
      recordAndTranscribe(onInterimResult)
        .then(transcript => {
          setIsRecording(false);
          resolve(transcript);
        })
        .catch(error => {
          setIsRecording(false);
          reject(error);
        });
    });
  }, []);

  return {
    isRecording,
    isPlaying,
    isProcessing,
    startRecording: handleSpeechRecognition,
    stopRecording,
    playText,
    stopPlaying,
  };
};