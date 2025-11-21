/**
 * CodingIQ.ai — Stable ATTL Builder Route (Simple & Robust)
 * File path: /pages/api/ai.js
 */

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { command, currentHtml } = req.body || {};

  if (!command || !currentHtml) {
    return res.status(400).json({ error: "Missing command or currentHtml." });
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

    // ATTL-style system message, but keep it simple for stability
    const SYSTEM = `
You are ATTL inside CodingIQ.ai.

Task:
- Take the current HTML of a page.
- Take the user's natural language command.
- Return a FULL HTML page (<!DOCTYPE html> ... </html>) that applies the command.

Constraints:
- Respond ONLY with HTML. No explanations, no markdown, no JSON.
- The HTML must be self-contained (inline CSS allowed).
`;

    const USER = `
Current HTML (to be fully replaced):

${currentHtml}

User command:

"${command}"

Rebuild the page as a complete HTML document.
Return ONLY the new HTML.
`;

    // Use a conservative, stable API call: no extra parameters
    const completion = await client.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: USER },
      ],
    });

    const html = (completion.choices?.[0]?.message?.content || "").trim();

    if (!html) {
      return res.status(500).json({
        error: "AI returned empty response.",
      });
    }

    // Wrap into the shape your frontend expects
    return res.status(200).json({
      html,
      info: "ATTL rebuilt the full HTML page based on your command.",
    });
  } catch (err) {
    console.error("CodingIQ AI route error:", err);
    return res.status(500).json({
      error: "Server error in AI route.",
      details: err?.message || String(err),
    });
  }
}
