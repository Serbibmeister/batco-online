// api/chatgpt.js  (Vercel serverless function)
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { mode, system, payload } = req.body || {};
    if (!mode) return res.status(400).json({ error: "mode required (prices|newsletter)" });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return res.status(500).json({ error: "OPENAI_API_KEY not set in env" });

    const messages = [
      { role: "system", content: system || (mode === "prices" ? "You are a battery materials commodity analyst. Return JSON only." : "You are a specialist intelligence analyst. Return JSON only.") },
      { role: "user", content: payload?.text || (mode==="prices" ? "Return current battery material prices as JSON array." : "Generate BatCo weekly brief JSON.") }
    ];

    const body = {
      model: "gpt-4o-mini",
      messages,
      max_tokens: 3000,
      temperature: 0.12
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("OpenAI error:", errText);
      return res.status(502).json({ error: "OpenAI API error", detail: errText });
    }

    const json = await r.json();
    const modelText = json.choices?.[0]?.message?.content ?? JSON.stringify(json);
    return res.status(200).json({ raw: modelText, meta: { openai: true } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
