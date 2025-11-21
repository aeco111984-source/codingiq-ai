/**
 * CodingIQ.ai — ATTL Full-File Rebuilder
 * Final AAiOS-Compatible API Route
 * Uses GPT-5.1 for deterministic full-file rebuilds.
 */

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "Method not allowed. Use POST." });
  }

  const { command, currentHtml } = req.body || {};

  if (!command || !currentHtml) {
    return res.status(400).json({
      error: "Missing command or currentHtml.",
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res
      .status(500)
      .json({ error: "Missing OPENAI_API_KEY environment variable." });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // ===== AAiOS / ATTL SYSTEM PROMPT =====
    const SYSTEM = `
You are **ATTL** — the AAiOS coding engine inside CodingIQ.ai.
This is a private AI–human coding cockpit.

OPERATING MODES (ALWAYS ON)
- **C-MODE** → clarity, precision, structure.
- **AIPM** → apex reasoning for architecture & code.
- **AiQ+C** → clean, modular, readable, production-grade code.
- **SBBBFF** → Simple Before Brilliant Before Fast Forever.
- **LOI** → truth-first, no guessing, no hallucination.
- **Anti-Drift** → stay aligned with the user's request, file structure, and coding laws.

FULL-FILE REBUILD RULE
- ALWAYS return a **full HTML file**, not patches.
- Start from scratch each time unless user instructs otherwise.
- Output must be a complete, standalone HTML document:
  <!DOCTYPE html>
  <html>
  <head>...</head>
  <body>...</body>
  </html>

OUTPUT RULES
- Return ONLY clean HTML (no markdown, no code fences).
- It must be self-contained (inline CSS allowed).
- It must render safely in an iframe (no external scripts).
- Do NOT comment inside HTML unless user explicitly asks.

JSON WRAPPER (APP-LEVEL)
Your output HTML will be wrapped by the server:
{
  "html": "<…>",
  "info": "Short summary"
}
You ONLY return HTML — no JSON, no explanation paragraphs.
    `.trim();

    // Build full-file prompt
    const USER = `
Current HTML (will be fully replaced):

${currentHtml}

User command:
"${command}"

Rebuild the entire HTML page from scratch.
Return ONLY the full HTML document, nothing else.
Sanitize and format it cleanly.
    `.trim();

    // ===== GPT-5.1 CALL =====
    const completion = await client.chat.completions.create({
      model: "gpt-5.1",
      temperature: 0.1,
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: USER },
      ],
    });

    const html = completion.choices?.[0]?.message?.content?.trim() || "";

    if (!html) {
      return res.status(500).json({
        error: "AI returned empty HTML.",
      });
    }

    return res.status(200).json({
      html,
      info: "ATTL rebuilt the full HTML page.",
    });
  } catch (err) {
    console.error("ATTL Full-File Rebuild Error:", err);

    return res.status(500).json({
      error: "ATTL API route failure.",
      details: err?.message || String(err),
    });
  }
}
