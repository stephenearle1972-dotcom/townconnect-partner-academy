import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import {
  startListening,
  stopListening,
  isSpeechRecognitionSupported,
} from '../services/speechService';

interface VoiceInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onSubmit, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const recognitionRef = useRef<ReturnType<typeof startListening>>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const finalTranscriptRef = useRef('');

  const speechSupported = isSpeechRecognitionSupported();

  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      window.clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const submitTranscript = useCallback(() => {
    const textToSubmit = finalTranscriptRef.current.trim();
    if (textToSubmit) {
      onSubmit(textToSubmit);
      finalTranscriptRef.current = '';
      setTranscript('');
    }
    setIsListening(false);
    stopListening(recognitionRef.current);
    recognitionRef.current = null;
  }, [onSubmit]);

  const handleResult = useCallback((text: string, isFinal: boolean) => {
    clearSilenceTimeout();

    if (isFinal) {
      finalTranscriptRef.current = text;
      setTranscript(text);

      // Start silence timer for auto-submit
      silenceTimeoutRef.current = window.setTimeout(() => {
        submitTranscript();
      }, 1500);
    } else {
      setTranscript(finalTranscriptRef.current + text);
    }
  }, [clearSilenceTimeout, submitTranscript]);

  const handleEnd = useCallback(() => {
    // If we have a final transcript, submit it
    if (finalTranscriptRef.current.trim()) {
      submitTranscript();
    } else {
      setIsListening(false);
      setTranscript('');
    }
  }, [submitTranscript]);

  const handleError = useCallback((error: string) => {
    console.error('Speech recognition error:', error);
    setIsListening(false);
    setTranscript('');
    if (error === 'not-allowed') {
      setShowTextInput(true);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      clearSilenceTimeout();
      submitTranscript();
    } else {
      finalTranscriptRef.current = '';
      setTranscript('');
      setIsListening(true);

      recognitionRef.current = startListening(handleResult, handleEnd, handleError);

      if (!recognitionRef.current) {
        setIsListening(false);
        setShowTextInput(true);
      }
    }
  }, [isListening, handleResult, handleEnd, handleError, clearSilenceTimeout, submitTranscript]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      onSubmit(textInput.trim());
      setTextInput('');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimeout();
      if (recognitionRef.current) {
        stopListening(recognitionRef.current);
      }
    };
  }, [clearSilenceTimeout]);

  // Show text input if speech not supported
  useEffect(() => {
    if (!speechSupported) {
      setShowTextInput(true);
    }
  }, [speechSupported]);

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Live transcript display */}
      {isListening && transcript && (
        <div className="mb-3 p-3 bg-gray-50 rounded-xl text-gray-700 text-sm">
          <span className="text-gray-400 mr-2">Hearing:</span>
          {transcript}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Text input (shown when voice not available or user toggles) */}
        {showTextInput && (
          <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your question..."
              disabled={disabled || isListening}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent"
            />
            <button
              type="submit"
              disabled={disabled || !textInput.trim()}
              className="p-3 bg-forest hover:bg-forest-dark disabled:bg-gray-300 text-white rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}

        {/* Voice button */}
        {speechSupported && (
          <div className="relative">
            {/* Pulse ring animation when listening */}
            {isListening && (
              <>
                <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse-ring" />
                <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse-ring" style={{ animationDelay: '0.4s' }} />
              </>
            )}

            <button
              onClick={toggleListening}
              disabled={disabled}
              className={`relative z-10 p-5 rounded-full transition-all shadow-lg ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gold hover:bg-gold-dark'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
                !showTextInput ? 'w-full' : ''
              }`}
              style={{ minWidth: '64px', minHeight: '64px' }}
            >
              {isListening ? (
                <MicOff className="w-7 h-7 text-white" />
              ) : (
                <Mic className="w-7 h-7 text-white" />
              )}
            </button>
          </div>
        )}

        {/* Toggle text input button */}
        {speechSupported && !showTextInput && (
          <button
            onClick={() => setShowTextInput(true)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Type instead
          </button>
        )}
      </div>

      {/* Status text */}
      <div className="mt-2 text-center text-sm text-gray-500">
        {isListening ? (
          <span className="text-red-500 font-medium">
            Listening... Tap mic when done
          </span>
        ) : speechSupported && !showTextInput ? (
          'Tap the microphone to ask a question'
        ) : null}
      </div>
    </div>
  );
}
