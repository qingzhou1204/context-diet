import { execFileSync } from "node:child_process";

const FLUFF_COMMENT_RE = /^\s*(?:\/\/|#|\*)\s*(?:helper function|this function|initialize|import required|return the|set the|loop through|handle the)\b/i;

export function analyzeDiffText(diffText) {
  const lines = String(diffText || "").split(/\r?\n/);
  const files = [];
  let cur = null;

  for (const ln of lines) {
    if (ln.startsWith("diff --git ")) {
      if (cur) files.push(cur);
      const m = ln.match(/ b\/(.+)$/);
      cur = { file: m ? m[1] : "unknown", added: [], removed: 0, isNew: false };
      continue;
    }
    if (!cur) continue;
    if (ln.startsWith("new file mode")) cur.isNew = true;
    else if (ln.startsWith("+") && !ln.startsWith("+++")) cur.added.push(ln.slice(1));
    else if (ln.startsWith("-") && !ln.startsWith("---")) cur.removed += 1;
  }
  if (cur) files.push(cur);

  let totalAdded = 0;
  let fluffComments = 0;
  let newMicroFiles = 0;
  const lineFreq = new Map();
  const warnings = [];

  for (const f of files) {
    totalAdded += f.added.length;
    if (f.isNew && f.added.length > 0 && f.added.length <= 35) {
      newMicroFiles += 1;
    }
    if (f.added.length >= 250) {
      warnings.push(`Oversized file diff: ${f.file} (+${f.added.length} lines)`);
    }
    for (const al of f.added) {
      if (FLUFF_COMMENT_RE.test(al)) fluffComments += 1;
      const norm = al.trim();
      if (norm.length >= 24 && !norm.startsWith("import ") && !norm.startsWith("from ")) {
        lineFreq.set(norm, (lineFreq.get(norm) || 0) + 1);
      }
    }
  }

  let duplicateLines = 0;
  for (const cnt of lineFreq.values()) {
    if (cnt >= 2) duplicateLines += cnt - 1;
  }

  if (fluffComments >= 3) warnings.push(`High AI narration comment density (${fluffComments} generic comments)`);
  if (duplicateLines >= 4) warnings.push(`Repeated code lines detected (${duplicateLines} duplicated non-trivial lines)`);
  if (newMicroFiles >= 3) warnings.push(`Over-fragmentation: ${newMicroFiles} tiny new files added`);

  let penalty = 0;
  penalty += Math.min(35, fluffComments * 4);
  penalty += Math.min(30, duplicateLines * 3);
  penalty += Math.min(20, newMicroFiles * 6);
  penalty += Math.min(25, Math.max(0, Math.floor((totalAdded - 300) / 80) * 5));

  const healthScore = Math.max(0, 100 - penalty);
  return {
    filesChanged: files.length,
    totalAdded,
    fluffComments,
    duplicateLines,
    newMicroFiles,
    healthScore,
    warnings,
    files: files.map(f => ({ file: f.file, added: f.added.length, removed: f.removed, isNew: f.isNew })),
  };
}

export function auditGitDiff(repoDir, baseRef = "HEAD") {
  let diffText = "";
  try {
    diffText = execFileSync("git", ["-C", repoDir, "diff", baseRef], { encoding: "utf-8", maxBuffer: 8 * 1024 * 1024 });
  } catch {
    diffText = execFileSync("git", ["-C", repoDir, "diff"], { encoding: "utf-8", maxBuffer: 8 * 1024 * 1024 });
  }
  return analyzeDiffText(diffText);
}
