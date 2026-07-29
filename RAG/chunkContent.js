import { MarkdownTextSplitter } from '@langchain/textsplitters';

const recursiveChunk = async ({ docs, chunkSize, overlap }) => {
  const splitter = new MarkdownTextSplitter({
    chunkSize,
    chunkOverlap: overlap,
  });
  return await splitter.splitDocuments(docs);
};

export default recursiveChunk;
