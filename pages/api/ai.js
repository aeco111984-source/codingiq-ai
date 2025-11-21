/**
 * CodingIQ.ai — ATTL-MAX (Full HTML Mode, Stable Vercel-Compatible)
 * File path: /pages/api/ai.js
 */

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { command, currentHtml } = req.body || {};

    if (!command || !currentHtml) {
      return res.status(400).json({
        error: "Missing command or currentHtml.",
      });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // STRONG FULL HTML + STRICT JSON GUARANTEE
    const SYSTEM = `
You are ATTL inside CodingIQ.ai.

RETURN STRICT JSON ONLY:
{
  "html": "<FULL VALID HTML DOCUMENT>",
  "info": "Short description of what changed"
}

Rules:
- No text outside JSON
- No markdown
- No backticks
- No partial HTML
- Always a complete <!DOCTYPE html> document
`;

    const USER = `
Current HTML (replace fully):
${currentHtml}

User command:
"${command}"

Return the JSON object ONLY.
`;

    // ✔ Stable Completions API (Vercel-compatible)
    const completion = await client.chat.completions.create({
      model: "gpt-5.1",
      temperature: 0.15,
      max_completion_tokens: 2048,   // ✔ correct parameter
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: USER }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || "";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw,
      });
    }

    if (!parsed.html) {
      return res.status(500).json({
        error: "AI JSON missing 'html'",
        raw: parsed,
      });
    }

    return res.status(200).json({
      html: parsed.html,
      info: parsed.info || "Updated full HTML according to your command."
    });

  } catch (err) {
    return res.status(500).json({
      error: "ATTL-MAX API crash",
      details: err.message,
    });
  }
}
