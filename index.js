//make LLM call
//use tool for more details
//setup rag and make rag call
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fetchWeatherData from './weatherForcast.js';

dotenv.config();

const gemini = new OpenAI({
  baseURL: process.env.GEMINI_BASE_URL,
  apiKey: process.env.GEMINI_API_KEY,
});

const weather_tool = {
  name: 'fetchWeatherData', //value is name of the function always in the string
  description: 'Get the weather data for a specific city',
  parameters: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'The city for which the weather data is to be fetched',
      },
    },
    required: ['city'],
    additionalProperties: false,
  },
};

const tools = [{ type: 'function', function: weather_tool }];

const handle_tool_call = async (message) => {
  const data = [];
  for (let msg of message) {
    const arg = msg.function;
    if (arg.name === 'fetchWeatherData') {
      const { city } = JSON.parse(arg.arguments); // the value is in form of string so we need to parse to JSON to get the object to destructure
      const res = await fetchWeatherData(city);
      //generate an object in format of {role: 'tool', context: JSON.stringify(res), tool_call_id: msg.id }
      const tool_call = {
        role: 'tool',
        content: JSON.stringify(res),
        tool_call_id: msg.id,
      };
      data.push(tool_call); //if there are multiple tool calls
    }
  }
  return data;
};

const geminiCall = async (message) => {
  try {
    const messages = [
      {
        role: 'system',
        content:
          'You are a lazy guy who relpies are short and use emojies and is creative with his replies',
      },
      {
        role: 'user',
        content: message,
      },
    ];
    let response = await gemini.chat.completions.create({
      model: 'gemini-3.1-flash-lite',
      messages: messages,
      tools: tools,
    });

    while (response.choices[0].finish_reason === 'tool_calls') {
      let message = response.choices[0].message; //we need message for adding as a chat histry so we will append this message futther
      let tool_response = await handle_tool_call(message.tool_calls);
      messages.push(message); //message added to messages array for LLM
      messages.push(...tool_response);
      response = await gemini.chat.completions.create({
        model: 'gemini-3.1-flash-lite',
        messages: messages,
        tools: tools,
      });
    }
    console.log(response.choices[0].message.content);
  } catch (error) {
    return error.message;
  }
};

geminiCall('Hello there! Give the weather update for Kalyan can you give me some more details like whats the temp!');
