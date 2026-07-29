import geminiCall from './geminiCall.js';

const agenticChunk = async (docs) => {
  try {
    const howMany = Math.round(docs[0]['pageContent'].length / 200); //Need to write code for multiple docs  for now we are using static ie doc[0]
    const response_format = { type: 'json_object' };
    const messages = [
      {
        role: 'user',
        content: `You take a document and you split the document into overlapping chunks for a KnowledgeBase.
The document is basically Dhanush Shetty's resume which contains all the lasted details about his profesion and experience.
The document is of type: markdown
The document has been retrieved from
swer questions about the Dhanush Shetty.
You should divide up the document as you see fit, being sure that the entire document is returned in the chunks - don't leave anything out.
This document should probably be split into ${howMany} chunks, but you can have more or less as appropriate.
There should be overlap between the chunks as appropriate; typically about 25% overlap or about 50 words, so you have the same text in multiple chunks for best retrieval results.
For each chunk, you should provide a headline, a summary, and the original text of the chunk.
Together your chunks should represent the entire document with overlap.
Here is the document:
${docs[0]['pageContent']}
Respond with the chunks. in array of object json format i.e [{
            metadata: {
              source: string,
              headline: string,
              summary: string,
            },
            pageContent: string,
          }]`,
      },
    ];

    const response = await geminiCall(messages, response_format);
    let cleanedResponse = response.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleanedResponse);
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};

export default agenticChunk;
