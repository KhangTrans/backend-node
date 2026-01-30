const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  console.log('Testing Gemini API...');
  console.log('API Key present:', !!process.env.GEMINI_API_KEY);
  console.log('API Key length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log('Sending test message...');
    const result = await model.generateContent("Hello, are you working?");
    const response = await result.response;
    const text = response.text();
    
    console.log('Success! Response:', text);
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    if (error.response) {
      console.error('Error details:', JSON.stringify(error.response, null, 2));
    } else {
        console.error('Full error:', error);
    }
  }
}

testGemini();
