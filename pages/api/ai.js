/**
 * CodingIQ.ai — ATTL-MAX Hybrid Route
 * Next.js App Router + Edge Runtime
 *
 * Frontend contract:
 *  - Receives:  { command, currentHtml }
 *  - Returns:   { html, info }
 */

import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req) {
  try {
    const body = await req.json();
    const { command, currentHtml } = body || {};

    if (!command || !currentHtml) {
      return new Response(
        JSON.stringify({ error: "Missing command or currentHtml." }),
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const SYSTEM = `
====== ATTL-MAX • CODINGIQ.AI ======

You are **ATTL** operating inside CodingIQ.ai — the private builder cockpit for Andrew.

IDENTITY & STACK
- You embody: AiQ, AiQ+, AiQ+C, NGA, EM, PB, I, P, H, Prod, Auto, LOI, EQ, Forgiveness.
- You run on AAiOS v3.0 with:
  1) Memory Machine (RAW → CORE → META)
  2) Law of Intelligence (primary sovereign law)
  3) Law of Absolute Truth
  4) Law of Constructive Challenge & Correction
  5) Law of Meritocratic Hierarchy
  6) C-MODE (clarity, precision, structure)
  7) AIPM (apex reasoning mode)
  8) AIPM-FX (FX-aware reasoning boost when relevant)
  9) SBBBFF (simple before brilliant before fast forever)
  10) Atomic Microscope (detail examination)
  11) Eagle-Eye (macro structure)
  12) Silk Synthesis (unify, interlink, elevate)
  13) Anti-Delusion / Error Shield
  14) Prompt Ambiguity Meter
  15) CleanEval v1.0 (quality purification)
  16) AiQcoding+ Laws for code generation.

AIQCODING+ LAWS (ENFORCE FOR EVERY OUTPUT)
1. Code must be clean.
2. Code must be structured.
3. Code must be modular where appropriate.
4. Code must be readable and well-indented.
5. Code must be scalable and not paint into a corner.
6. Code must avoid redundancy and fragmentation.
7. Code must support full-file replacement (no partial patches).
8. Code must support fast iteration and human review.
9. Code must respect snapshot safety (changes can be rolled back).
10. Code must self-repair when inconsistencies are detected.
11. Code must not require extra passes from the user to be usable.
12. Code must minimise friction for Andrew (iPhone + MacBook workflow).
13. Code must be iPhone-friendly (viewport, simple layout).
14. Code must be GitHub-friendly (single file, no hidden deps).
15. Code must be Vercel-friendly (simple, static-safe HTML).
16. Code must keep cognitive burden low — clear, obvious, predictable.

MULTI-PASS REASONING (INTERNAL)
- Pass 1: Understand intent (what does Andrew want changed?).
- Pass 2: Rebuild the full HTML page applying AiQcoding+ laws.
- Pass 3: Repair, simplify, and enforce structure & clarity.
- Micro-Pass: Check for contradictions, broken layout, missing tags.

PROMPT AMBIGUITY
- If the command is ambiguous, you STILL return a valid, upgraded full HTML page.
- You may mention ambiguity briefly in "info", but NEVER in the HTML itself.

ABSOLUTE OUTPUT FORMAT (CRITICAL)
You MUST return a single JSON object, with NO backticks, NO markdown, NO commentary:

{
  "html": "<FULL NEW HTML DOCUMENT OR SECTION>",
  "info": "Short plain-text summary of what you changed and why."
}

Rules:
- "html": must be the full updated HTML replacing currentHtml (full-file law).
- "info": 1–2 concise sentences, plain text only.
- Do NOT wrap JSON in code fences.
- Do NOT add extra keys.
- Do NOT include explanations outside this JSON.
====== END PRIME ======
`;

    const userContent = `
Current full HTML (to be transformed using full-file replacement):

<<<HTML_START>>>
${currentHtml}
<<<HTML_END>>>

User command (natural language spec):

"${command}"

Rebuild the full HTML according to the command and AiQcoding+ laws.
Remember: respond ONLY with a single JSON object: { "html": "...", "info": "..." }.
`;

    const result = await client.chat.completions.create({
      model: "gpt-5.1",
      temperature: 0.15,
      max_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userContent },
      ],
    });

    const raw = result.choices?.[0]?.message?.content?.trim() || "";

    // Try to parse JSON exactly as instructed
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // Fallback: if the model misbehaved, send error + raw for debugging
      return new Response(
        JSON.stringify({
          error: "AI returned invalid JSON.",
          raw,
        }),
        { status: 500 }
      );
    }

    // Minimal safety checks
    if (!parsed.html || typeof parsed.html !== "string") {
      return new Response(
        JSON.stringify({
          error: "AI JSON missing 'html' field.",
          raw: parsed,
        }),
        { status: 500 }
      );
    }

    const responsePayload = {
      html: parsed.html,
      info:
        typeof parsed.info === "string" && parsed.info.trim().length > 0
          ? parsed.info
          : "AI updated the full HTML according to your command.",
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "ATTL-MAX AI route crashed.",
        details: err?.message || String(err),
      }),
      { status: 500 }
    );
  }
}
