import { useState } from "react";

/* ============================================
   CODINGIQ-AI  •  MVP v1.0
   ultra-slim AI website builder for Andrew + ATTL
   Includes: Fork Engine • Undo Snapshots • Live Preview
   ============================================ */

const BASE_TEMPLATES = {
  blank: `
    <section class="block">
      <h1>New Project</h1>
      <p>Start building...</p>
    </section>
  `,
  landing: `
    <section class="block">
      <h1>Landing Page</h1>
      <p>Your value proposition here.</p>
    </section>
  `,
  fx: `
    <section class="block">
      <h1>FX Site</h1>
      <p>[Converter]</p>
    </section>
  `
};

// ---------- BUILD COMMANDS ----------
function interpret(text) {
  const t = text.toLowerCase();

  if (t.includes("headline")) {
    return {
      type: "add",
      html: `
      <section class="block">
        <h2>Headline</h2>
        <p>Write your message...</p>
      </section>`
    };
  }

  if (t.includes("about")) {
    return {
      type: "add",
      html: `
      <section class="block">
        <h2>About</h2>
        <p>About your project...</p>
      </section>`
    };
  }

  if (t.includes("pricing")) {
    return {
      type: "add",
      html: `
      <section class="block">
        <h2>Pricing</h2>
        <p>Basic • Pro • Enterprise</p>
      </section>`
    };
  }

  if (t.includes("simple")) {
    return { type: "template", template: "landing" };
  }

  if (t.includes("fx")) {
    return { type: "template", template: "fx" };
  }

  return null;
}

export default function Home() {

  // ---------------- PROJECT STATE ----------------
  const [project, setProject] = useState({
    name: "My Site",
    html: BASE_TEMPLATES.landing,
    snapshots: []
  });

  const [msg, setMsg] = useState("");
  const [log, setLog] = useState([]);
  const [pending, setPending] = useState(null);

  // ---------------- SNAPSHOT (UNDO) ----------------
  function saveSnapshot(label = "Before change") {
    setProject(prev => ({
      ...prev,
      snapshots: [
        ...prev.snapshots,
        { html: prev.html, label, time: new Date().toLocaleTimeString() }
      ]
    }));
  }

  function restoreSnapshot(i) {
    const snap = project.snapshots[i];
    if (!snap) return;
    setProject(prev => ({ ...prev, html: snap.html }));
    setLog(l => [...l, { from: "system", text: `Restored: ${snap.label}` }]);
  }

  // ---------------- FORK ENGINE ----------------
  function forkProject() {
    const stamp = Date.now();
    const forkedName = project.name + " (Fork)";
    const forkedHTML = project.html;

    setLog(l => [...l, { from: "system", text: `Forked project → ${forkedName}` }]);

    // (In full version, store this to separate slot; for MVP we only log.)
  }

  // ---------------- APPLY COMMAND ----------------
  function applyCommand(cmd) {
    if (!cmd) return;

    saveSnapshot("Before apply");

    if (cmd.type === "add") {
      setProject(prev => ({ ...prev, html: prev.html + cmd.html }));
      setLog(l => [...l, { from: "system", text: "Added section." }]);
    }

    if (cmd.type === "template") {
      setProject(prev => ({ ...prev, html: BASE_TEMPLATES[cmd.template] }));
      setLog(l => [...l, { from: "system", text: `Switched template → ${cmd.template}` }]);
    }

    setPending(null);
  }

  // ---------------- CHAT INPUT SUBMIT ----------------
  function submit(e) {
    e.preventDefault();
    if (!msg.trim()) return;

    setLog(l => [...l, { from: "user", text: msg }]);

    const cmd = interpret(msg);
    if (!cmd) {
      setLog(l => [...l, { from: "system", text: "Unknown instruction." }]);
      setMsg("");
      return;
    }

    setPending(cmd);
    setLog(l => [...l, { from: "system", text: "Pending action — tap APPLY." }]);
    setMsg("");
  }

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <h1>CodingIQ-AI</h1>
        <button onClick={forkProject}>Fork</button>
      </header>

      <main className="layout">

        {/* LEFT — CHAT */}
        <section className="left">
          <h2>Commands</h2>

          <div className="log">
            {log.map((m, i) => (
              <div key={i} className={`m ${m.from}`}>
                {m.text}
              </div>
            ))}
          </div>

          {pending && (
            <div className="pending">
              <div>Pending — approve?</div>
              <button onClick={() => applyCommand(pending)}>APPLY</button>
            </div>
          )}

          <form onSubmit={submit} className="input-row">
            <input
              value={msg}
              placeholder="Describe a change…"
              onChange={e => setMsg(e.target.value)}
            />
            <button type="submit">OK</button>
          </form>
        </section>

        {/* RIGHT — PREVIEW */}
        <section className="right">
          <h2>Preview</h2>
          <iframe
            title="preview"
            srcDoc={project.html}
            sandbox="allow-same-origin allow-scripts"
          />
        </section>
      </main>

      {/* SNAPSHOT LIST */}
      <div className="snapshots">
        <h3>Snapshots</h3>
        {project.snapshots.map((s, i) => (
          <div key={i} className="snap">
            <div>{s.label}</div>
            <div>{s.time}</div>
            <button onClick={() => restoreSnapshot(i)}>Restore</button>
          </div>
        ))}
      </div>
    </div>
  );
}
