import React, { useState } from "react";
import { callChatGPT } from "./api";

const PRICE_REFRESH_PROMPT = `You are a battery materials commodity analyst. Search the web RIGHT NOW for the most current prices of battery raw materials. Search for:
1. "SMM lithium carbonate price today 2025"
2. "LME nickel price today"
3. "cobalt metal price today fastmarkets"
4. "lithium hydroxide price SMM"
5. "graphite anode price China"
Return ONLY a JSON array (no markdown) with objects: { "name":"", "src":"", "cur":number, "prev":number, "wkChg":number, "note":"source & date" }.
Only include materials you find actual current data for. Do not invent prices.`;

const NEWSLETTER_PROMPT = `You are a specialist intelligence analyst for BatCo. Create a BatCo weekly intelligence brief in JSON. Include sections "materials" and "technology" with 6-8 stories each. Each story: headline, source, date, url, summary (3-4 sentences), batcoRating (1-5), batcoRationale, tags array. Also include executiveSummary, chinaWatch, batcoRadar {riskLevel,supplyChainConcern,competitiveThreat,topOpportunity,recommendation}. Return ONLY valid JSON.`;

export default function App() {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [err, setErr] = useState("");

  async function refreshPrices() {
    setLoading(true);
    setErr("");
    setOutput("");
    try {
      const resp = await callChatGPT({
        mode: "prices",
        system: PRICE_REFRESH_PROMPT,
        payload: { text: `Return JSON array. Date: ${new Date().toISOString().slice(0,10)}` }
      });
      setOutput(resp.raw);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateBrief() {
    setLoading(true);
    setErr("");
    setOutput("");
    try {
      const resp = await callChatGPT({
        mode: "newsletter",
        system: NEWSLETTER_PROMPT,
        payload: { text: `Generate BatCo Weekly Brief for week ending ${new Date().toLocaleDateString("en-GB")}. Return only JSON.` }
      });
      setOutput(resp.raw);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>BatCo Intelligence (Minimal)</h1>
      <p>Buttons call OpenAI through Vercel serverless `/api/chatgpt`.</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onClick={refreshPrices} disabled={loading} style={{ padding: "10px 16px" }}>
          {loading ? "Working..." : "Refresh Prices"}
        </button>
        <button onClick={generateBrief} disabled={loading} style={{ padding: "10px 16px" }}>
          {loading ? "Working..." : "Generate Weekly Brief"}
        </button>
      </div>

      {err && <div style={{ color: "red", marginBottom: 12 }}>Error: {err}</div>}

      <div style={{ whiteSpace: "pre-wrap", background: "#f7f7f8", padding: 12, borderRadius: 6 }}>
        {output || "AI output will appear here."}
      </div>

      <p style={{ marginTop: 18, color: "#666", fontSize: 13 }}>
        Notes: This is a minimal example. For production use licensed feeds for paywalled sources.
      </p>
    </div>
  );
}
