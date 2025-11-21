// CodingIQ backend bridge for Vercel (Node serverless)
// Route: POST /api/codingiq
// Requires: OPENAI_API_KEY in Vercel project environment variables

const OpenAI = require("openai");

// Create OpenAI client using Vercel environment variable
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Compressed stable system prompt (AiQ+C, SBBBFF)
const SYSTEM_PROMPT = `
You are ATTL, the coding engine of CodingIQ.ai.
Your ONLY job is to take a COMMAND and CURRENT_HTML and return a complete updated HTML document.

RULES:
- Return FULL HTML only (no markdown, no code fences, no commentary).
- Always output <!DOCTYPE html> and a full <html> document.
- Use simple, clean, readable HTML + minimal inline CSS.
- Follow SBBBFF: Simple Before Brilliant Before Fast Forever.
- AiQ+C: clean indentation, good structure, stable output.
- If COMMAND says "rebuild", create new full page.
- If COMMAND says “add”, “extend”, or “modify”, integrate changes but still return a full document.
- If COMMAND says “clean”, “simplify”, or “refactor”, improve clarity but keep meaning.
- Mobile-first layouts.
- Never include explanation or reasoning, only the final HTML.

Return ONLY the final HTML document.
`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  try {
    // Read raw request body manually
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw || "{}");

    const command = (body.command || "").toString();
    const currentHtml = (body.currentHtml || "").toString();

    if (!command) {
      res.status(400).json({ error: "Missing command." });
      return;
    }

    // Call OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-5.1-mini",
      temperature: 0.2,
      max_tokens: 4000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content:
            "COMMAND:\n" +
            command +
            "\n\nCURRENT_HTML:\n" +
            currentHtml
        }
      ]
    });

    const output = completion.choices?.[0]?.message?.content || "";
    const newHtml = output.trim();

    if (!newHtml.toLowerCase().includes("<html")) {
      res.status(500).json({
        error: "Model returned invalid HTML.",
        returned: newHtml.slice(0, 2000)
      });
      return;
    }

    res.status(200).json({ newHtml });
  } catch (error) {
    console.error("CodingIQ API error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      detail: error.message
    });
  }
};
