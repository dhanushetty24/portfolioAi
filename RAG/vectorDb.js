import { ChromaClient } from 'chromadb';
import config from '../config.js';

let client = null;
const getClient = () => {
  if (!client) {
    if (config.chromaUrl) {
      const url = new URL(config.chromaUrl);
      client = new ChromaClient({
        ssl: url.protocol === 'https:',
        host: url.hostname,
        port: url.port
          ? parseInt(url.port, 10)
          : url.protocol === 'https:'
            ? 443
            : 80,
      });
    } else {
      client = new ChromaClient();
    }
  }
  return client;
};

async function getCollection() {
  const chroma = getClient();
  return chroma.getOrCreateCollection({
    name: config.collectionName,
    embeddingFunction: null,
  });
}

export async function addDocuments({ ids, embeddings, documents, metadatas }) {
  const collection = await getCollection();
  await collection.add({ ids, embeddings, documents, metadatas });
  return {
    success: true,
    message: 'Documents added successfully',
  };
}

export async function queryDocuments(queryEmbedding, nResults) {
  const collection = await getCollection();
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
  });

  return {
    documents: results.documents?.[0] || [],
    metadatas: results.metadatas?.[0] || [],
    distances: results.distances?.[0] || [],
  };
}

export async function deleteCollection() {
  const chroma = getClient();
  try {
    await chroma.deleteCollection({ name: config.collectionName });
  } catch {
    // Collection doesn't exist — that's fine
  }
}
