import { queryDocuments } from './vectorDb.js';
import { embedText } from './embeder.js';
import config from '../config.js';
import rerankChunks from './rerankChunk.js';
import promptOptimizer from './promptOptimizer.js';

const retriever = async (query) => {
  try {
    const optimizedPrompt = await promptOptimizer(query);
    const embeddedPrompt = await embedText(optimizedPrompt);
    const sourceDocs = await queryDocuments(embeddedPrompt, config.retrivalK);
    // Step 3: Build the prompt with retrieved context
    const rerankedChunks = await rerankChunks(optimizedPrompt, sourceDocs);
    const context = rerankedChunks.documents
      .map(
        (doc, i) =>
          `--- Chunk ${i + 1} (source: ${rerankedChunks?.metadatas[i]?.source || 'unknown'}) \n Headline: ${rerankedChunks?.metadatas[i].headline} \n Summary: ${rerankedChunks?.metadatas[i].summary} ---\n${doc}`,
      )
      .join('\n\n');

    return context;
  } catch (err) {
    console.log(err.message);
    return err.message;
  }
};

export default retriever;
