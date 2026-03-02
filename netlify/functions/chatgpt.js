// netlify/functions/chatgpt.js (robust handler using global fetch)
export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (parseErr) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body", detail: parseErr.message }) };
    }

    const { mode, system, payload } = body || {};
    if (!mode) return { statusCode: 400, body: JSON.stringify({ error: "mode required (prices|newsletter)" }) };

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return { statusCode: 500, body: JSON.stringify({ error: "OPENAI_API_KEY not set in env" }) };

    const messages = [
      { role: "system", content: system || (mode === "prices" ? "You are a battery materials commodity analyst. Return JSON only." : "You are a specialist intelligence analyst. Return JSON only.") },
      { role: "user", content: payload?.text || "" }
    ];

    const openaiRequest = {
      model: "gpt-4o-mini",
      messages,
      max_tokens: 1500,
      temperature: 0.12
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(openaiRequest),
    });

    const respText = await resp.text();

    if (!resp.ok) {
      // Return comprehensive error info so you can see what's failing (401/429/etc.)
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

    // try to parse JSON (but return raw if parse fails)
    let json;
    try {
      json = JSON.parse(respText);
    } catch (e) {
      // return raw text if parsing fails
      return { statusCode: 200, body: JSON.stringify({ raw: respText, meta: { parsed: false } }) };
    }

    const modelText = json.choices?.[0]?.message?.content ?? JSON.stringify(json);

    return { statusCode: 200, body: JSON.stringify({ raw: modelText, meta: { parsed: true } }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
