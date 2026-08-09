import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(200).json({ reply: "API Key missing in Vercel environment." });

    const filePath = join(process.cwd(), 'portfolio_context.json');
    const rawData = readFileSync(filePath, 'utf8');
    const portfolioData = JSON.parse(rawData);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `You are Ayush AI, an assistant for Ayush Singh. Answer concisely based on this data: ${JSON.stringify(portfolioData)}`;
    const userMessage = req.body.message || "Hello";

    const result = await model.generateContent(`${systemPrompt}\n\nQuestion: ${userMessage}`);
    return res.status(200).json({ reply: result.response.text() });
  } catch (error) {
    return res.status(200).json({ reply: `API Error: ${error.message}` });
  }
}
