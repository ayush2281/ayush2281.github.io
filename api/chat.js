import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ reply: "⚠️ GEMINI_API_KEY environment variable is not set in Vercel." });
    }

    const filePath = join(process.cwd(), 'portfolio_context.json');
    const portfolioData = JSON.parse(readFileSync(filePath, 'utf8'));

    const genAI = new GoogleGenerativeAI(apiKey);

    const systemPrompt = `
You are Ayush AI, an interactive portfolio assistant for candidate Ayush Singh.
Your sole job is to answer HR recruiters, hiring managers, and visitors using the complete candidate profile and Q&A database below.

CANDIDATE DATABASE:
${JSON.stringify(portfolioData, null, 2)}

INSTRUCTIONS:
1. Search the candidate database to answer the user's question accurately.
2. Maintain a confident, polite, and professional tone at all times.
3. Highlight key achievements: 400+ LeetCode problems, 360-day streak, LLM post-training skills, Virtual Hand-Gesture Calculator project, and academic research work.
4. Keep answers concise (1-2 paragraphs max).
`;

    // Use gemini-1.5-flash for universal compatibility across API versions
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt
    });

    const { message } = req.body;
    const result = await model.generateContent(message);
    const responseText = result.response.text();

    return res.status(200).json({ reply: responseText });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(200).json({ reply: `API Error: ${error.message || 'Failed to generate response'}` });
  }
}
