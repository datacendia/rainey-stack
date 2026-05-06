# rainey-laguna-stack

Cross-repo coordination for the Rainey Laguna stack.

This repo contains **no product code** — only the docs that describe how the
four product repos fit together at runtime, the brand decisions that span
them, and the open work items that don't belong in any single repo.

## Companion repos

| Repo                    | Role                                       | Domain (target)                |
| ----------------------- | ------------------------------------------ | ------------------------------ |
| `raineylagunastudios`   | Parent brand site (static)                 | `raineylagunastudios.com`      |
| `raineylaguna-next`     | Web-development vertical (Next.js)         | `raineylaguna.com`             |
| `raineylaguna-crm`      | Lead CRM (Next.js + Postgres + BullMQ)     | `crm.raineylaguna.com`         |
| `vigiaV2`               | Sereno SaaS *(rename pending)*             | `serenowatch.com`              |

All four live under `github.com/datacendia/`. They are cloned alongside this
repo on the operator's workstation but **not** as git submodules — keep this
meta repo decoupled from their commit graphs.

## Files

| File              | What                                                    |
| ----------------- | ------------------------------------------------------- |
| `DEPLOY.md`       | End-to-end deploy guide (Railway + Cloudflare DNS)      |
| `BRAND.md`        | Domain decisions, naming history, registrar status      |
| `RENAME-PLAN.md`  | Step-by-step plan to rename Vigía → Sereno across repos |

## Working directory layout (operator's machine)

```
_external/rainey-stack/             ← this meta repo
├── README.md
├── DEPLOY.md
├── BRAND.md
├── RENAME-PLAN.md
├── raineylagunastudios/            ← independent repo (gitignored here)
├── raineylaguna-next/              ← independent repo (gitignored here)
├── raineylaguna-crm/               ← independent repo (gitignored here)
└── vigiaV2/                        ← independent repo (gitignored here)
```
