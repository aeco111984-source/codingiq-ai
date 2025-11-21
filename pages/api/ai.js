/**
 * CodingIQ.ai — ATTL-MAX Hybrid Route (Full HTML Mode, Responses API)
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

    // STRICT JSON + FULL HTML
    const SYSTEM = `
You are ATTL inside CodingIQ.ai.

YOU MUST ALWAYS RETURN EXACT JSON:
{
  "html": "<FULL VALID HTML DOCUMENT HERE>",
  "info": "Short description of the change"
}

NO:
- Markdown
- Backticks
- Raw HTML outside JSON
- Partial HTML
- Commentary
- Extra text

ALWAYS output a full HTML page:
<!DOCTYPE html>
<html>
<head> ... </head>
<body> ... </body>
</html>
`;

    const USER = `
Current HTML:
${currentHtml}

User command:
"${command}"

Return ONLY JSON with the full HTML page.
`;

    // GPT-5.1 CORRECT CALL (Responses API)
    const response = await client.responses.create({
      model: "gpt-5.1",
      input: [
        { role: "system", content: SYSTEM },
        { role: "user", content: USER }
      ],
      max_output_tokens: 4096
    });

    const raw = response.output_text;

    let parsed;
    try {
      parsed = JSON.parse(raw.trim());
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

    if (!parsed.info) {
      parsed.info = "Updated full HTML according to your command.";
    }

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({
      error: "ATTL-MAX API crash",
      details: err.message,
    });
  }
}
