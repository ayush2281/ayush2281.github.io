import { GoogleGenerativeAI } from '@google/generative-ai';

// Embedded Knowledge Base (No JSON file loading needed!)
const portfolioData = {
  candidate: {
    name: "Ayush Singh",
    role: "AI Engineer | LLM Post-Training Specialist",
    achievements: [
      "400+ LeetCode problems solved",
      "360-day daily coding challenge streak",
      "Academic research paper presentation on contactless gesture interfaces",
      "Active task execution on Outlier and Multimango platforms"
    ],
    skills: ["C++", "Python", "OpenCV", "MediaPipe", "LLM Post-Training", "Generative AI"],
    projects: [
      {
        name: "Virtual Hand-Gesture Calculator",
        tech: "Python, OpenCV, MediaPipe",
        description: "Interactive contactless user interface that interprets hand gestures in real-time to compute mathematical operations."
      }
    ],
    qa: [
      {
        q: "Why should HR hire Ayush?",
        a: "Ayush combines strong computer science fundamentals with remarkable consistency (360-day LeetCode streak, 400+ solved problems) and hands-on specialization in LLM post-training and computer vision research."
      },
      {
        q": "What are his strengths?",
        a: "Strong algorithmic speed, daily consistency, rapid tech-stack onboarding, research capability, and C++/Python engineering."
      },
      {
        q": "What is his weakness?",
        a: "He can over-engineer solutions for extreme edge cases, managed by setting strict sprint milestone deadlines."
      }
    ]
  }
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ reply: "⚠️ GEMINI_API_KEY environment variable is missing in Vercel." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
You are Ayush AI, an interactive portfolio assistant representing candidate Ayush Singh.
Answer HR recruiters and visitors using the candidate details below:

CANDIDATE DATA:
${JSON.stringify(portfolioData)}

INSTRUCTIONS:
1. Provide accurate answers based on the candidate details.
2. Always emphasize his core achievements: 400+ LeetCode problems, 360-day streak, LLM post-training skills, Virtual Hand-Gesture Calculator, and academic research work.
3. Keep answers concise, polite, and professional (1-2 paragraphs max).
`;

    const userMessage = req.body.message || "Hello";
    const result = await model.generateContent(`${systemPrompt}\n\nUser Question: ${userMessage}`);
    const responseText = result.response.text();

    return res.status(200).json({ reply: responseText });
  } catch (error) {
    console.error("API Execution Error:", error);
    return res.status(200).json({ reply: `API Error: ${error.message || 'Error generating response'}` });
  }
}
