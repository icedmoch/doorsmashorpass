import { useState, useRef, useCallback } from 'react';
import { textToSpeech, startSpeechRecognition, recordAndTranscribe } from '@/lib/elevenlabs';

export const useSpeech = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setIsRecording(true);
      const transcription = await speechToText(new Blob());
      setIsRecording(false);
      return transcription;
    } catch (error) {
      setIsRecording(false);
      console.error('Error starting recording:', error);
      throw error;
    }
  }, []);

  const stopRecording = useCallback((): Promise<string> => {
    return Promise.resolve('');
  }, []);

  const playText = useCallback(async (text: string) => {
    try {
      setIsPlaying(true);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audioBuffer = await textToSpeech(text);
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
      console.error('Error playing text:', error);
      throw error;
    }
  }, []);

  const stopPlaying = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleSpeechRecognition = useCallback(async (): Promise<string> => {
    setIsRecording(true);
    try {
      const transcript = await recordAndTranscribe();
      setIsRecording(false);
      return transcript;
    } catch (error) {
      setIsRecording(false);
      throw error;
    }
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