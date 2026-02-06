import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function testModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('GEMINI_API_KEY is missing');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(key);
  
  try {
    console.log('Testing gemini-2.5-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Hello, are you there?');
    const response = await result.response;
    console.log('Success! Response:', response.text());
  } catch (error: any) {
    console.error('Error testing model:', error.message);
  }
}

testModel();
