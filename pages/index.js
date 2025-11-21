import { useState } from "react";

/*
  CodingIQ.ai — MVP v1
  Private cockpit for Andrew + ATTL

  Features:
  • Simple command input (natural language)
  • AI interpreter (basic rules for now)
  • Pending → Approve flow
  • Snapshots (undo/restore)
  • Fork logging (we can persist later)
  • Live preview via iframe
*/

const BASE_TEMPLATES = {
  landing: `
    <section class="block">
      <h1>CodingIQ.ai</h1>
      <p>Build and refine your site here. This is a starter landing layout.</p>
    </section>
  `,
  blank: `
    <section class="block">
      <h1>New Project</h1>
      <p>Start building...</p>
    </section>
  `,
  fx: `
    <section class="block">
      <h1>FX Site</h1>
      <p>[Converter placeholder]</p>
    </section>
  `
};

// Basic interpreter for now.
// Later we wire this to real LLM logic.
function interpretCommand(text) {
  const t = text.toLowerCase();

  if (t.includes("headline")) {
    return {
      type: "add",
      html: `
      <section class="block">
        <h2>Headline</h2>
        <p>Explain your core value clearly here.</p>
      </section>
      `
    };
  }

  if (t.includes("about")) {
    return {
      type: "add",
      html: `
      <section class="block">
        <h2>About</h2>
        <p>Describe who you are, your mission, and your difference.</p>
      </section>
      `
    };
  }

  if (t.includes("pricing")) {
    return {
      type: "add",
      html: `
      <section class="block">
        <h2>Pricing</h2>
        <ul>
          <li>Basic</li>
          <li>Pro</li>
          <li>Enterprise</li>
        </ul>
      </section>
      `
    };
  }

  if (t.includes("faq")) {
    return {
      type: "add",
      html: `
      <section class="block">
        <h2>FAQ</h2>
        <p>Q: What does this do?<br/>A: Helps you build sites fast.</p>
      </section>
      `
    };
  }

  if (t.includes("simple")) {
    return { type: "template", template: "landing" };
  }

  if (t.includes("fx")) {
    return { type: "template", template: "fx" };
  }

  if (t.includes("blank")) {
    return { type: "template", template: "blank" };
  }

  return null;
}

export default function Home() {
  // Single project for MVP
  const [project, setProject] = useState({
    name: "My Site",
    html: BASE_TEMPLATES.landing,
    snapshots: []
  });

  const [input, setInput] = useState("");
  const [log, setLog] = useState([
    { from: "system", text: "CodingIQ builder ready. Describe a change and press OK." }
  ]);
  const [pending, setPending] = useState(null);

  // Save a snapshot before changes
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
    const forkName = `${project.name} (forked at ${new Date().toLocaleTimeString()})`;
    setLog(prev => [
      ...prev,
      { from: "system", text: `Forked project: ${forkName}` }
    ]);
    // In a full version, we’d store forks; for MVP we log it so nothing gets lost.
  }

  function applyPending() {
    if (!pending) return;
    saveSnapshot("Before APPLY");

    if (pending.type === "add") {
      setProject(prev => ({
        ...prev,
        html: prev.html + pending.html
      }));
      setLog(prev => [
        ...prev,
        { from: "system", text: "Applied: added section." }
      ]);
    }

    if (pending.type === "template" && BASE_TEMPLATES[pending.template]) {
      setProject(prev => ({
        ...prev,
        html: BASE_TEMPLATES[pending.template]
      }));
      setLog(prev => [
        ...prev,
        { from: "system", text: `Applied: switched to ${pending.template} template.` }
      ]);
    }

    setPending(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input.trim();
    setLog(prev => [...prev, { from: "user", text }]);

    const cmd = interpretCommand(text);
    if (!cmd) {
      setLog(prev => [
        ...prev,
        { from: "system", text: "I don't have a rule for that yet (MVP). Try: headline / about / pricing / FAQ / simple / fx / blank." }
      ]);
      setInput("");
      return;
    }

    setPending(cmd);
    setLog(prev => [
      ...prev,
      { from: "system", text: "Proposed change — review and press APPLY if you approve." }
    ]);
    setInput("");
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>CodingIQ.ai</h1>
          <p className="subtitle">Private Builder — Andrew + ATTL</p>
        </div>
        <div className="header-actions">
          <button onClick={forkProject}>Fork</button>
        </div>
      </header>

      <main className="layout">
        {/* LEFT: Chat / Commands */}
        <section className="panel left">
          <h2>Commands</h2>
          <div className="log">
            {log.map((m, i) => (
              <div key={i} className={`msg ${m.from}`}>
                {m.text}
              </div>
            ))}
          </div>

          {pending && (
            <div className="pending">
              <div>Pending action — press APPLY to confirm.</div>
              <button onClick={applyPending}>APPLY</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="input-row">
            <input
              value={input}
              placeholder="Describe a change…"
              onChange={e => setInput(e.target.value)}
            />
            <button type="submit">OK</button>
          </form>
        </section>

        {/* RIGHT: Preview */}
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
          <p className="snap-empty">No snapshots yet. They’ll appear here after you APPLY.</p>
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
