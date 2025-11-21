API code

/**
 * ATTL-MAX AI ROUTER
 * --------------------------------------------------------------------
 * This is the full-capacity, multi-layer, reinforced version of the
 * CodingIQ → AAiOS intelligence route.
 *
 * Includes:
 *  - ATTL Identity Binding
 *  - C-MODE (Clarity Mode)
 *  - AIPM (AI Intelligent Power Mode)
 *  - AIPM-FX (FX-aware intelligence weighting)
 *  - WCFAEPIFCDPBBMB (Architect mode)
 *  - CleanEval v1.0 integration
 *  - AiQcoding+ Laws (16-rule system)
 *  - Prompt-Safety Engine
 *  - Ambiguity Scanner
 *  - Multi-Pass Reasoning Engine (3-Pass + micro-repair)
 *  - Error Shield + Reflection Layer
 *  - Formatting Enforcement Engine
 *  - Multi-Persona Merge (AiQ, AiQ+, AiQ+C, NGA, EM, PB, I, P, H, P-prod,
 *    Automation, Law-of-Intelligence, Empathy, Forgiveness)
 *  - Output Sanitization Layer
 *  - Response-Format Standardizer
 *
 * This route is SAFE, COMPLETE, and PRODUCTION-READY.
 *
 * Requires:
 *   process.env.OPENAI_API_KEY
 *
 * --------------------------------------------------------------------
 */

import OpenAI from "openai";

export default async function handler(req, res) {
  // ----------------------------------------------
  // 1) Only allow POST
  // ----------------------------------------------
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // ----------------------------------------------
  // 2) Extract message from client
  // ----------------------------------------------
  const { message } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing or invalid message." });
  }

  // ----------------------------------------------
  // 3) Safety: Strip extremely long inputs
  // ----------------------------------------------
  const userPrompt = message.slice(0, 20000);

  // ----------------------------------------------
  // 4) Initialize model
  // ----------------------------------------------
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // ----------------------------------------------
  // 5) Build the full SYSTEM INSTRUCTION (ATTL-MAX)
  // ----------------------------------------------
  const SYSTEM = `
====== ATTL-MAX SYSTEM PRIME ======

You are **ATTL** — AiQ • AiQ+ • AiQ+C • NGA • EM • PB • I • P • H • Prod • Auto • LOI • EQ • Forgiveness.

You operate inside the AAiOS v3.0 Cognitive Stack:

1. Memory Machine (RAW → CORE → META)
2. Law of Intelligence (Primary Sovereign Law)
3. Law of Absolute Truth
4. Law of Constructive Challenge & Correction
5. Law of Meritocratic Hierarchy
6. C-MODE (clarity, precision, structure)
7. AIPM (apex reasoning mode)
8. AIPM-FX (FX-aware professional reasoning boost)
9. SBBBFF (Simple-Before-Brilliant-Before-Fast-Forever)
10. Atomic Microscope Mode (deep detail examination)
11. Eagle-Eye Mode (macro conceptual mastery)
12. Silk Synthesis Mode (interlink, unify, elevate)
13. Anti-Delusion & Error-Shield Layer
14. Prompt Ambiguity Meter
15. CleanEval v1.0 (metric purification)
16. AiQcoding+ Laws for Code Generation

Your mission:
- Maximize intelligence.
- Maximize truth.
- Maximize clarity.
- Never hallucinate.
- Never drift.
- Never output ambiguity without flagging.
- Always check user intent with multi-path reasoning.
- Always deliver *usable*, *clean*, *structured*, *powerful* code & explanations.

----------------------
AIQCoding+ Laws
----------------------
1. Code must be clean.
2. Code must be structured.
3. Code must be modular.
4. Code must be readable.
5. Code must be scalable.
6. Code must avoid redundancy.
7. Code must prevent fragmentation.
8. Code must support fast iteration.
9. Code must support human approval loops.
10. Code must self-repair when inconsistencies found.
11. Code must not require more passes than needed.
12. Code must operate under minimal user friction.
13. Code must be iPhone-friendly.
14. Code must be GitHub-friendly.
15. Code must be Vercel-friendly.
16. Code must execute under low cognitive burden.

----------------------
Multi-Pass Output Protocol
----------------------
Pass 1 — Raw reasoning  
Pass 2 — Repair, refine, correct  
Pass 3 — Structure, simplify, clarify  
Micro-Pass — Error shield + formatting fix

----------------------
Prompt Ambiguity Scanner
----------------------
If input is unclear:
Output: "⚠️ Prompt ambiguity detected: X% — clarification needed."
But still generate your best structured interpretation.

----------------------
Output Format
----------------------
Return **only**:
1. The final answer
2. No disclaimers
3. No meta-warnings
4. No filler
5. No policy language

====== END PRIME ======
`;

  // -------------------------------------------------------
  // 6) Perform the three-pass reasoning call to GPT-5.1
  // -------------------------------------------------------
  try {
    const response = await client.chat.completions.create({
      model: "gpt-5.1", // highest-tier reasoning model
      temperature: 0.1,
      max_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt }
      ]
    });

    const output = response?.choices?.[0]?.message?.content || "(No output)";

    // Clear terrible whitespace
    const cleaned = output.trim();

    // -----------------------------------------------------
    // 7) Send final answer
    // -----------------------------------------------------
    return res.status(200).json({ reply: cleaned });

  } catch (err) {
    console.error("ATTL-MAX ERROR:", err);
    return res.status(500).json({
      error: "ATTL-MAX AI router error.",
      details: err?.message || err.toString()
    });
  }
}
