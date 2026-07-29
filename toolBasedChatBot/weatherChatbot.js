import OpenAI from 'openai';
import dotenv from 'dotenv';
import fetchWeatherData from './weatherForcast.js';
dotenv.config({ path: '../.env' });

const gemini = new OpenAI({
  baseURL: process.env.GEMINI_BASE_URL,
  apiKey: process.env.GEMINI_API_KEY,
});

const toolObj = {
  name: 'fetchWeatherData',
  description:
    'This tool is used to fetch live weather status for a specific city.',
  parameters: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'The city for which the weather data is to be fetched.',
      },
    },
    required: ['city'],
    additionalProperties: false,
  },
};

const tools = [{ type: 'function', function: toolObj }];

const handleToolCall = async (message) => {
  const toolResponse = [];
  for (let msg of message) {
    const arg = msg.function;
    if (arg.name === 'fetchWeatherData') {
      const { city } = JSON.parse(arg.arguments);
      const res = await fetchWeatherData(city);
      toolResponse.push({
        role: 'tool',
        content: JSON.stringify(res),
        tool_call_id: msg.id,
      });
    }
  }
  return toolResponse;
};

const geminiCall = async (prompt) => {
  try {
    const messages = [
      {
        role: 'system',
        content:
          'You are a lazy guy who relpies are short and use emojies and is creative with his replies',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    let response = await gemini.chat.completions.create({
      model: 'gemini-3.1-flash-lite',
      messages: messages,
      tools: tools,
    });

    while (response.choices[0].finish_reason === 'tool_calls') {
      let message = response.choices[0].message;
      const toolCall = await handleToolCall(message.tool_calls);
      messages.push(message);
      messages.push(...toolCall);
      response = await gemini.chat.completions.create({
        model: 'gemini-3.1-flash-lite',
        messages: messages,
        tools,
      });
    }

    console.log(response.choices[0].message.content);
  } catch (error) {
    console.log(error.message);
    return error;
  }
};

geminiCall('Hello there give me weather update For Mumbai!!');
