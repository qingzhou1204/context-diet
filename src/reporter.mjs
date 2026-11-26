function fmtNum(n) {
  return Number(n || 0).toLocaleString("en-US");
}

function bar(ratio, width = 20) {
  const filled = Math.max(0, Math.min(width, Math.round(ratio * width)));
  return "█".repeat(filled) + "░".repeat(width - filled);
}

export function formatScanTerminal(res) {
  const lines = [
    "",
    `🥗 context-diet · Context Burn Report (${res.root})`,
    `   Files scanned: ${fmtNum(res.fileCount)} | Total est. tokens: ${fmtNum(res.totalTokens)}`,
    `   Black-hole waste: ${fmtNum(res.blackholeTokens)} tokens (${res.savingsPct}% potential savings)`,
    `   Lean target after ignore: ${fmtNum(res.leanTokens)} tokens`,
    "",
    "Top Context Offenders:",
  ];
  const maxTok = res.topOffenders[0]?.tokens || 1;
  for (const item of res.topOffenders.slice(0, 12)) {
    const pct = res.totalTokens ? ((item.tokens / res.totalTokens) * 100).toFixed(1) : "0.0";
    const flag = item.isBlackhole ? "🔥" : "  ";
    lines.push(
      `  ${flag} ${bar(item.tokens / maxTok, 14)} ${String(fmtNum(item.tokens)).padStart(9)} tok (${pct.padStart(4)}%)  ${item.path}  [${item.category}]`
    );
  }
  lines.push("");
  lines.push("Tip: Run `context-diet scan --write-ignore` to generate .cursorignore & .claudeignore");
  return lines.join("\n");
}

export function formatDiffTerminal(res) {
  const badge = res.healthScore >= 80 ? "✅ CLEAN" : (res.healthScore >= 60 ? "⚠️ BLOATED" : "🚨 AI SLOP");
  const lines = [
    "",
    `🧪 context-diet diff · Health Score: ${res.healthScore}/100 [${badge}]`,
    `   Files: ${res.filesChanged} | Added lines: +${res.totalAdded} | Fluff comments: ${res.fluffComments} | Duplicate lines: ${res.duplicateLines}`,
  ];
  if (res.warnings.length) {
    lines.push("   Warnings:");
    for (const w of res.warnings) lines.push(`     - ${w}`);
  } else {
    lines.push("   No AI bloat warnings detected.");
  }
  return lines.join("\n");
}

export function buildHtmlDashboard(scanRes) {
  const esc = s => String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rows = scanRes.topOffenders
    .map(f => `<tr><td>${esc(f.path)}</td><td>${esc(f.category)}</td><td>${fmtNum(f.tokens)}</td><td>${f.isBlackhole ? "🔥 Trim" : "OK"}</td></tr>`)
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>context-diet Report</title>
<style>body{font-family:system-ui,sans-serif;background:#0b1020;color:#e8eefc;padding:28px;max-width:980px;margin:0 auto}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}
.card{background:#141c33;border:1px solid #26355a;border-radius:10px;padding:14px}
table{width:100%;border-collapse:collapse;background:#11182c}th,td{padding:8px 10px;border-bottom:1px solid #26355a;text-align:left;font-size:13px}
</style></head><body>
<h1>🥗 context-diet · AI Context Audit</h1>
<div class="cards">
  <div class="card"><b>${fmtNum(scanRes.totalTokens)}</b><br><small>Total Est. Tokens</small></div>
  <div class="card"><b>${fmtNum(scanRes.blackholeTokens)}</b><br><small>Black-Hole Waste (${scanRes.savingsPct}%)</small></div>
  <div class="card"><b>${fmtNum(scanRes.leanTokens)}</b><br><small>Lean Target Tokens</small></div>
</div>
<table><thead><tr><th>Path</th><th>Category</th><th>Tokens</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
}
