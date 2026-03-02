// server.js - simple Express server for Render
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/api/chatgpt", async (req, res) => {
  try {
    const { mode, system, payload } = req.body || {};
    if (!mode) return res.status(400).json({ error: "mode required" });
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return res.status(500).json({ error: "OPENAI_API_KEY not set" });

    const messages = [
      { role: "system", content: system || (mode === "prices" ? "You are a battery materials commodity analyst. Return JSON only." : "You are a specialist intelligence analyst. Return JSON only.") },
      { role: "user", content: payload?.text || "" }
    ];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: 3000, temperature: 0.12 })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ error: "OpenAI error", detail: t });
    }
    const json = await r.json();
    const modelText = json.choices?.[0]?.message?.content ?? JSON.stringify(json);
    res.json({ raw: modelText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static("dist")); // serve your built React site from 'dist'

const port = process.env.PORT || 10000;
app.listen(port, () => console.log("Server listening on", port));
