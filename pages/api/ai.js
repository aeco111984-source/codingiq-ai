/**
 * CodingIQ.ai — ATTL-MAX Hybrid Route (Full HTML Mode, Pages Router)
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

    // --- STRICT FULL-HTML ENFORCEMENT -----------------------
    const SYSTEM = `
You are ATTL inside CodingIQ.ai.

RULE: ALWAYS return STRICT JSON:
{
  "html": "<FULL VALID HTML DOCUMENT>",
  "info": "short explanation of change"
}

ABSOLUTELY NO:
- Markdown
- Backticks
- Raw HTML outside JSON
- Commentary
- Text before/after JSON
- Partial components (no sections only!)

You ALWAYS return a **full HTML page** including:
<!DOCTYPE html>
<html>
<head> ... </head>
<body> ... </body>
</html>

HTML REQUIREMENTS:
- Mobile responsive
- No external scripts
- Clean, stable, readable
- Self-contained CSS allowed in <style> inside <head>
- Must render correctly in an iframe
- No Tailwind unless explicitly asked
- No remote dependencies
- Must NOT contain JSON-breaking characters

AiQcoding+ Full-File Law:
- Every update is a full rebuild of the ENTIRE HTML file
- Must always be consistent and valid
- Do not reuse broken styles from input
`;

    const USER = `
Current site HTML (full replacement target):
${currentHtml}

User command (full-site change request):
"${command}"

Your job: produce the full HTML document that matches the command.
Return JSON ONLY. 
`;

    const response = await client.chat.completions.create({
      model: "gpt-5.1",
      temperature: 0.15,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: USER },
      ],
      max_tokens: 4096,
    });

    const raw = response.choices?.[0]?.message?.content || "";

    // --- PARSE JSON SAFELY -------------------------
    let parsed;
    try {
      parsed = JSON.parse(raw.trim());
    } catch (err) {
      return res.status(500).json({
        error: "AI returned invalid JSON.",
        raw,
      });
    }

    // --- VALIDATE -------------------------
    if (!parsed.html || typeof parsed.html !== "string") {
      return res.status(500).json({
        error: "AI JSON missing 'html' field.",
        raw: parsed,
      });
    }

    if (!parsed.info) {
      parsed.info = "Updated full HTML according to your command.";
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({
      error: "ATTL-MAX API crash.",
      details: err.message,
    });
  }
}
