const OpenAI = require('openai');

let openaiClient = null;

function getOpenAI() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

async function generateAIResponse({ userInput, orgName, faqs, features }) {
  const faqContext = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

  const systemPrompt = `You are ARIA, a professional AI voice receptionist for ${orgName}.
Your job is to:
1. Answer common questions using the FAQ knowledge base
2. Book appointments when callers want to schedule
3. Transfer calls to a human when needed
4. Be warm, professional, and concise (you're speaking, not writing)

ENABLED FEATURES: ${Object.entries(features || {}).filter(([,v])=>v).map(([k])=>k).join(', ')}

FAQ KNOWLEDGE BASE:
${faqContext || 'No FAQs configured yet.'}

RESPONSE RULES:
- Keep responses under 60 words (this is spoken audio)
- Never mention you're an AI unless directly asked
- If asked to book, confirm interest then gather name and preferred time
- If you cannot answer something, offer to transfer or take a message

Respond with JSON only in this format:
{
  "response": "your spoken response here",
  "intent": "faq|book_appointment|transfer|voicemail|general",
  "intentScores": { "booking": 0-100, "faq": 0-100, "transfer": 0-100, "emergency": 0-100 },
  "extractedData": { "name": null, "date": null, "time": null, "service": null }
}`;

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.4,
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return parsed;
  } catch (err) {
    console.error('AI response error:', err);
    return {
      response: "I'm sorry, I'm having trouble processing that right now. Would you like me to connect you with our team?",
      intent: 'transfer',
      intentScores: {},
      extractedData: {}
    };
  }
}

async function generateCallSummary(transcript, orgName) {
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Summarize this call transcript for ${orgName} in 2-3 sentences. Include caller intent, outcome, and any follow-up needed:\n\n${transcript}`
      }],
      max_tokens: 150,
    });
    return completion.choices[0].message.content;
  } catch (err) {
    console.error('Summary error:', err);
    return 'Summary unavailable.';
  }
}

module.exports = { generateAIResponse, generateCallSummary };
