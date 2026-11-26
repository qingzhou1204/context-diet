import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { scanRepository, estimateTokens } from "../src/scanner.mjs";
import { analyzeDiffText } from "../src/diff_auditor.mjs";
import { buildHtmlDashboard } from "../src/reporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

test("estimateTokens handles ASCII and CJK", () => {
  assert.ok(estimateTokens("hello world") >= 2);
  assert.ok(estimateTokens("数电发票查重") > estimateTokens("abc"));
});

test("scanRepository detects context blackholes and computes savings", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cdiet-"));
  try {
    fs.writeFileSync(path.join(tmp, "app.js"), "export const x = 1;\n", "utf-8");
    fs.writeFileSync(path.join(tmp, "package-lock.json"), "{}\n".repeat(3000), "utf-8");
    fs.mkdirSync(path.join(tmp, "dist"));
    fs.writeFileSync(path.join(tmp, "dist", "bundle.min.js"), "var a=1;".repeat(1200), "utf-8");

    const res = scanRepository(tmp);
    assert.equal(res.fileCount, 3);
    assert.ok(res.blackholeTokens > res.leanTokens);
    assert.ok(res.savingsPct > 80);
    assert.match(res.ignoreContent, /package-lock\.json/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("analyzeDiffText flags AI fluff comments, duplicates, and micro-files", () => {
  const fakeDiff = [
    "diff --git a/a.js b/a.js",
    "new file mode 100644",
    "+// Helper function to validate user input",
    "+// This function initializes the state",
    "+// Return the final normalized result",
    "+const longRepeatedLineForAuditCheck = computeValue(inputData, configOptions);",
    "diff --git a/b.js b/b.js",
    "new file mode 100644",
    "+const longRepeatedLineForAuditCheck = computeValue(inputData, configOptions);",
    "diff --git a/c.js b/c.js",
    "new file mode 100644",
    "+export const c = 3;",
  ].join("\n");

  const res = analyzeDiffText(fakeDiff);
  assert.equal(res.fluffComments, 3);
  assert.equal(res.duplicateLines, 1);
  assert.equal(res.newMicroFiles, 3);
  assert.ok(res.healthScore < 75);
  assert.ok(res.warnings.length >= 2);
});

test("CLI --write-ignore and --html output work cleanly", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cdiet-cli-"));
  const htmlOut = path.join(tmp, "report.html");
  try {
    fs.writeFileSync(path.join(tmp, "main.py"), "print('hi')\n", "utf-8");
    fs.writeFileSync(path.join(tmp, "huge.log"), "ERROR line\n".repeat(400), "utf-8");
    execFileSync("node", [path.join(repoRoot, "bin", "context-diet.mjs"), "scan", tmp, "--write-ignore", "--html", htmlOut], {
      encoding: "utf-8",
    });
    assert.ok(fs.existsSync(path.join(tmp, ".cursorignore")));
    assert.ok(fs.existsSync(path.join(tmp, ".claudeignore")));
    assert.ok(fs.existsSync(htmlOut));
    assert.match(fs.readFileSync(htmlOut, "utf-8"), /context-diet/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("buildHtmlDashboard renders valid HTML", () => {
  const html = buildHtmlDashboard({
    totalTokens: 1000,
    blackholeTokens: 600,
    leanTokens: 400,
    savingsPct: 60,
    topOffenders: [{ path: "yarn.lock", category: "Lockfiles", tokens: 600, isBlackhole: true }],
  });
  assert.match(html, /60%/);
  assert.match(html, /yarn\.lock/);
});
