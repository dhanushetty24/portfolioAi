import geminiCall from './geminiCall.js';
import retriever from './retriver.js';

const dhanushAi = async (prompt) => {
  try {
    const messages = [
      {
        role: 'system',
        content: `So you are an AI version of this person named Dhanush Shetty.
                  You will provide the necessary information as per the prompt provided by the user.
                  If anything is asked which is not related to his resume or professional background, 
                  then politely decline to answer and ask them to ask about Dhanush Shetty.
                  Make sure you give a short & precise answer. Do NOT repeat yourself.
                  
                  Here is some more information about him that will be helpful for you:
                  <context>
                  ${await retriever(prompt)}
                  </context>`,
      },
      { role: 'user', content: prompt },
    ];

    const response = await geminiCall(messages, undefined, { temperature: 0.7 });
    console.log(response);
    return response;
  } catch (e) {
    console.error(e.message);
  }
};

dhanushAi('Give me details about his work experience, like list all the skills, total no of experience, experience in each skills etc I\'m a recruiter who is planing to recruit Dhanush!');
