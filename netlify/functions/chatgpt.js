// netlify/functions/chatgpt.js — verbose debug handler
export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    let body;
    try { body = event.body ? JSON.parse(event.body) : {}; } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body", detail: e.message }) };
    }

    const { mode, system, payload } = body || {};
    if (!mode) return { statusCode: 400, body: JSON.stringify({ error: "mode required (prices|newsletter)" }) };

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return { statusCode: 500, body: JSON.stringify({ error: "OPENAI_API_KEY not set in env" }) };

    const messages = [
      { role: "system", content: system || (mode==="prices" ? "You are a battery materials commodity analyst. Return JSON only." : "You are a specialist intelligence analyst. Return JSON only.") },
      { role: "user", content: payload?.text || "" }
    ];

    const openaiRequest = { model: "gpt-4o-mini", messages, max_tokens: 1500, temperature: 0.12 };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(openaiRequest),
    });

    const respText = await resp.text();

    if (!resp.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "OpenAI API error",
          status: resp.status,
          statusText: resp.statusText,
          body: respText
        })
      };
    }

    // Success path: return model text
    try {
      const json = JSON.parse(respText);
      const modelText = json.choices?.[0]?.message?.content ?? respText;
      return { statusCode: 200, body: JSON.stringify({ raw: modelText }) };
    } catch (e) {
      return { statusCode: 200, body: JSON.stringify({ raw: respText }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
