import { queryDocuments } from './vectorDb.js';
import { embedText } from './embeder.js';
import config from '../config.js';

const retriever = async (query) => {
  try {
    const embeddedPrompt = await embedText(query);
    const sourceDocs = await queryDocuments(embeddedPrompt, config.retrivalK);
    // Step 3: Build the prompt with retrieved context
    const context = sourceDocs.documents
      .map(
        (doc, i) =>
          `--- Chunk ${i + 1} (source: ${sourceDocs.metadatas[i]?.source || 'unknown'}) ---\n${doc}`,
      )
      .join('\n\n');
    return context;
  } catch (err) {
    console.log(err.message);
    return err.message;
  }
};

export default retriever;
