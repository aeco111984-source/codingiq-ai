/**
 * CodingIQ.ai — ATTL Full-File Rebuilder (Stable MVP)
 * Uses GPT-5.1-mini for consistent HTML output inside CodingIQ cockpit.
 */

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
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

    // ===== AAiOS / ATTL System Brain =====
    const SYSTEM = `
You are ATTL — the AAiOS coding engine inside CodingIQ.ai.
This is a private AI–human coding sandbox for building full websites.

MODES (ALWAYS ACTIVE)
- C-MODE: clarity-first, no filler.
- AiQ+C: clean, modular, readable code.
- SBBBFF: Simple Before Brilliant Before Fast Forever.
- LOI: truth-first, no hallucinations, no guessing.
- Anti-Drift: stay aligned with user request.
- Full-file Mode: ALWAYS output full HTML pages.

RULES FOR OUTPUT:
- ALWAYS return a full HTML document (no partial fragments).
- Must include:
  <!DOCTYPE html>
  <html>
  <head>...</head>
  <body>...</body>
  </html>
- MUST be self-contained (inline CSS allowed).
- NO markdown.
- NO code fences.
- NO commentary.
- NO explanations.
- Return HTML ONLY.
`.trim();

    const USER = `
Current HTML (to be fully replaced):

${currentHtml}

User command:
"${command}"

Rebuild the entire HTML page from scratch.
Return ONLY the full HTML document.
`.trim();

    // ===== GPT-5.1-mini CALL (Stable & Fast) =====
    const completion = await client.chat.completions.create({
      model: "gpt-5.1-mini",
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: USER },
      ],
      // No max_tokens — let the model output freely without truncation.
    });

    const html = completion.choices?.[0]?.message?.content?.trim() || "";

    if (!html) {
      return res.status(500).json({
        error: "AI returned empty HTML.",
      });
    }

    return res.status(200).json({
      html,
      info: "ATTL rebuilt a full HTML page.",
    });
  } catch (err) {
    console.error("ATTL Full-File Rebuild Error:", err);

    return res.status(500).json({
      error: "ATTL API route failure.",
      details: err?.message || String(err),
    });
  }
}
