// ESM version for Vercel Serverless Functions (Node 18+)
// Route: /api/codingiq
// Requires OPENAI_API_KEY in Vercel → Environment Variables

import OpenAI from "openai";

// Create OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// CodingIQ system prompt (compressed + AiQ+C + SBBBFF)
const SYSTEM_PROMPT = `
You are ATTL, the coding engine of CodingIQ.ai.
You ALWAYS return clean, stable, full HTML documents.
No markdown. No explanations. No code fences.
Follow SBBBFF (simple first) and AiQ+C (readable, consistent).
If COMMAND says rebuild → make a new full page.
If COMMAND says modify/add → integrate into CURRENT_HTML.
Return ONLY the final HTML document, nothing else.
Mobile-first. Semantic. Full-file output.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  try {
    // Read raw body
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw || "{}");

    const command = (body.command || "").toString();
    const currentHtml = (body.currentHtml || "").toString();

    if (!command) {
      return res.status(400).json({ error: "Missing command." });
    }

    // OpenAI call using GPT-5.1 (Pro)
    const completion = await client.chat.completions.create({
      model: "gpt-5.1",
      temperature: 0.2,
      max_tokens: 5000,
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

    const response = completion.choices?.[0]?.message?.content || "";
    const newHtml = response.trim();

    if (!newHtml.toLowerCase().includes("<html")) {
      return res.status(500).json({
        error: "Invalid HTML returned.",
        returned: newHtml.slice(0, 2000)
      });
    }

    return res.status(200).json({ newHtml });
  } catch (err) {
    console.error("ERROR in /api/codingiq:", err);
    return res.status(500).json({
      error: "Server error",
      detail: err.message
    });
  }
}
