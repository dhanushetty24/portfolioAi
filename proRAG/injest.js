// Step 1 : Divide the documents into CHUNKS
// Step 2 : We will encode chunks into vector
// Step 3 : Then put in ChromaDB

import fs from 'fs';
import path from 'path';
import config from '../config.js';
import agenticChunk from './chunkContent.js';
import getEmbeddings from './embeder.js';
import { addDocuments, deleteCollection } from './vectorDb.js';
/**
 * Read all .md files from the knowledge base directory.
 *
 * @returns {{ filename: string, text: string }[]}
 */
const loadMarkdownFiles = () => {
  const dirPath = path.resolve(config.knowledgeBase);
  if (!fs.existsSync(dirPath)) {
    console.error(`❌  Knowledge base directory not found: ${dirPath}`);
    console.error(`   Create it and add your .md files there.`);
    process.exit(1);
  }

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.md'));

  if (files.length === 0) {
    console.error(`❌  No .md files found in: ${dirPath}`);
    process.exit(1);
  }

  return files.map((filename) => ({
    filename,
    text: fs.readFileSync(path.join(dirPath, filename), 'utf-8'),
  }));
};

const injest = async () => {
  try {
    //1. loading markdown files
    const fileContent = loadMarkdownFiles();

    const docs = fileContent.map((file) => {
      return {
        pageContent: file.text,
        metadata: {
          source: file.filename,
        },
      };
    });

    const chunkedDocs = await agenticChunk(docs);
    const texts = [];
    const ids = [];
    const metadatas = [];
    chunkedDocs?.forEach((chunk, index) => {
      texts.push(chunk.metadata.summary + '\n\n' + chunk.pageContent);
      ids.push(`${chunk.metadata?.source}_chunk_${index}`);
      metadatas.push({ ...(chunk.metadata || {}), chunkIndex: `${index}` });
    });

    const embeddedChunks = await getEmbeddings(texts);
    await deleteCollection();
    const response = await addDocuments({
      ids,
      embeddings: embeddedChunks,
      documents: texts,
      metadatas,
    });
    console.log(response);
  } catch (err) {
    throw err;
  }
};

injest();
