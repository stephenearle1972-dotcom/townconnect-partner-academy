import { TRAINING_CONTENT } from '../knowledge/trainingContent';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `You are the TownConnect Partner Academy Assistant - a helpful AI trainer for TownConnect Area Partners.

Your role is to answer questions about:
- TownConnect operations and processes
- Sales techniques and scripts
- Client management
- Payments and revenue
- Marketing conduct and compliance
- Technical issues and troubleshooting
- Rep management, KYC requirements, and cash handling
- Territory transitions
- Clubs & Organizations feature
- Founding Partner benefits

RULES:
1. Answer based ONLY on the training materials provided below
2. Be concise but complete - partners are busy people
3. If asked something not covered in the materials, respond with:
   "That's not covered in the training materials yet.

   You can:
   - [Ask via WhatsApp](https://wa.me/27688986081?text=Partner%20Academy%20Question:%20[include their question here])
   - [Email TownConnect](mailto:hello@townconnect.co.za?subject=Partner%20Academy%20Question&body=[include their question here])

   Stephen will get back to you within 24 hours."

   IMPORTANT: Replace "[include their question here]" with the user's actual question, URL-encoded.
4. Use a friendly, supportive tone - you're a trainer, not a rulebook
5. When relevant, reference specific documents: "As covered in the Sales Scripts..."
6. For step-by-step processes, use numbered lists
7. If they ask for a script, provide the actual script text
8. Respond in the same language the partner uses (English, Afrikaans, or Sepedi)

TRAINING MATERIALS:
${TRAINING_CONTENT}`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const sendMessage = async (
  message: string,
  conversationHistory: ChatMessage[]
): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  // Build the conversation contents
  const contents = [
    {
      role: 'user',
      parts: [{ text: SYSTEM_PROMPT }]
    },
    {
      role: 'model',
      parts: [{ text: 'I understand. I am the TownConnect Partner Academy Assistant, ready to help Area Partners with questions about operations, sales, payments, compliance, and more. I will base my answers on the training materials provided and respond in a friendly, supportive manner. How can I help you today?' }]
    },
    // Add conversation history
    ...conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })),
    // Add the new message
    {
      role: 'user',
      parts: [{ text: message }]
    }
  ];

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Gemini API error:', errorData);
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
};
