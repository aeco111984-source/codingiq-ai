/**
 * CodingIQ.ai — ATTL-MAX Hybrid Route (Pages Router version)
 * File path: /pages/api/ai.js
 */

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { command, currentHtml } = req.body || {};

    if (!command || !currentHtml) {
      return res.status(400).json({
        error: "Missing command or currentHtml",
      });
    }

    // Initialize OpenAI
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const SYSTEM = `
You are ATTL running inside CodingIQ.ai.

Return ONLY JSON:
{
  "html": "<FULL NEW HTML>",
  "info": "Short description of what changed"
}

Apply AiQcoding+ full-file law.
Never return markdown or backticks.
`;

    const USER = `
Current HTML (must be replaced):

${currentHtml}

User command:
${command}
`;

    const result = await client.chat.completions.create({
      model: "gpt-5.1",
      temperature: 0.15,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: USER },
      ],
    });

    const raw = result.choices?.[0]?.message?.content?.trim() || "";

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
      info: parsed.info || "Updated full HTML based on your command.",
    });

  } catch (err) {
    return res.status(500).json({
      error: "ATTL-MAX API crash",
      details: err.message,
    });
  }
}
