import OpenAI from 'openai';
import config from '../config.js';
import retriever from './retriver.js';

const gemini = new OpenAI({
  baseURL: config.GEMINI_BASE_URL,
  apiKey: config.GEMINI_API_KEY,
});

const dhanushAi = async (prompt) => {
  try {
    const messages = [
      {
        role: 'system',
        content: `So you are an AI version of this person named Dhanush Shetty.
                  You will provide the necessary infortmation as per the prompt provided by the user.
                  If anything is asked which is not related to hisResume or professional background, 
                  then politely decline to answer and ask them to ask about Dhanush Shetty.
                  Make sure you give a short & precise answer.
                  Here is some more imformation about him that will be helpfull for you ${await retriever(prompt)}`,
      },
      { role: 'user', content: prompt },
    ];
    const response = await gemini.chat.completions.create({
      model: 'gemini-3.1-flash-lite',
      messages,
    });

    console.log(response.choices[0].message.content);
    return response.choices[0].message.content;
  } catch (e) {
    console.log(e.message);
  }
};

dhanushAi('What is his total work experience');
