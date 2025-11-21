// pages/api/ai.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = JSON.parse(req.body || "{}");

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: "Missing prompt." });
  }

  try {
    // 1. Read your API key from the environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    // 2. Make the API call to GPT-5.1
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5.1",         // <— ★ YOU ARE NOW USING GPT-5.1
        messages: [
          {
            role: "system",
            content:
              "You are CodingIQ — an elite AI web-developer following AiQcoding+ and ATTL laws. " +
              "Output ONLY clean HTML/CSS/JS when requested. No explanations. No commentary. " +
              "If user asks to build or edit a site, produce valid code blocks immediately."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 18000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(500).json({ error: data.error || "API Error" });
    }

    const text =
      data.choices?.[0]?.message?.content ||
      "[No response from model]";

    return res.status(200).json({ text });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server crashed." });
  }
}
