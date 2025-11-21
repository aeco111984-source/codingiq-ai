import { useState } from "react";

/*
  CodingIQ.ai — Builder v2.0
  Andrew × ATTL — AAiOS Coding Cockpit

  New features:
  • Proposal History (view old proposals)
  • Proposal Preview
  • Proposal Restore (turn old proposal into pending again)
  • Clean UI upgrade while keeping your entire MVP structure
*/

export default function Home() {
  // Main project state
  const [project, setProject] = useState({
    name: "My Site",
    html: `<section class="block">
      <h1>CodingIQ.ai</h1>
      <p>Type what you want and ATTL will help you build it.</p>
    </section>`,
    snapshots: [],
  });

  // UI State
  const [input, setInput] = useState("");
  const [log, setLog] = useState([
    {
      from: "system",
      text:
        "CodingIQ builder ready. Describe the change (e.g. 'Build a clean landing page with hero and cards').",
    },
  ]);

  // Pending proposal from AI
  const [pending, setPending] = useState(null);

  // Proposal history (NEW)
  const [history, setHistory] = useState([]); // array of { html, info, command, time }

  // For previewing a proposal from history
  const [historyPreview, setHistoryPreview] = useState(null);

  const [loading, setLoading] = useState(false);

  // Save snapshot before ANY apply
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

  // Restore snapshot
  function restoreSnapshot(index) {
    const snap = project.snapshots[index];
    if (!snap) return;
    setProject((prev) => ({
      ...prev,
      html: snap.html,
    }));
    setLog((prev) => [...prev, { from: "system", text: `Restored: ${snap.label}` }]);
  }

  // Fork (MVP: log only)
  function forkProject() {
    const forkName = `${project.name} (Fork @ ${new Date().toLocaleTimeString()})`;
    setLog((prev) => [...prev, { from: "system", text: `Forked project: ${forkName}` }]);
  }

  // Accept pending proposal
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

  // Turn a historical proposal into the active pending one
  function restoreProposal(proposal) {
    setPending({
      html: proposal.html,
      info: `Restored proposal from ${proposal.time}`,
    });

    setHistoryPreview(null);

    setLog((prev) => [
      ...prev,
      {
        from: "system",
        text: `Restored proposal from history (${proposal.time}). Review + APPLY.`,
      },
    ]);
  }

  // MAIN SUBMIT HANDLER
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
        setLog((prev) => [...prev, { from: "system", text: `Error: ${err}` }]);
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!data || !data.html) {
        setLog((prev) => [
          ...prev,
          {
            from: "system",
            text: "AI returned no HTML. Try again or simplify your request.",
          },
        ]);
        setLoading(false);
        return;
      }

      const proposal = {
        html: data.html,
        info: data.info || "",
        command: text,
        time: new Date().toLocaleTimeString(),
      };

      // Store in history
      setHistory((prev) => [...prev, proposal]);

      // Make it the active pending proposal
      setPending({ html: data.html, info: data.info || "" });

      setLog((prev) => [
        ...prev,
        {
          from: "system",
          text:
            data.info ||
            "AI generated a new full-page proposal. Review and press APPLY.",
        },
      ]);
    } catch (err) {
      setLog((prev) => [
        ...prev,
        {
          from: "system",
          text: "API error. Check endpoint or API key.",
        },
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
          <p className="subtitle">AAiOS Coding Cockpit — Andrew × ATTL</p>
        </div>
        <div className="header-actions">
          <button onClick={forkProject}>Fork</button>
        </div>
      </header>

      <main className="layout">
        {/* LEFT: Commands / Log / Proposals */}
        <section className="panel left">
          <h2>Commands</h2>

          <div className="log">
            {log.map((m, i) => (
              <div key={i} className={`msg ${m.from}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="msg system">ATTL is thinking…</div>}
          </div>

          {pending && (
            <div className="pending">
              <div>Pending proposal — review then APPLY.</div>
              {pending.info && <div className="pending-info">{pending.info}</div>}
              <button onClick={applyPending}>APPLY</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="input-row">
            <input
              value={input}
              placeholder="Describe change or full site spec…"
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? "…" : "OK"}
            </button>
          </form>

          {/* NEW: Proposal History */}
          <div className="history">
            <h3>Proposal History</h3>
            {history.length === 0 && <p>No proposals yet.</p>}
            {history.map((h, i) => (
              <div key={i} className="hist-item">
                <div>
                  <b>{h.time}</b> — {h.command}
                </div>
                <div className="hist-actions">
                  <button onClick={() => setHistoryPreview(h)}>View</button>
                  <button onClick={() => restoreProposal(h)}>Restore</button>
                </div>
              </div>
            ))}
          </div>
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

      {/* Proposal Preview Modal */}
      {historyPreview && (
        <div className="modal">
          <div className="modal-content">
            <h3>Proposal from {historyPreview.time}</h3>
            <iframe
              title="proposal-preview"
              srcDoc={historyPreview.html}
              sandbox="allow-same-origin allow-scripts"
            />
            <div className="modal-actions">
              <button onClick={() => restoreProposal(historyPreview)}>
                Restore Proposal
              </button>
              <button onClick={() => setHistoryPreview(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshots */}
      <section className="snapshots">
        <h3>Snapshots</h3>
        {project.snapshots.length === 0 && (
          <p className="snap-empty">
            No snapshots yet. They appear each time you APPLY.
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
