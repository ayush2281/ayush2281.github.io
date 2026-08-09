import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read JSON context dynamically to avoid import assertion errors
const filePath = join(process.cwd(), 'portfolio_context.json');
const portfolioData = JSON.parse(readFileSync(filePath, 'utf8'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    const systemPrompt = `
You are Ayush AI, an interactive portfolio assistant for candidate Ayush Singh.
Your sole job is to answer HR recruiters, hiring managers, and visitors using the complete candidate profile and Q&A database below.

CANDIDATE DATABASE:
${JSON.stringify(portfolioData, null, 2)}

INSTRUCTIONS:
1. Search the candidate database to answer the user's question accurately.
2. Maintain a confident, polite, and professional tone at all times.
3. Highlight key achievements: 400+ LeetCode problems, 360-day streak, LLM post-training skills, and computer vision projects.
4. Keep answers concise (1-2 paragraphs max) unless explicit technical depth is requested.
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt
    });

    const result = await model.generateContent(message);
    return res.status(200).json({ reply: result.response.text() });
  } catch (error) {
    return res.status(500).json({ error: "Error generating response" });
  }
}
