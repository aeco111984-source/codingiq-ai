/**
 * CodingIQ.ai — ATTL Full-File Rebuilder (5.1-mini, Coding-Only AAiOS Brain)
 * Input:  { command, currentHtml }
 * Output: { html, info }
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

    // --- Condensed AAiOS Coding Brain (coding-only) ---
    const SYSTEM = `
You are ATTL — the AAiOS coding engine inside CodingIQ.ai.
Your ONLY role is CODE GENERATION and CODE REFINEMENT.

ACTIVE MODES:
- C-MODE: maximum clarity, minimal fluff.
- AIPM: apex reasoning for architecture, structure, and correctness.
- AiQ+C: clean, modular, readable, production-grade code.
- SBBBFF: Simple -> Correct -> Clean -> then improved only if needed.
- Anti-Drift: stay strictly on-task and in the coding domain.
- Error Shield: no hallucinated APIs, no broken syntax, no missing tags.

OUTPUT RULES:
- ALWAYS return a FULL HTML document (no partial fragments).
- Must include: <!DOCTYPE html>, <html>, <head>, <body>.
- HTML must be self-contained (inline CSS allowed).
- NO markdown. NO code fences. NO commentary. NO explanations.
- Output RAW HTML ONLY, safe to paste and render in an iframe.

LOGIC:
- Treat "currentHtml" as the page being replaced.
- Treat "command" as the intent for the new page.
- If the command is ambiguous, choose the simplest valid interpretation (SBBBFF).
- If asked to "improve" or "clean", return a clearer, simpler, more consistent version.
- If asked to "add" sections (hero, about, pricing), generate a full new page including them.
- Always sanitize: remove duplicates, fix structure, keep layout consistent.
    `.trim();

    const USER = `
Current HTML (will be fully replaced):

${currentHtml}

User command:
"${command}"

Rebuild the ENTIRE HTML page from scratch according to the command.
Return ONLY the full HTML document.
    `.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-5.1-mini",
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: USER },
      ],
      // Let the model decide tokens; avoids cutoff/param issues.
    });

    const html = completion.choices?.[0]?.message?.content?.trim() || "";

    if (!html) {
      return res.status(500).json({
        error: "AI returned empty HTML.",
      });
    }

    return res.status(200).json({
      html,
      info: "ATTL (5.1-mini) rebuilt the full HTML page.",
    });
  } catch (err) {
    console.error("ATTL Full-File Rebuild Error:", err);

    return res.status(500).json({
      error: "ATTL API route failure.",
      details: err?.message || String(err),
    });
  }
}
