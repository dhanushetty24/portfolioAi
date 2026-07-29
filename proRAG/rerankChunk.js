import geminiCall from './geminiCall.js';

const rerankChunks = async (query, sourceDocs) => {
  try {
    const messages = [
      {
        role: 'user',
        content: `You are an expert search relevance and document re-ranking engine. Your task is to evaluate document chunks against a user query and re-order them strictly by semantic relevance.

### INPUTS
User Query: ${query}

Source Data: 
${JSON.stringify(
  sourceDocs.documents.map((doc, index) => ({
    id: sourceDocs.metadatas[index].chunkIndex,
    content:
      'Headline: ' +
      sourceDocs.metadatas[index].headline +
      '\\n' +
      'Summary: ' +
      sourceDocs.metadatas[index].summary +
      '\\n' +
      'Doc: ' +
      doc,
  })),
)}

### INSTRUCTIONS
1. Analyze the User Query. If the query asks about "features," interpret this as software features, technical skills, capabilities, or projects built by the person.
2. Carefully read the "content" of each item to evaluate its true relevance to the query. 
3. Rank the items from most relevant to least relevant.
4. Items that contain direct answers, technical details, or project descriptions matching the query must be ranked highest. Purely administrative or contact info must be ranked lowest unless explicitly asked for.

### OUTPUT FORMAT
Return ONLY a JSON array of the "id" strings in their new ranked order. Do not include markdown formatting or explanations.

Example Output:
["10", "8", "9", "7", "0"]`,
      },
    ];

    const response_format = { type: 'json_object' };
    const response = await geminiCall(messages, response_format);
    let cleanedResponse = response
      .replace(/^```json\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    const rankedIds = JSON.parse(cleanedResponse);

    // Filter out duplicates in case the LLM returned the same chunk ID multiple times
    const uniqueIds = [...new Set(rankedIds)];

    // Create a lookup map for O(1) access
    const indexMap = new Map();
    const metadatas = sourceDocs.metadatas;
    for (let i = 0; i < metadatas.length; i++) {
      indexMap.set(metadatas[i].chunkIndex, i);
    }

    // Rebuild the object
    const rankedData = { documents: [], metadatas: [] };

    for (const id of uniqueIds) {
      const originalIndex = indexMap.get(id);
      if (originalIndex !== undefined) {
        rankedData.documents.push(sourceDocs.documents[originalIndex]);
        rankedData.metadatas.push(sourceDocs.metadatas[originalIndex]);
      }
    }

    return rankedData;
  } catch (error) {
    console.error(error.message);
    return { documents: [], metadatas: [] };
  }
};

export default rerankChunks;
