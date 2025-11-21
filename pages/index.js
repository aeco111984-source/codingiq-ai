import { useState } from "react";

/*
  CodingIQ.ai — Builder v1.3
  Andrew + ATTL private cockpit

  Core ideas:
  • Natural language commands
  • AiQcoding+ laws: full-file replacement, snapshot safety, Plan → Confirm → Build → Refine
  • AI proposes → you approve → system applies
  • All code changes go through /api/ai, which applies the AAiOS + AiQcoding+ system prompt

  NOTE:
  This file handles UI + local state + snapshots.
  All intelligence lives in /api/ai.js where we call OpenAI with ATTL brain.
*/

export default function Home() {
  // Single-project state for MVP
  const [project, setProject] = useState({
    name: "My Site",
    html: `<section class="block">
      <h1>CodingIQ.ai</h1>
      <p>Type what you want and ATTL will help you build it.</p>
    </section>`,
    snapshots: []
  });

  const [input, setInput] = useState("");
  const [log, setLog] = useState([
    {
      from: "system",
      text: "CodingIQ builder ready. Describe the change (e.g. 'Build a 3-tab FX site with blue and white theme')."
    }
  ]);

  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(false);

  // Save a snapshot before applying a change
  function saveSnapshot(label = "Before change") {
    setProject(prev => ({
      ...prev,
      snapshots: [
        ...prev.snapshots,
        {
          html: prev.html,
          label,
          time: new Date().toLocaleTimeString()
        }
      ]
    }));
  }

  function restoreSnapshot(index) {
    const snap = project.snapshots[index];
    if (!snap) return;
    setProject(prev => ({
      ...prev,
      html: snap.html
    }));
    setLog(prev => [
      ...prev,
      { from: "system", text: `Restored snapshot: ${snap.label}` }
    ]);
  }

  function forkProject() {
    const forkName = `${project.name} (Fork at ${new Date().toLocaleTimeString()})`;
    setLog(prev => [
      ...prev,
      { from: "system", text: `Forked project: ${forkName}` }
    ]);
    // For MVP, we only log the fork. Later we can store separate project instances.
  }

  async function applyPending() {
    if (!pending) return;
    // For MVP, pending.html is already the full new HTML (AiQcoding+ full-file law).
    saveSnapshot("Before APPLY");
    setProject(prev => ({
      ...prev,
      html: pending.html
    }));
    setLog(prev => [
      ...prev,
      { from: "system", text: "Applied AI proposal (full-file update)." }
    ]);
    setPending(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input.trim();
    setLog(prev => [...prev, { from: "user", text }]);
    setInput("");

    setLoading(true);

    try {
      // Call our AI route with current HTML + natural language command
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: text,
          currentHtml: project.html
        })
      });

      if (!res.ok) {
        const err = await res.text();
        setLog(prev => [
          ...prev,
          { from: "system", text: `Error from AI route: ${err}` }
        ]);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!data || !data.html) {
        setLog(prev => [
          ...prev,
          { from: "system", text: "AI did not return HTML. Try rephrasing your command." }
        ]);
        setLoading(false);
        return;
      }

      // Store pending proposal so you can CLICK APPLY
      setPending({ html: data.html, info: data.info || "" });
      setLog(prev => [
        ...prev,
        {
          from: "system",
          text:
            data.info ||
            "AI has proposed a full-page update. Review and press APPLY if you approve."
        }
      ]);
    } catch (err) {
      console.error(err);
      setLog(prev => [
        ...prev,
        { from: "system", text: "Error calling AI. Check console / API key / Vercel logs." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>CodingIQ.ai</h1>
          <p className="subtitle">Private Builder — Andrew × ATTL</p>
        </div>
        <div className="header-actions">
          <button onClick={forkProject}>Fork</button>
        </div>
      </header>

      <main className="layout">
        {/* LEFT: Commands / Log */}
        <section className="panel left">
          <h2>Commands</h2>
          <div className="log">
            {log.map((m, i) => (
              <div key={i} className={`msg ${m.from}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="msg system">
                ATTL is thinking (AiQcoding+ / AAiOS)… please wait.
              </div>
            )}
          </div>

          {pending && (
            <div className="pending">
              <div>Pending action — review and press APPLY to confirm.</div>
              {pending.info && <div className="pending-info">{pending.info}</div>}
              <button onClick={applyPending}>APPLY</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="input-row">
            <input
              value={input}
              placeholder="Describe a change or full site spec…"
              onChange={e => setInput(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? "…" : "OK"}
            </button>
          </form>
        </section>

        {/* RIGHT: Live Preview */}
        <section className="panel right">
          <h2>Preview</h2>
          <iframe
            title="preview"
            srcDoc={project.html}
            sandbox="allow-same-origin allow-scripts"
          />
        </section>
      </main>

      {/* Snapshots */}
      <section className="snapshots">
        <h3>Snapshots</h3>
        {project.snapshots.length === 0 && (
          <p className="snap-empty">
            No snapshots yet. They’ll appear here each time you APPLY.
          </p>
        )}
        {project.snapshots.map((snap, i) => (
          <div key={i} className="snap">
            <div>{snap.label}</div>
            <div className="snap-time">{snap.time}</div>
            <button onClick={() => restoreSnapshot(i)}>Restore</button>
          </div>
        ))}
      </section>
    </div>
  );
}
