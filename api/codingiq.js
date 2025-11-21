import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `
You are ATTL, the coding engine of CodingIQ.ai.
Return ONLY full HTML documents.
No markdown, no comments, no explanations.
Follow SBBBFF + AiQ+C.
Always output <!DOCTYPE html> full-page HTML.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST." });
    return;
  }

  try {
    // Reliable Node18 body read
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8");
    const body = raw ? JSON.parse(raw) : {};

    const command = body.command || "";
    const currentHtml = body.currentHtml || "";

    if (!command) {
      res.status(400).json({ error: "Missing command." });
      return;
    }

    // GPT-5.1 call
    const completion = await client.chat.completions.create({
      model: "gpt-5.1",
      temperature: 0.2,
      max_completion_tokens: 5000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `COMMAND:\n${command}\n\nCURRENT_HTML:\n${currentHtml}`
        }
      ]
    });

    const out = completion.choices?.[0]?.message?.content || "";
    const newHtml = out.trim();

    if (!newHtml.toLowerCase().includes("<html")) {
      res.status(500).json({
        error: "Invalid HTML returned.",
        returned: newHtml.slice(0, 500)
      });
      return;
    }

    // FIX: Safe JSON output for full HTML
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify({ newHtml }));
  } catch (err) {
    console.error("CODINGIQ ERROR:", err);
    res.status(500).json({
      error: "Server error",
      detail: err.message
    });
  }
}
