# 🥗 context-diet

**Audit AI coding agent context burn & catch AI code bloat in 1 second — Zero dependencies CLI & GitHub Action.**

[![CI](https://github.com/qingzhou1204/context-diet/actions/workflows/ci.yml/badge.svg)](https://github.com/qingzhou1204/context-diet/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node >= 20](https://img.shields.io/badge/Node-%3E%3D20-34d399.svg)](package.json)

> Every time Claude Code, Cursor, or Codex reads `package-lock.json`, giant CSV/log dumps, or `dist/` bundles, you burn metered credits on noise—and when it writes a PR, it often adds redundant narration comments and fragmented micro-files.
> **`context-diet`** pinpoints your token black holes in 1 second, generates `.cursorignore` + `.claudeignore`, and gates bloated AI PRs in CI.

---

## ⚡ Real-World Example Output

```text
🥗 context-diet · Context Burn Report (/workspace/demo-project)
   Files scanned: 320 | Total est. tokens: 11,250,849
   Black-hole waste: 10,987,701 tokens (97.7% potential savings)
   Lean target after ignore: 263,148 tokens

Top Context Offenders:
  🔥 ██████████████ 2,215,957 tok (19.7%)  dist/release_bundle.zip          [Archives / Media]
  🔥 ██████░░░░░░░░   942,067 tok ( 8.4%)  assets/raw_sample_photo.png      [Archives / Media]
  🔥 ████░░░░░░░░░░   184,210 tok ( 1.6%)  package-lock.json                [Lockfiles]
```

---

## 🚀 Quick Start (Zero Dependencies, Node >= 20)

```bash
# 1. Scan any repo for context black holes & print token savings
npx github:qingzhou1204/context-diet scan .

# 2. Auto-generate .cursorignore & .claudeignore + standalone HTML report
node bin/context-diet.mjs scan . --write-ignore --html context-diet-report.html

# 3. Audit your current git diff for AI code bloat (0-100 Health Score)
node bin/context-diet.mjs diff HEAD --fail-under 65
```

---

## 🤖 Drop-In GitHub Action (PR Bloat Gate)

Add `.github/workflows/context-diet.yml` to catch AI slop before merging:

```yaml
name: AI Bloat Guard
on: [pull_request]
jobs:
  context-diet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - uses: qingzhou1204/context-diet@v1
        with:
          mode: diff
          fail-under: "65"
```

---

## 🔍 What It Checks

| Command | Checks & Outputs |
| :--- | :--- |
| **`context-diet scan`** | Lockfiles, minified bundles, `dist/`/`build/`, large CSV/logs, media/archives, oversized source files (`>= 8k tokens`), exact `%` savings, `.cursorignore` & `.claudeignore` generator, `--html` dashboard |
| **`context-diet diff`** | Oversized single-file diffs, generic AI narration comment density (`// Helper function to...`), duplicated code lines, over-fragmented micro-files, `0–100` Health Score + `--fail-under` CI exit code |

---

## 中文简介
面向 **Claude Code / Cursor / Codex** 开发者的零依赖上下文瘦身与 AI 代码膨胀审计工具：
1. `scan`：1 秒扫描仓库里的 Token 黑洞（lockfile、构建产物、大日志/CSV、大二进制资源），算出可节省的 Token 百分比并一键生成 `.cursorignore` / `.claudeignore`；
2. `diff`：检测 `git diff` 里的 AI 废话注释密度、重复代码行、过度碎片化小文件，输出 0-100 健康分并可作为 GitHub Action PR 门禁。

---

## 🔗 More Local-First Tools
Looking for zero-upload browser utilities (E-Invoice XML/OFD Merger, A4 PDF Quotes, E-Commerce Image Kit)? Check out **[QingZhou LocalTools](https://qingzhou1204.github.io/)**.
