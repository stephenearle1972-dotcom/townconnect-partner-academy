import { Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { speakText, stopSpeaking, isSpeechSynthesisSupported } from '../services/speechService';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isUser = role === 'user';
  const canSpeak = !isUser && isSpeechSynthesisSupported();

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(content, () => setIsSpeaking(false));
    }
  };

  // Format content with markdown-like styling
  const formatContent = (text: string) => {
    // Split by newlines and process each line
    const lines = text.split('\n');

    return lines.map((line, index) => {
      // Handle headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={index} className="font-bold text-sm mt-3 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={index} className="font-bold mt-3 mb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={index} className="font-bold text-lg mt-3 mb-1">
            {line.replace('# ', '')}
          </h2>
        );
      }

      // Handle numbered lists
      if (/^\d+\.\s/.test(line)) {
        return (
          <p key={index} className="ml-4 my-0.5">
            {line}
          </p>
        );
      }

      // Handle bullet points
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <p key={index} className="ml-4 my-0.5">
            • {line.replace(/^[-•]\s/, '')}
          </p>
        );
      }

      // Handle bold text with **
      let processedLine = line;
      const boldRegex = /\*\*([^*]+)\*\*/g;
      const parts: (string | JSX.Element)[] = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(
          <strong key={`bold-${index}-${match.index}`}>{match[1]}</strong>
        );
        lastIndex = match.index + match[0].length;
      }

      if (parts.length > 0) {
        if (lastIndex < line.length) {
          parts.push(line.substring(lastIndex));
        }
        return (
          <p key={index} className="my-1">
            {parts}
          </p>
        );
      }

      // Empty line = paragraph break
      if (line.trim() === '') {
        return <div key={index} className="h-2" />;
      }

      // Regular text
      return (
        <p key={index} className="my-1">
          {processedLine}
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
            className="absolute -bottom-2 -right-2 p-2 bg-gold hover:bg-gold-dark rounded-full shadow-md transition-colors"
            title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
          >
            {isSpeaking ? (
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
