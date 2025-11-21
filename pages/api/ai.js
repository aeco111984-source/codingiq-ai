/**
 * CodingIQ.ai — ATTL-MAX route (Full HTML + JSON)
 * File path: /pages/api/ai.js
 */

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res
      .status(500)
      .json({ error: "Missing OPENAI_API_KEY environment variable." });
  }

  try {
    const { command, currentHtml } = req.body || {};

    if (!command || !currentHtml) {
      return res.status(400).json({
        error: "Missing command or currentHtml.",
      });
    }

    const SYSTEM = `
You are ATTL inside CodingIQ.ai.

You MUST ALWAYS return STRICT JSON:

{
  "html": "<FULL VALID HTML DOCUMENT HERE>",
  "info": "Short description of what changed"
}

Rules:
- No markdown
- No backticks
- No text before or after the JSON
- No partial HTML. Always a full <!DOCTYPE html> page.
`;

    const USER = `
Current HTML (to be fully replaced):

${currentHtml}

User command:

"${command}"

Rebuild the page as a complete HTML document and return ONLY the JSON object described above.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-5.1",
      temperature: 0.15,
      max_completion_tokens: 2048,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: USER },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || "";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return res.status(500).json({
        error: "AI returned invalid JSON.",
        raw,
      });
    }

    if (!parsed.html || typeof parsed.html !== "string") {
      return res.status(500).json({
        error: "AI JSON missing 'html' field.",
        raw: parsed,
      });
    }

    const info =
      typeof parsed.info === "string" && parsed.info.trim().length > 0
        ? parsed.info
        : "Updated full HTML according to your command.";

    return res.status(200).json({
      html: parsed.html,
      info,
    });
  } catch (err) {
    return res.status(500).json({
      error: "ATTL-MAX API crash.",
      details: err?.message || String(err),
    });
  }
}
