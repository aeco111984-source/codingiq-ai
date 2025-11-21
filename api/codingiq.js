import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `
You are ATTL, the coding engine of CodingIQ.ai.
Return ONLY full HTML documents.
No markdown. No code fences. No explanations.
Follow SBBBFF + AiQ+C.
Rebuild when asked. Modify when asked.
Output must ALWAYS be a full <!DOCTYPE html> document.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  try {
    // ❤️ FIXED: Vercel-compatible body parser
    const body = await req.json();

    const command = (body.command || "").toString();
    const currentHtml = (body.currentHtml || "").toString();

    if (!command) {
      return res.status(400).json({ error: "Missing command." });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-5.1",
      temperature: 0.2,
      max_completion_tokens: 5000,
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

    const out = completion.choices?.[0]?.message?.content || "";
    const newHtml = out.trim();

    if (!newHtml.toLowerCase().includes("<html")) {
      return res.status(500).json({
        error: "Invalid HTML returned.",
        returned: newHtml.slice(0, 2000)
      });
    }

    return res.status(200).json({ newHtml });
  } catch (err) {
    console.error("CODINGIQ SERVER ERROR:", err);
    return res.status(500).json({
      error: "Server error",
      detail: err.message
    });
  }
}
