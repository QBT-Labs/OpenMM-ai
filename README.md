# OpenMM AI Skills

> Open-source market making skills for AI agents

[![npm](https://img.shields.io/npm/v/@3rd-eye-labs/openmm)](https://www.npmjs.com/package/@3rd-eye-labs/openmm)
[![downloads](https://img.shields.io/npm/dm/@3rd-eye-labs/openmm)](https://www.npmjs.com/package/@3rd-eye-labs/openmm)
[![openmm-skills](https://img.shields.io/npm/v/@qbtlabs/openmm-skills?label=openmm-skills)](https://www.npmjs.com/package/@qbtlabs/openmm-skills)
[![downloads](https://img.shields.io/npm/dm/@qbtlabs/openmm-skills)](https://www.npmjs.com/package/@qbtlabs/openmm-skills)
[![openmm-trading](https://img.shields.io/npm/v/@qbtlabs/openmm-trading?label=openmm-trading)](https://www.npmjs.com/package/@qbtlabs/openmm-trading)
[![downloads](https://img.shields.io/npm/dm/@qbtlabs/openmm-trading)](https://www.npmjs.com/package/@qbtlabs/openmm-trading)
[![openmm-market-data](https://img.shields.io/npm/v/@qbtlabs/openmm-market-data?label=openmm-market-data)](https://www.npmjs.com/package/@qbtlabs/openmm-market-data)
[![downloads](https://img.shields.io/npm/dm/@qbtlabs/openmm-market-data)](https://www.npmjs.com/package/@qbtlabs/openmm-market-data)
[![openclaw-openmm](https://img.shields.io/npm/v/@qbtlabs/openclaw-openmm?label=openclaw-openmm)](https://www.npmjs.com/package/@qbtlabs/openclaw-openmm)
[![downloads](https://img.shields.io/npm/dm/@qbtlabs/openclaw-openmm)](https://www.npmjs.com/package/@qbtlabs/openclaw-openmm)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![DeepWiki](https://img.shields.io/badge/docs-DeepWiki-purple)](https://deepwiki.com/3rd-Eye-Labs/OpenMM)

[Agent Skills](https://agentskills.io/home) for [OpenMM](https://github.com/3rd-Eye-Labs/OpenMM) — multi-exchange trading, grid strategies, portfolio management, and real-time market data for AI agents.

Built on the open [Agent Skills](https://agentskills.io/home) standard — a portable skill format recognized by OpenAI Codex, Gemini CLI, GitHub Copilot, Cursor, VS Code, OpenClaw, and 20+ other platforms.

---

## Install Skills

### Quick Install (all skills)

```bash
npx @qbtlabs/openmm-skills --all
```

### Interactive Install

```bash
npx @qbtlabs/openmm-skills
```

```
 ██████╗ ██████╗ ███████╗███╗   ██╗███╗   ███╗███╗   ███╗
██╔═══██╗██╔══██╗██╔════╝████╗  ██║████╗ ████║████╗ ████║
██║   ██║██████╔╝█████╗  ██╔██╗ ██║██╔████╔██║██╔████╔██║
██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║╚██╔╝██║██║╚██╔╝██║
╚██████╔╝██║     ███████╗██║ ╚████║██║ ╚═╝ ██║██║ ╚═╝ ██║
 ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝     ╚═╝

  QBT Labs  — Open-source market making for AI agents

  Found 5 skills

  Select skills to install (space to toggle)
    □ openmm-exchange-setup
    □ openmm-grid-trading
    □ openmm-order-management
    □ openmm-cardano-dex
    □ openmm-portfolio
```

### Browse Available Skills

```bash
npx @qbtlabs/openmm-skills --list
```

### Install a Specific Skill

```bash
npx @qbtlabs/openmm-skills --skill openmm-grid-trading
```

### Install to a Specific Agent

```bash
npx @qbtlabs/openmm-skills --agent claude-code
npx @qbtlabs/openmm-skills --agent cursor
```

### Install Globally (user-level)

```bash
npx @qbtlabs/openmm-skills --global
```

### Alternative: Standard Skills CLI

```bash
npx skills add QBT-Labs/OpenMM-ai
```

### Alternative: ClawHub

```bash
clawhub install openmm-exchange-setup
clawhub install openmm-grid-trading
clawhub install openmm-portfolio
```

---

## Skills

| Skill | Description |
|-------|-------------|
| **openmm-portfolio** | Balance tracking, order overview, and market data across exchanges |
| **openmm-exchange-setup** | Step-by-step guide to configure exchange API credentials |
| **openmm-grid-trading** | Automated grid trading strategies with dry-run support |
| **openmm-order-management** | Place, list, and cancel limit/market orders |
| **openmm-cardano-dex** | Cardano DEX pool discovery and aggregated pricing via Iris Protocol |

---

## Plugins

Self-contained plugin packages for structured agent integration:

| Plugin | Description | npm |
|--------|-------------|-----|
| **[openmm-trading](packages/plugins/openmm-trading)** | Exchange setup, order management, and grid trading strategies | [`@qbtlabs/openmm-trading`](https://www.npmjs.com/package/@qbtlabs/openmm-trading) |
| **[openmm-market-data](packages/plugins/openmm-market-data)** | Market data, portfolio tracking, and Cardano DEX integration | [`@qbtlabs/openmm-market-data`](https://www.npmjs.com/package/@qbtlabs/openmm-market-data) |
| **[openclaw-openmm](packages/plugins/openclaw-openmm)** | OpenClaw plugin — trade and monitor from Telegram or any channel | [`@qbtlabs/openclaw-openmm`](https://www.npmjs.com/package/@qbtlabs/openclaw-openmm) |

### Install the OpenClaw Plugin

```bash
openclaw plugins install @qbtlabs/openclaw-openmm
```

---

## Prerequisites

```bash
npm install -g @3rd-eye-labs/openmm
```

Verify the installation:

```bash
which openmm
```

---

## Supported Exchanges

| Exchange | Min Order | Credentials |
|----------|-----------|-------------|
| MEXC | 1 USDT | `MEXC_API_KEY`, `MEXC_SECRET` |
| Gate.io | 1 USDT | `GATEIO_API_KEY`, `GATEIO_SECRET` |
| Bitget | 1 USDT | `BITGET_API_KEY`, `BITGET_SECRET`, `BITGET_PASSPHRASE` |
| Kraken | 5 EUR/USD | `KRAKEN_API_KEY`, `KRAKEN_SECRET` |

---

## Components

```
OpenMM Ecosystem
├── OpenMM (Core)           → github.com/3rd-Eye-Labs/OpenMM
├── OpenMM-MCP (Tools)      → github.com/QBT-Labs/OpenMM-MCP
└── OpenMM-AI (Skills)      → this repo
    ├── .claude-plugin/     → plugin discovery manifest
    └── packages/
        ├── openmm-skills/  → npx installer with OpenMM banner
        └── plugins/
            ├── openmm-trading/       → trading skills + references
            ├── openmm-market-data/   → market data skills + references
            └── openclaw-openmm/      → OpenClaw plugin (Telegram, Discord)
```

**x402 (coming soon)** — Payment layer for AI agent transactions is a work in progress.

---

## What are Agent Skills?

[Agent Skills](https://agentskills.io/home) is an open standard for portable AI agent capabilities. Skills are `SKILL.md` files that any compatible agent can read and execute.

These skills are built for OpenMM on centralized exchanges, but the format works with any platform that supports the Agent Skills standard — including OpenAI Codex, Gemini CLI, GitHub Copilot, Cursor, VS Code, OpenClaw, and more.

---

## Links

- **Core Library:** https://github.com/3rd-Eye-Labs/OpenMM
- **MCP Server:** https://github.com/QBT-Labs/OpenMM-MCP
- **npm:** https://www.npmjs.com/package/@3rd-eye-labs/openmm
- **Documentation:** https://deepwiki.com/3rd-Eye-Labs/OpenMM
- **Agent Skills Standard:** https://agentskills.io/home
- **Website:** https://qbtlabs.io

## License

MIT © [QBT Labs](https://qbtlabs.io)
