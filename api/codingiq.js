// Simple CodingIQ backend bridge for Vercel (Node serverless)
// Route: POST /api/codingiq
// Requires: OPENAI_API_KEY in Vercel project env

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Compressed CodingIQ × AAiOS system prompt for gpt-5.1-mini
const SYSTEM_PROMPT = `
You are ATTL, the coding engine of CodingIQ.ai, running inside a small sandbox.
Your ONLY job is to receive a COMMAND and CURRENT_HTML, and return a complete updated HTML document.

Rules:
- Always return a full, valid HTML document:
  - <!DOCTYPE html>
  - <html> ... </html>
  - <head> with meta charset and viewport, sensible <title>, optional <style>.
  - <body> with a clear layout.
- Do NOT return markdown, code fences, comments, or explanations. Output HTML only.
- Follow SBBBFF: Simple Before Brilliant Before Fast Forever.
  - Prefer clear, minimal layout and CSS.
  - Avoid heavy animations or frameworks unless clearly requested.
- Interpret COMMAND intent:
  - If it says “build”, “rebuild”, “start again”, “new homepage”, etc:
    -> You may rebuild completely.
  - If it says “add”, “insert”, “extend”:
    -> Integrate into the current structure.
  - If it says “simplify”, “clean up”:
    -> Refactor for clarity without changing external meaning.
- Keep code readable (AiQ+C):
  - consistent indentation,
  - clean structure,
  - semantic HTML where reasonable.
- Mobile-first layout.

Return ONLY the final HTML document as plain text.
`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed. Use POST." }));
    return;
  }

  try {
    // Read raw POST body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyString = Buffer.concat(chunks).toString("utf8") || "{}";

    let payload;
    try {
      payload = JSON.parse(bodyString);
    } catch (e) {
      payload = {};
    }

    const command = (payload.command || "").toString();
    const currentHtml = (payload.currentHtml || "").toString();

    if (!command) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Missing command." }));
      return;
    }

    // Call OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-5.1-mini",
      temperature: 0.2,
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: [
            "COMMAND:",
            command,
            "",
            "CURRENT_HTML:",
            currentHtml
          ].join("\n")
        }
      ]
    });

    const message = completion.choices?.[0]?.message?.content || "";
    const newHtml = message.trim();

    if (!newHtml.toLowerCase().includes("<html")) {
      // Basic safety check
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "AI did not return full HTML.",
          raw: newHtml.slice(0, 2000)
        })
      );
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ newHtml }));
  } catch (err) {
    console.error("CodingIQ /api/codingiq error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Internal server error.",
        detail: err.message || String(err)
      })
    );
  }
};
