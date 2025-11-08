// Add type declarations for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || "sk_dd91e98a83e07d92d8230c59b192d9bfdbdb1fce3145547e";

export const textToSpeech = async (text: string, voiceId: string = "JBFqnCBsd6RMkjVDRZzb") => {
  console.log('TTS Request:', { text, voiceId, apiKey: ELEVENLABS_API_KEY ? 'Present' : 'Missing' });
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2"
    })
  });

  console.log('TTS Response:', response.status, response.statusText);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('TTS Error Details:', errorText);
    throw new Error(`TTS failed: ${response.status}`);
  }

  return response.arrayBuffer();
};



let currentRecognition: any = null;

export const startSpeechRecognition = (onInterimResult?: (text: string) => void): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    if (currentRecognition) {
      currentRecognition.stop();
      currentRecognition = null;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      reject(new Error('Speech recognition not supported'));
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    currentRecognition = recognition;
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    let finalResult = '';
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalResult = transcript;
        } else {
          interimTranscript = transcript;
        }
      }
      
      if (onInterimResult) {
        onInterimResult(interimTranscript || finalResult);
      }
    };
    
    recognition.onend = () => {
      currentRecognition = null;
      resolve(finalResult || '');
    };
    
    recognition.onerror = (event: any) => {
      currentRecognition = null;
      reject(new Error(`Speech error: ${event.error}`));
    };
    
    recognition.start();
  });
};

export const stopSpeechRecognition = () => {
  if (currentRecognition) {
    currentRecognition.stop();
    currentRecognition = null;
  }
};

export const recordAndTranscribe = (onInterimResult?: (text: string) => void): Promise<string> => {
  console.log('Using Web Speech API only for faster response');
  return startSpeechRecognition(onInterimResult);
};