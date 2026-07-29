import 'dotenv/config';

const config = {
  GEMINI_BASE_URL: process.env.GEMINI_BASE_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  chromaUrl: process.env.CHROMA_URL,
  collectionName: process.env.COLLECTION_NAME,
  knowledgeBase: process.env.KNOWLEDGEBASE,
  chunkSize: parseInt(process.env.CHUNK_SIZE, 10),
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP, 10),
  retrivalK: parseInt(process.env.RETRIVAL_K, 10),
};

export default config;
