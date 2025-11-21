/**
 * CodingIQ.ai — ATTL Full-File Rebuilder (5.1-mini)
 * Input:  { command, currentHtml }
 * Output: { html, info }
 */

import OpenAI from "openai";

export default async function handler(req, res) {
  // 1) Method guard
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // 2) Extract body safely
  let body = {};
  try {
    // Next.js already parses JSON, but this keeps us safe if it doesn't
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON in request body." });
  }

  const { command, currentHtml } = body;

  if (typeof command !== "string" || typeof currentHtml !== "string") {
    return res.status(400).json({
      error: "Missing or invalid 'command' or 'currentHtml'.",
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

    // --- Condensed AAiOS Coding Brain (coding-only) ---
    const SYSTEM = `
You are ATTL — the coding engine inside CodingIQ.ai.
This is a private AI–human coding cockpit used to build full websites.

Your focus is ONLY:
- understanding the user's request,
- producing full-page HTML,
- keeping code clean, simple, and consistent.

Active guidelines:
- C-MODE: clear, direct, minimal wording.
- AIPM: sensible page structure and layout.
- AiQ+C: readable, maintainable HTML/CSS; avoid over-complexity.
- SBBBFF: start with the simplest working page; improve only when useful.

Output rules:
- ALWAYS return a FULL HTML document when rebuilding:
  <!DOCTYPE html>
  <html>
  <head>...</head>
  <body>...</body>
  </html>
- HTML must be self-contained (inline CSS allowed).
- Do NOT use markdown or code fences.
- Do NOT write explanations in the output — HTML only.
`.trim();

    const USER = `
Current HTML (this will be replaced):

${currentHtml}

User command:

"${command}"

Task:
Rebuild the ENTIRE HTML page from scratch to satisfy the command.
Return ONLY a full HTML document, nothing else.
`.trim();

    // --- GPT-5.1-mini call ---
    const completion = await client.chat.completions.create({
      model: "gpt-5.1-mini",
      temperature: 0.15,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: USER },
      ],
      // Let the model decide length; avoids parameter issues
    });

    let html = (completion.choices?.[0]?.message?.content ?? "").trim();

    // 4) Fallback: if model gave nothing, create a safe minimal page
    if (!html) {
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CodingIQ.ai</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; padding: 2rem; }
  </style>
</head>
<body>
  <h1>CodingIQ.ai</h1>
  <p>The AI did not return any HTML. This is a safe fallback page.</p>
</body>
</html>
      `.trim();
    }

    // 5) If it isn't clearly an HTML document, wrap it safely
    const hasHtmlTag =
      /<!DOCTYPE html>/i.test(html) || /<html[\s>]/i.test(html);

    if (!hasHtmlTag) {
      const escaped = html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CodingIQ.ai</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; padding: 2rem; white-space: pre-wrap; }
  </style>
</head>
<body>
${escaped}
</body>
</html>
      `.trim();
    }

    // 6) Return to frontend
    return res.status(200).json({
      html,
      info: "ATTL (5.1-mini) rebuilt the full HTML page from your command.",
    });
  } catch (err) {
    console.error("CodingIQ /api/ai error:", err);

    return res.status(500).json({
      error: "ATTL API route failure.",
      details: err?.message || String(err),
    });
  }
}
