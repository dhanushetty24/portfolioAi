import OpenAI from 'openai';
import config from '../config.js';

const gemini = new OpenAI({
  baseURL: config.GEMINI_BASE_URL,
  apiKey: config.GEMINI_API_KEY,
});

const geminiCall = async (messages, response_format, options = {}) => {
  try {
    if (messages.length === 0) {
      throw new Error('No messages provided');
    }
    const response = await gemini.chat.completions.create({
      model: 'gemini-3.1-flash-lite',
      messages,
      response_format,
      ...options,
    });

    return response.choices[0].message.content;
  } catch (error) {
    throw error;
  }
};

export default geminiCall;
