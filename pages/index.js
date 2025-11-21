import { useState } from "react";
import Head from "next/head";

/*
  CodingIQ.ai — Builder v2.0 (C-MODE / ATTL cockpit)

  Core principles:
  • Natural language → Full-page HTML → Human approval (APPLY)
  • AiQcoding+ full-file replacement + snapshot safety
  • Zero partial patches: every change is a full new HTML proposal
  • Anti-friction UI: centred, stable, iPhone-first, no weird zooming

  Intelligence lives in:
  • /pages/api/ai.js  (ATTL-MAX + AAiOS system prompt)
*/

export default function Home() {
  // Single-project state for MVP
  const [project, setProject] = useState({
    name: "My Site",
    html: `
<section class="preview-root">
  <main class="preview-main">
    <h1>CodingIQ.ai</h1>
    <p>Describe what you want and ATTL will rebuild this page for you.</p>
    <ul>
      <li>Example: "Make a clean FX landing page with 3 columns."</li>
      <li>Example: "Turn this into a dark dashboard with a hero and 3 cards."</li>
    </ul>
  </main>
</section>`,
    snapshots: [],
  });

  const [input, setInput] = useState("");
  const [log, setLog] = useState([
    {
      from: "system",
      text:
        "CodingIQ builder ready. Describe the change (e.g. 'Build a 3-tab FX site with blue and white theme').",
    },
  ]);
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(false);

  // Save a snapshot before applying a change
  function saveSnapshot(label = "Before change") {
    setProject((prev) => ({
      ...prev,
      snapshots: [
        ...prev.snapshots,
        {
          html: prev.html,
          label,
          time: new Date().toLocaleTimeString(),
        },
      ],
    }));
  }

  function restoreSnapshot(index) {
    const snap = project.snapshots[index];
    if (!snap) return;
    setProject((prev) => ({
      ...prev,
      html: snap.html,
    }));
    setLog((prev) => [
      ...prev,
      { from: "system", text: `Restored snapshot: ${snap.label}` },
    ]);
  }

  function forkProject() {
    const forkName = `${project.name} (Fork @ ${new Date().toLocaleTimeString()})`;
    setLog((prev) => [
      ...prev,
      { from: "system", text: `Forked project: ${forkName}` },
    ]);
    // MVP: log only. Future: store multiple projects.
  }

  async function applyPending() {
    if (!pending) return;
    saveSnapshot("Before APPLY");
    setProject((prev) => ({
      ...prev,
      html: pending.html,
    }));
    setLog((prev) => [
      ...prev,
      { from: "system", text: "Applied AI proposal (full-file update)." },
    ]);
    setPending(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input.trim();
    setLog((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: text,
          currentHtml: project.html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        setLog((prev) => [
          ...prev,
          { from: "system", text: `Error from AI route: ${err}` },
        ]);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!data || !data.html) {
        setLog((prev) => [
          ...prev,
          {
            from: "system",
            text: "AI did not return HTML. Try rephrasing your command.",
          },
        ]);
        setLoading(false);
        return;
      }

      setPending({ html: data.html, info: data.info || "" });
      setLog((prev) => [
        ...prev,
        {
          from: "system",
          text:
            data.info ||
            "AI has proposed a full-page update. Review and press APPLY if you approve.",
        },
      ]);
    } catch (err) {
      console.error(err);
      setLog((prev) => [
        ...prev,
        {
          from: "system",
          text:
            "Error calling AI. Check console / API key / Vercel logs if this persists.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>CodingIQ.ai — ATTL Builder</title>
        {/* Lock zoom / left-drift as much as possible */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>

      <div className="app">
        <header className="header">
          <div className="header-main">
            <h1>CodingIQ.ai</h1>
            <p className="subtitle">Private Builder — Andrew × ATTL (C-MODE)</p>
          </div>
          <div className="header-actions">
            <button className="btn ghost" onClick={forkProject}>
              Fork
            </button>
          </div>
        </header>

        <main className="layout">
          {/* LEFT: Commands / Log */}
          <section className="panel left">
            <div className="panel-header">
              <h2>Commands</h2>
              <p className="panel-sub">
                Describe changes. ATTL proposes. You approve. Full-file only.
              </p>
            </div>

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
                <div className="pending-title">
                  Pending proposal — review then APPLY.
                </div>
                {pending.info && (
                  <div className="pending-info">{pending.info}</div>
                )}
                <button className="btn primary" onClick={applyPending}>
                  APPLY
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="input-row">
              <input
                value={input}
                placeholder="Describe a change or full site spec…"
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" disabled={loading} className="btn primary">
                {loading ? "…" : "OK"}
              </button>
            </form>
          </section>

          {/* RIGHT: Live Preview */}
          <section className="panel right">
            <div className="panel-header">
              <h2>Preview</h2>
              <p className="panel-sub">
                This is the full HTML your visitors would see.
              </p>
            </div>
            <div className="preview-shell">
              <iframe
                title="preview"
                srcDoc={project.html}
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </section>
        </main>

        {/* Snapshots */}
        <section className="snapshots">
          <div className="snapshots-header">
            <h3>Snapshots</h3>
            <p className="snap-sub">
              Stored before APPLY. Use them as safety checkpoints.
            </p>
          </div>
          {project.snapshots.length === 0 && (
            <p className="snap-empty">
              No snapshots yet. They’ll appear here each time you APPLY.
            </p>
          )}
          <div className="snap-list">
            {project.snapshots.map((snap, i) => (
              <div key={i} className="snap">
                <div className="snap-main">
                  <div className="snap-label">{snap.label}</div>
                  <div className="snap-time">{snap.time}</div>
                </div>
                <button
                  className="btn tiny"
                  onClick={() => restoreSnapshot(i)}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
