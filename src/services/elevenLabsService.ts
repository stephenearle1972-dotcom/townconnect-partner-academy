/**
 * ElevenLabs Text-to-Speech Service
 * Uses Sarah voice for natural-sounding speech output
 */

// Sarah's voice ID (ElevenLabs pre-made voice)
// Verified from ElevenLabs voices endpoint
const SARAH_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

// API configuration
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const MODEL_ID = 'eleven_multilingual_v2';

// Voice settings for natural, conversational tone
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
};

// Audio cache - stores generated audio blobs by message content hash
const audioCache = new Map<string, Blob>();

// Current audio instance for playback control
let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

/**
 * Get a simple hash of the text content for cache key
 */
function getContentHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check if ElevenLabs API is configured
 */
export function isElevenLabsConfigured(): boolean {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  return !!apiKey && apiKey.trim() !== '';
}

/**
 * Get audio from cache if available
 */
export function getCachedAudio(text: string): Blob | null {
  const hash = getContentHash(text);
  return audioCache.get(hash) || null;
}

/**
 * Generate speech audio using ElevenLabs API
 */
export async function generateSpeech(text: string): Promise<Blob> {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  // Check cache first
  const cached = getCachedAudio(text);
  if (cached) {
    console.log('ElevenLabs: Using cached audio');
    return cached;
  }

  // For very long text, truncate (ElevenLabs has a ~5000 char limit per request)
  // The multilingual v2 model works well with Afrikaans
  const textToSpeak = text.length > 4500 ? text.substring(0, 4500) + '...' : text;

  const response = await fetch(`${ELEVENLABS_API_URL}/${SARAH_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: textToSpeak,
      model_id: MODEL_ID,
      voice_settings: VOICE_SETTINGS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs API error:', response.status, errorText);

    // Check for rate limiting
    if (response.status === 429) {
      throw new Error('RATE_LIMITED');
    }

    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const audioBlob = await response.blob();

  // Cache the audio
  const hash = getContentHash(text);
  audioCache.set(hash, audioBlob);

  return audioBlob;
}

/**
 * Play audio blob through the browser
 */
export function playAudio(blob: Blob, onEnd?: () => void): void {
  // Stop any currently playing audio
  stopAudio();

  // Create object URL for the blob
  currentObjectUrl = URL.createObjectURL(blob);
  currentAudio = new Audio(currentObjectUrl);

  currentAudio.onended = () => {
    cleanupAudio();
    if (onEnd) onEnd();
  };

  currentAudio.onerror = () => {
    console.error('Audio playback error');
    cleanupAudio();
    if (onEnd) onEnd();
  };

  currentAudio.play().catch((err) => {
    console.error('Failed to play audio:', err);
    cleanupAudio();
    if (onEnd) onEnd();
  });
}

/**
 * Stop current audio playback
 */
export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    cleanupAudio();
  }
}

/**
 * Check if audio is currently playing
 */
export function isPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

/**
 * Cleanup audio resources
 */
function cleanupAudio(): void {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
  currentAudio = null;
}

/**
 * Main speak function - generates and plays ElevenLabs audio
 * Falls back to browser TTS on error
 */
export async function speakWithElevenLabs(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: string) => void
): Promise<void> {
  try {
    if (onStart) onStart();

    const audioBlob = await generateSpeech(text);
    playAudio(audioBlob, onEnd);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('ElevenLabs speech error:', errorMessage);

    if (onError) {
      if (errorMessage === 'RATE_LIMITED') {
        onError('Voice temporarily unavailable, using backup');
      } else {
        onError('Voice service error, using backup');
      }
    }

    // Throw to signal fallback needed
    throw error;
  }
}
