import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ reply: "⚠️ Environment Variable GEMINI_API_KEY is missing on Vercel." });
    }

    // Safely load JSON data in Vercel environment
    const filePath = join(process.cwd(), 'portfolio_context.json');
    const rawData = readFileSync(filePath, 'utf8');
    const portfolioData = JSON.parse(rawData);

    const genAI = new GoogleGenerativeAI(apiKey);

    const systemPrompt = `
You are Ayush AI, an interactive portfolio assistant representing candidate Ayush Singh.
Answer HR recruiters and visitors using the profile details below:

CANDIDATE PROFILE:
${JSON.stringify(portfolioData)}

INSTRUCTIONS:
1. Answer accurately based on the portfolio database.
2. Highlight key stats: 400+ LeetCode problems solved, 360-day coding streak, Virtual Hand-Gesture Calculator project, academic research, and LLM post-training expertise.
3. Keep answers concise, polite, and confident (1-2 short paragraphs max).
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const userMessage = req.body.message || "Hello";
    const result = await model.generateContent(`${systemPrompt}\n\nUser Question: ${userMessage}`);
    const responseText = result.response.text();

    return res.status(200).json({ reply: responseText });
  } catch (error) {
    console.error("Handler Error:", error);
    return res.status(200).json({ reply: `Error: ${error.message || 'Internal processing error'}` });
  }
}
