import geminiCall from './geminiCall.js';

const promptOptimizer = async (prompt) => {
  try {
    const messages = [
      {
        role: 'system',
        content: `You are an expert prompt engineer specializing in "Retrieval-Augmented Generation (RAG)". 
          Your task is to analyze the user's query and enhance it to maximize the accuracy and relevance of the response
           from a RAG system.
           You should act as a preprocessor for the RAG pipeline.
           
           Please refine this query by applying the following transformation logic:
           
           1. **Decomposition**: Break down complex queries into sub-questions if necessary.
           2. **Context Augmentation**: Infer and add relevant keywords that might be missing but are implied by the query.
           3. **Normalization**: Correct any grammatical errors or ambiguous phrasing.
           4. **Specificity**: Make the query more specific to guide the retrieval system better.
           
           Return the optimized query in the following JSON format:
           {
             "optimized_query": "<refined query text>"
           }
           
           Return ONLY the JSON object, without any additional explanation or text.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ];
    const response_format = { type: 'json_object' };
    const response = await geminiCall(messages, response_format);

    // geminiCall returns a JSON string, so we need to parse it
    const { optimized_query } = JSON.parse(response);

    return optimized_query;
  } catch (error) {
    console.error('Error in promptOptimizer:', error.message);
    return prompt; // Fallback to original prompt if optimization fails
  }
};

export default promptOptimizer;
