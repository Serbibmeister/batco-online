// netlify/functions/chatgpt.js
import fetch from "node-fetch";

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    const body = JSON.parse(event.body || "{}");
    const { mode, system, payload } = body;
    if (!mode) return { statusCode: 400, body: JSON.stringify({ error: "mode required" }) };

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return { statusCode: 500, body: JSON.stringify({ error: "OPENAI_API_KEY not set" }) };

    const messages = [
      { role: "system", content: system || (mode === "prices" ? "You are a battery materials commodity analyst. Return JSON only." : "You are a specialist intelligence analyst. Return JSON only.") },
      { role: "user", content: payload?.text || (mode==="prices" ? "Return current battery material prices as JSON array." : "Generate BatCo weekly brief JSON.") }
    ];

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: 3000, temperature: 0.12 })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return { statusCode: 502, body: JSON.stringify({ error: "OpenAI error", detail: txt }) };
    }
    const json = await resp.json();
    const modelText = json.choices?.[0]?.message?.content ?? JSON.stringify(json);
    return { statusCode: 200, body: JSON.stringify({ raw: modelText }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
