import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { speakText, stopSpeaking, isSpeechSynthesisSupported } from '../services/speechService';
import {
  isElevenLabsConfigured,
  speakWithElevenLabs,
  stopAudio,
  getCachedAudio,
} from '../services/elevenLabsService';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isUser = role === 'user';

  // Can speak if it's an assistant message and either ElevenLabs or browser TTS is available
  const canSpeak = !isUser && (isElevenLabsConfigured() || isSpeechSynthesisSupported());

  // Check if we have cached audio (for instant playback indicator)
  const hasCachedAudio = isElevenLabsConfigured() && getCachedAudio(content) !== null;

  const handleSpeak = async () => {
    // If currently speaking or loading, stop
    if (isSpeaking || isLoading) {
      stopAudio();
      stopSpeaking();
      setIsSpeaking(false);
      setIsLoading(false);
      return;
    }

    // Try ElevenLabs first if configured
    if (isElevenLabsConfigured()) {
      // If cached, no loading needed
      if (hasCachedAudio) {
        setIsSpeaking(true);
        try {
          await speakWithElevenLabs(
            content,
            undefined,
            () => setIsSpeaking(false),
            (error) => console.warn('ElevenLabs warning:', error)
          );
        } catch {
          // Fall back to browser TTS
          fallbackToBrowserTTS();
        }
      } else {
        // Show loading while generating
        setIsLoading(true);
        try {
          await speakWithElevenLabs(
            content,
            () => {
              setIsLoading(false);
              setIsSpeaking(true);
            },
            () => setIsSpeaking(false),
            (error) => console.warn('ElevenLabs warning:', error)
          );
        } catch {
          setIsLoading(false);
          // Fall back to browser TTS
          fallbackToBrowserTTS();
        }
      }
    } else {
      // Use browser TTS directly
      fallbackToBrowserTTS();
    }
  };

  const fallbackToBrowserTTS = () => {
    if (isSpeechSynthesisSupported()) {
      setIsSpeaking(true);
      speakText(content, () => setIsSpeaking(false));
    }
  };

  // Parse inline markdown (links, bold) in a string
  const parseInlineMarkdown = (text: string, keyPrefix: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    // Combined regex for links and bold
    const inlineRegex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = inlineRegex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      if (match[1] && match[2]) {
        // Link: [text](url)
        parts.push(
          <a
            key={`${keyPrefix}-link-${match.index}`}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest underline hover:text-forest-dark font-medium"
          >
            {match[1]}
          </a>
        );
      } else if (match[3]) {
        // Bold: **text**
        parts.push(
          <strong key={`${keyPrefix}-bold-${match.index}`}>{match[3]}</strong>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  // Format content with markdown-like styling
  const formatContent = (text: string) => {
    // Split by newlines and process each line
    const lines = text.split('\n');

    return lines.map((line, index) => {
      const keyPrefix = `line-${index}`;

      // Handle headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={index} className="font-bold text-sm mt-3 mb-1">
            {parseInlineMarkdown(line.replace('### ', ''), keyPrefix)}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={index} className="font-bold mt-3 mb-1">
            {parseInlineMarkdown(line.replace('## ', ''), keyPrefix)}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={index} className="font-bold text-lg mt-3 mb-1">
            {parseInlineMarkdown(line.replace('# ', ''), keyPrefix)}
          </h2>
        );
      }

      // Handle numbered lists
      if (/^\d+\.\s/.test(line)) {
        return (
          <p key={index} className="ml-4 my-0.5">
            {parseInlineMarkdown(line, keyPrefix)}
          </p>
        );
      }

      // Handle bullet points
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <p key={index} className="ml-4 my-0.5">
            • {parseInlineMarkdown(line.replace(/^[-•]\s/, ''), keyPrefix)}
          </p>
        );
      }

      // Empty line = paragraph break
      if (line.trim() === '') {
        return <div key={index} className="h-2" />;
      }

      // Regular text with inline formatting
      return (
        <p key={index} className="my-1">
          {parseInlineMarkdown(line, keyPrefix)}
        </p>
      );
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`relative max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-forest text-white rounded-br-md'
            : 'bg-white text-gray-800 rounded-bl-md shadow-md border border-gray-100'
        }`}
      >
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
          {isUser ? content : formatContent(content)}
        </div>

        {canSpeak && (
          <button
            onClick={handleSpeak}
            disabled={isLoading}
            className={`absolute -bottom-2 -right-2 p-2 rounded-full shadow-md transition-all ${
              isLoading
                ? 'bg-gold/70 cursor-wait'
                : isSpeaking
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gold hover:bg-gold-dark'
            }`}
            title={
              isLoading
                ? 'Generating voice...'
                : isSpeaking
                ? 'Stop speaking'
                : 'Read aloud'
            }
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : isSpeaking ? (
              <VolumeX className="w-4 h-4 text-white" />
            ) : (
              <Volume2 className="w-4 h-4 text-white" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
