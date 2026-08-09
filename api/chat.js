import { GoogleGenerativeAI } from '@google/generative-ai';

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
        q: "What are his strengths?",
        a: "Strong algorithmic speed, daily consistency, rapid tech-stack onboarding, research capability, and C++/Python engineering."
      },
      {
        q: "What is his weakness?",
        a: "He can over-engineer solutions for extreme edge cases, managed by setting strict sprint milestone deadlines."
      }
    ]
  }
};

export default async function handler(req, res) {
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
      return res.status(200).json({ reply: "⚠️ GEMINI_API_KEY is missing in Vercel environment settings." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `You are Ayush AI, representing candidate Ayush Singh. Answer concise and accurately using this candidate data: ${JSON.stringify(portfolioData)}`;
    const userMessage = req.body ? req.body.message : "Hello";

    const result = await model.generateContent(`${systemPrompt}\n\nQuestion: ${userMessage}`);
    return res.status(200).json({ reply: result.response.text() });
  } catch (error) {
    return res.status(200).json({ reply: `API Error: ${error.message || 'Error processing request'}` });
  }
}
