#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { scanRepository } from "../src/scanner.mjs";
import { auditGitDiff } from "../src/diff_auditor.mjs";
import { buildHtmlDashboard, formatDiffTerminal, formatScanTerminal } from "../src/reporter.mjs";

const args = process.argv.slice(2);
const cmd = args[0] || "scan";

function getFlagValue(flag, fallback) {
  const idx = args.indexOf(flag);
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return fallback;
}

if (cmd === "--help" || cmd === "-h") {
  console.log(`context-diet <scan|diff> [target] [options]
  scan [dir]       Audit repo for AI context black holes & token waste
    --write-ignore Write .cursorignore and .claudeignore
    --json         Output JSON
    --html <file>  Write standalone HTML report
  diff [base]      Audit git diff for AI code bloat & fluff comments
    --fail-under <score>  Exit 1 if healthScore < score (CI gate)
    --json                Output JSON`);
  process.exit(0);
}

if (cmd === "scan") {
  const positional = args.slice(1).find(a => !a.startsWith("-")) || ".";
  const res = scanRepository(positional);
  if (args.includes("--write-ignore")) {
    fs.writeFileSync(path.join(res.root, ".cursorignore"), res.ignoreContent, "utf-8");
    fs.writeFileSync(path.join(res.root, ".claudeignore"), res.ignoreContent, "utf-8");
  }
  const htmlOut = getFlagValue("--html", "");
  if (htmlOut) {
    fs.writeFileSync(path.resolve(htmlOut), buildHtmlDashboard(res), "utf-8");
  }
  if (args.includes("--json")) console.log(JSON.stringify(res, null, 2));
  else console.log(formatScanTerminal(res));
  process.exit(0);
}

if (cmd === "diff") {
  const base = args.slice(1).find(a => !a.startsWith("-")) || "HEAD";
  const res = auditGitDiff(process.cwd(), base);
  if (args.includes("--json")) console.log(JSON.stringify(res, null, 2));
  else console.log(formatDiffTerminal(res));
  const failUnder = Number(getFlagValue("--fail-under", "-1"));
  if (failUnder >= 0 && res.healthScore < failUnder) {
    process.exit(1);
  }
  process.exit(0);
}

console.error(`Unknown command: ${cmd}. Use --help.`);
process.exit(1);
