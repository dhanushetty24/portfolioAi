import { GoogleGenAI } from '@google/genai';
import config from '../config.js';

const ai = new GoogleGenAI({}); // When @google/genai is initialized, it automatically checks your system's environment variables (process.env) to locate API credentials

export const embedText = async (text) => {
  try {
    const embeddedValue = await ai.models.embedContent({
      model: config.embeddingModel || 'gemini-embedding-2',
      contents: text,
    });
    return embeddedValue.embeddings[0].values;
  } catch (err) {
    throw error;
  }
};

const getEmbeddings = async (content) => {
  try {
    const embeddings = await Promise.all(
      content.map((text) => embedText(text)),
    );
    return embeddings;
  } catch (error) {
    throw error;
  }
};

export default getEmbeddings;
