import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { command, currentHtml } = req.body || {};

  if (!command || !currentHtml) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await client.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `Return ONLY JSON:
{
"html": "<FULL HTML>",
"info": "<short text>"
}
No markdown. No backticks.`
        },
        {
          role: "user",
          content: `Current HTML:\n${currentHtml}\n\nUser command: "${command}".`
        }
      ]
    });

    const text = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: text
      });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
