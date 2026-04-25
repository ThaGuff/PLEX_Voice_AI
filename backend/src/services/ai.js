const OpenAI = require('openai');

function getClient(apiKey) {
  return new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
}

async function generateVoiceResponse({ userInput, orgId, agentId, config, faqs }) {
  const faqContext = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

  const systemPrompt = `${config.system_prompt || 'You are a professional AI receptionist.'}

BUSINESS: ${config.name}
FEATURES: ${[
  config.booking_enabled && 'appointment booking',
  config.faq_enabled && 'FAQ answering',
  config.voicemail_enabled && 'voicemail capture',
  config.transfer_number && 'call transfer',
].filter(Boolean).join(', ')}

FAQ KNOWLEDGE BASE:
${faqContext || 'No FAQs configured.'}

ESCALATION KEYWORDS: ${(config.escalation_keywords || []).join(', ')}

RULES:
- Keep responses under 50 words (this is spoken audio)
- Sound natural and conversational, not robotic
- If caller wants to book, start collecting their name and preferred time
- If you hear escalation keywords, set intent to "transfer"
- If caller says goodbye/thank you/bye, set intent to "goodbye"
- If you cannot help, offer to take a message (intent: "voicemail")

Respond ONLY with valid JSON:
{
  "response": "your spoken response",
  "intent": "general|booking|transfer|voicemail|goodbye|faq",
  "intentScores": {"booking":0,"faq":0,"transfer":0,"emergency":0},
  "extractedData": {"name":null,"date":null,"time":null,"service":null,"phone":null}
}`;

  try {
    const client = getClient(config.openai_api_key);
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.3,
    });
    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error('AI error:', err.message);
    return {
      response: "I'm sorry, I'm having some difficulty right now. Would you like me to connect you with a team member?",
      intent: 'transfer',
      intentScores: {},
      extractedData: {}
    };
  }
}

async function generateCallSummary(transcript, orgName, apiKey) {
  try {
    const client = getClient(apiKey);
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Summarize this call for ${orgName} in 2-3 sentences. Include caller intent, outcome, and follow-up needed:\n\n${transcript}`
      }],
      max_tokens: 150,
    });
    return completion.choices[0].message.content;
  } catch (err) {
    return 'Summary unavailable.';
  }
}

module.exports = { generateVoiceResponse, generateCallSummary };
