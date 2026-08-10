(function () {
  'use strict';

  const FAQ_URL = 'portfolio_context.json';
  const API_URL = '/api/chat';
  const MAX_MESSAGE_LENGTH = 500;
  const STOP_WORDS = new Set([
    'a', 'about', 'an', 'and', 'are', 'can', 'does', 'for', 'from', 'has', 'have',
    'he', 'her', 'his', 'how', 'i', 'in', 'is', 'it', 'me', 'of', 'on', 'or',
    'should', 'tell', 'that', 'the', 'to', 'what', 'where', 'which', 'who', 'why',
    'with', 'would', 'you', 'ayush', 'singh'
  ]);

  const DIRECT_ANSWERS = [
    {
      aliases: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
      answer: "Hi! Ask me about Ayush's skills, projects, coding record, AI experience, availability, education, strengths, or contact details."
    },
    {
      aliases: ['who is ayush', 'introduce ayush', 'tell me about ayush', 'ayush profile', 'summary'],
      answer: 'Ayush Singh is an AI Engineer and LLM Post-Training specialist focused on Computer Vision, Generative AI, contactless interfaces, and competitive programming. He has solved 400+ LeetCode problems and maintained a 360-day coding streak.'
    },
    {
      aliases: ['top projects', 'best projects', 'projects', 'project list', 'portfolio projects'],
      answer: 'His featured AI project is a Virtual Hand-Gesture Calculator built with Python, OpenCV, and MediaPipe. His portfolio also includes machine-learning projects for credit-card fraud detection, diabetes prediction, heart-disease prediction, spam detection, and movie recommendations.'
    },
    {
      aliases: ['skills', 'skill set', 'tech stack', 'technologies', 'programming languages'],
      answer: 'Ayush works with C++, Python, OpenCV, MediaPipe, LLM post-training, Generative AI, data structures, algorithms, Git, GitHub, and REST API integrations.'
    },
    {
      aliases: ['leetcode', 'coding streak', 'coding record', 'competitive programming'],
      answer: 'Ayush has solved 400+ LeetCode problems and maintained a 360-day daily coding challenge streak, demonstrating strong consistency and algorithmic problem-solving skills.'
    },
    {
      aliases: ['contact', 'email', 'linkedin', 'reach ayush', 'contact ayush'],
      answer: "You can contact Ayush through the Contact section of this portfolio or use the LinkedIn and GitHub links shown on the site."
    }
  ];

  let faqEntries = [];
  let faqLoadPromise;

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9+#]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stem(token) {
    if (token.length > 5 && token.endsWith('ing')) return token.slice(0, -3);
    if (token.length > 4 && token.endsWith('ed')) return token.slice(0, -2);
    if (token.length > 4 && token.endsWith('s')) return token.slice(0, -1);
    return token;
  }

  function tokens(value) {
    return new Set(
      normalize(value)
        .split(' ')
        .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
        .map(stem)
    );
  }

  function overlapScore(query, candidate) {
    const queryTokens = tokens(query);
    const candidateTokens = tokens(candidate);
    if (!queryTokens.size || !candidateTokens.size) return 0;

    let common = 0;
    queryTokens.forEach((token) => {
      if (candidateTokens.has(token)) common += 1;
    });

    const coverage = common / queryTokens.size;
    const precision = common / candidateTokens.size;
    return (coverage * 0.75) + (precision * 0.25);
  }

  async function loadFaq() {
    if (faqLoadPromise) return faqLoadPromise;

    faqLoadPromise = fetch(FAQ_URL)
      .then((response) => {
        if (!response.ok) throw new Error('FAQ data could not be loaded');
        return response.json();
      })
      .then((data) => {
        faqEntries = (data.qa_database || []).flatMap((section) =>
          (section.questions || []).map((item) => ({
            question: item.q,
            answer: item.a,
            category: section.category
          }))
        );
        return faqEntries;
      })
      .catch((error) => {
        console.warn('Local FAQ unavailable:', error.message);
        return [];
      });

    return faqLoadPromise;
  }

  function findDirectAnswer(message) {
    const normalizedMessage = normalize(message);
    let best = null;

    DIRECT_ANSWERS.forEach((entry) => {
      entry.aliases.forEach((alias) => {
        const normalizedAlias = normalize(alias);
        let score = overlapScore(normalizedMessage, normalizedAlias);
        if (normalizedMessage === normalizedAlias) score = 1;
        else if (` ${normalizedMessage} `.includes(` ${normalizedAlias} `)) score = Math.max(score, 0.92);
        if (!best || score > best.score) best = { score, answer: entry.answer };
      });
    });

    return best && best.score >= 0.72 ? best.answer : null;
  }

  function findFaqAnswer(message) {
    const normalizedMessage = normalize(message);
    let best = null;

    faqEntries.forEach((entry) => {
      const normalizedQuestion = normalize(entry.question);
      let score = overlapScore(normalizedMessage, normalizedQuestion);
      if (normalizedMessage === normalizedQuestion) score = 1;
      else if (normalizedQuestion.includes(normalizedMessage) && normalizedMessage.length > 8) {
        score = Math.max(score, 0.9);
      }
      if (!best || score > best.score) best = { score, answer: entry.answer };
    });

    return best && best.score >= 0.62 ? best.answer : null;
  }

  function createMessage(text, isUser, isError) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = isUser ? 'flex-end' : 'flex-start';

    const bubble = document.createElement('span');
    bubble.textContent = text;
    bubble.style.background = isUser ? '#FFC107' : '#1a1a1a';
    bubble.style.color = isError ? '#ff7777' : (isUser ? '#000' : '#ddd');
    bubble.style.fontWeight = isUser ? '600' : '400';
    bubble.style.padding = '8px 12px';
    bubble.style.borderRadius = '12px';
    bubble.style.maxWidth = '85%';
    if (!isUser) bubble.style.border = '1px solid #2a2a2a';
    row.appendChild(bubble);
    return { row, bubble };
  }

  function toggleChat() {
    const win = document.getElementById('ai-chat-window');
    win.style.display = (win.style.display === 'none' || win.style.display === '') ? 'flex' : 'none';
  }

  function sendQuickMsg(text) {
    document.getElementById('chat-input').value = text;
    sendMessage();
  }

  async function askGemini(message) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    let data;
    try {
      data = await response.json();
    } catch (_error) {
      throw new Error('The AI endpoint returned an invalid response.');
    }

    if (!response.ok) {
      const error = new Error(data.reply || data.error || 'The AI service is unavailable.');
      error.status = response.status;
      throw error;
    }

    if (!data.reply) throw new Error('The AI service returned an empty response.');
    return data.reply;
  }

  async function sendMessage() {
    const input = document.getElementById('chat-input');
    const msgBox = document.getElementById('chat-messages');
    const userMessage = input.value.trim();
    if (!userMessage) return;

    if (userMessage.length > MAX_MESSAGE_LENGTH) {
      const warning = createMessage(`Please keep questions under ${MAX_MESSAGE_LENGTH} characters.`, false, true);
      msgBox.appendChild(warning.row);
      return;
    }

    msgBox.appendChild(createMessage(userMessage, true, false).row);
    input.value = '';
    input.disabled = true;

    const pending = createMessage('Searching portfolio information...', false, false);
    pending.bubble.style.color = '#888';
    msgBox.appendChild(pending.row);
    msgBox.scrollTop = msgBox.scrollHeight;

    try {
      await loadFaq();
      const localAnswer = findDirectAnswer(userMessage) || findFaqAnswer(userMessage);
      if (localAnswer) {
        pending.bubble.textContent = localAnswer;
        pending.bubble.style.color = '#ddd';
        return;
      }

      pending.bubble.textContent = 'Asking Ayush AI...';
      pending.bubble.textContent = await askGemini(userMessage);
      pending.bubble.style.color = '#ddd';
    } catch (error) {
      pending.bubble.textContent = error.status === 429
        ? 'The AI question limit has been reached for now. Please try a portfolio-related question or wait a minute.'
        : `${error.message} You can still ask about Ayush's skills, projects, experience, coding record, or availability.`;
      pending.bubble.style.color = '#ff7777';
    } finally {
      input.disabled = false;
      input.focus();
      msgBox.scrollTop = msgBox.scrollHeight;
    }
  }

  loadFaq();
  window.toggleChat = toggleChat;
  window.sendQuickMsg = sendQuickMsg;
  window.sendMessage = sendMessage;
})();
