// Simple CodingIQ Cockpit v1 (AiQ+C, SBBBFF)

let currentHtml = getDefaultTemplate();
let proposedHtml = "";
const history = [];

// DOM elements
let editorEl;
let previewFrameEl;
let commandInputEl;
let statusTextEl;
let proposalAreaEl;
let proposalTextEl;
let applyProposalBtnEl;
let discardProposalBtnEl;
let closeProposalBtnEl;
let historyListEl;
let runPreviewBtnEl;
let undoBtnEl;
let askAIBtnEl;

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  bindEvents();
  initialiseState();
});

// Cache DOM references once for speed
function cacheDom() {
  editorEl = document.getElementById("editor");
  previewFrameEl = document.getElementById("previewFrame");
  commandInputEl = document.getElementById("commandInput");
  statusTextEl = document.getElementById("statusText");
  proposalAreaEl = document.getElementById("proposalArea");
  proposalTextEl = document.getElementById("proposalText");
  applyProposalBtnEl = document.getElementById("applyProposalBtn");
  discardProposalBtnEl = document.getElementById("discardProposalBtn");
  closeProposalBtnEl = document.getElementById("closeProposalBtn");
  historyListEl = document.getElementById("historyList");
  runPreviewBtnEl = document.getElementById("runPreviewBtn");
  undoBtnEl = document.getElementById("undoBtn");
  askAIBtnEl = document.getElementById("askAIBtn");
}

// Attach event listeners
function bindEvents() {
  runPreviewBtnEl.addEventListener("click", () => {
    currentHtml = editorEl.value;
    renderPreview();
    setStatus("Preview refreshed.");
  });

  undoBtnEl.addEventListener("click", handleUndo);
  askAIBtnEl.addEventListener("click", handleAskAI);

  applyProposalBtnEl.addEventListener("click", handleApplyProposal);
  discardProposalBtnEl.addEventListener("click", hideProposal);
  closeProposalBtnEl.addEventListener("click", hideProposal);
}

// Initialise editor and preview
function initialiseState() {
  editorEl.value = currentHtml;
  renderPreview();
  renderHistory();
  setStatus("Ready.");
}

// Default starter HTML template
function getDefaultTemplate() {
  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    "  <title>CodingIQ Sandbox Page</title>",
    "  <style>",
    "    body {",
    "      margin: 0;",
    "      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;",
    "      background: #05060a;",
    "      color: #f5f7ff;",
    "      display: flex;",
    "      align-items: center;",
    "      justify-content: center;",
    "      min-height: 100vh;",
    "    }",
    "    .wrap {",
    "      max-width: 640px;",
    "      padding: 1.5rem;",
    "      border-radius: 0.8rem;",
    "      background: radial-gradient(circle at top, #1c2340, #0b0f1b);",
    "      border: 1px solid rgba(148, 163, 184, 0.3);",
    "      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.7);",
    "    }",
    "    h1 {",
    "      font-size: 1.5rem;",
    "      margin: 0 0 0.6rem;",
    "    }",
    "    p {",
    "      margin: 0.1rem 0;",
    "      color: #cbd5f5;",
    "      font-size: 0.9rem;",
    "    }",
    "    .tag {",
    "      display: inline-flex;",
    "      padding: 0.15rem 0.55rem;",
    "      border-radius: 999px;",
    "      border: 1px solid rgba(148, 163, 184, 0.4);",
    "      font-size: 0.7rem;",
    "      text-transform: uppercase;",
    "      letter-spacing: 0.08em;",
    "      color: #93c5fd;",
    "      margin-bottom: 0.6rem;",
    "    }",
    "  </style>",
    "</head>",
    "<body>",
    '  <div class="wrap">',
    '    <div class="tag">CodingIQ • Sandbox</div>',
    "    <h1>Start building with AI</h1>",
    "    <p>This is your current HTML file. Use the cockpit to reshape this page using natural language commands.</p>",
    "    <p>Example: Ask the AI to turn this into an FX landing page, a pricing page, or any layout you want.</p>",
    "  </div>",
    "</body>",
    "</html>"
  ].join("\n");
}

// Preview renderer
function renderPreview() {
  if (!previewFrameEl) return;
  const doc = previewFrameEl.contentWindow.document;
  doc.open();
  doc.write(currentHtml || "<!DOCTYPE html><html><body><p>No HTML yet.</p></body></html>");
  doc.close();
}

// Set status text
function setStatus(message) {
  if (!statusTextEl) return;
  statusTextEl.textContent = message;
}

// History

function renderHistory() {
  if (!historyListEl) return;
  historyListEl.innerHTML = "";

  if (history.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No snapshots yet.";
    li.style.fontSize = "0.75rem";
    li.style.color = "#9ca3af";
    historyListEl.appendChild(li);
    return;
  }

  history.forEach((html, index) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "history-item-btn";
    btn.textContent = "v" + (index + 1);
    btn.addEventListener("click", () => {
      handleRestoreSnapshot(index);
    });
    li.appendChild(btn);
    historyListEl.appendChild(li);
  });
}

function handleUndo() {
  if (history.length === 0) {
    setStatus("No snapshots to undo.");
    return;
  }
  const previous = history.pop();
  currentHtml = previous;
  editorEl.value = currentHtml;
  renderPreview();
  renderHistory();
  setStatus("Reverted to previous snapshot.");
}

// Restore a specific snapshot
function handleRestoreSnapshot(index) {
  const snapshot = history[index];
  if (!snapshot) return;

  const currentCopy = currentHtml;
  if (currentCopy && currentCopy !== snapshot) {
    history.push(currentCopy);
  }

  currentHtml = snapshot;
  editorEl.value = currentHtml;
  renderPreview();
  renderHistory();
  setStatus("Loaded snapshot v" + (index + 1) + ".");
}

// Ask AI

async function handleAskAI() {
  const command = (commandInputEl.value || "").trim();
  currentHtml = editorEl.value;

  if (!command) {
    setStatus("Please enter a command for the AI.");
    commandInputEl.focus();
    return;
  }

  askAIBtnEl.disabled = true;
  setStatus("Asking AI…");

  try {
    const newHtml = await askAI(command, currentHtml);
    if (!newHtml || typeof newHtml !== "string") {
      throw new Error("Empty AI response");
    }
    proposedHtml = newHtml;
    proposalTextEl.value = proposedHtml;
    showProposal();
    setStatus("AI proposal ready.");
  } catch (err) {
    console.error(err);
    setStatus("AI request failed.");
    alert("AI request failed: " + (err.message || "Unknown error"));
  } finally {
    askAIBtnEl.disabled = false;
  }
}

// Call backend API route
async function askAI(command, html) {
  const response = await fetch("/api/codingiq", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      command,
      currentHtml: html
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error("Backend error " + response.status + ": " + text);
  }

  const data = await response.json();
  return data.newHtml;
}

// Proposal panel

function showProposal() {
  if (!proposalAreaEl) return;
  proposalAreaEl.classList.remove("hidden");
}

function hideProposal() {
  if (!proposalAreaEl) return;
  proposalAreaEl.classList.add("hidden");
}

function handleApplyProposal() {
  if (!proposedHtml) {
    setStatus("No proposal to apply.");
    return;
  }

  if (currentHtml) {
    history.push(currentHtml);
  }

  currentHtml = proposedHtml;
  proposedHtml = "";
  editorEl.value = currentHtml;

  renderPreview();
  renderHistory();
  hideProposal();
  setStatus("Proposal applied. Snapshot saved.");
}
