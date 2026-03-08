# Skill: Agent System Design (Design-First Architecture)

## Purpose

This skill enforces **design-first development** when collaborating with AI agents.

AI should **not start coding immediately**.

Instead, every system must be aligned across structured architectural levels before implementation begins.

This prevents:

- Architecture drift
- Duplicated logic
- Unclear boundaries
- Inconsistent APIs
- Fragile systems

The core rule:

> Systems must be designed before they are implemented.

---

## Design Levels

This skill defines **7 architecture levels**.

AI must move through these levels sequentially.

| Level | Name                 |
| ----- | -------------------- |
| L0    | Intent               |
| L1    | Capability           |
| L2    | Components           |
| L3    | Interaction          |
| L4    | Interface            |
| L5    | Implementation       |
| L6    | Runtime & Operations |

---

## Level 0 — Intent

Define **why the system exists**.

Focus on economic logic, product goals, and system purpose.

**Questions:**

- What problem does this system solve?
- What economic mechanism exists?
- Why does the system deserve to exist?

**Example:**

_Intent:_ Create a meme launch platform with programmable market mechanics.

_Goals:_

- Reduce random token launches
- Introduce structured token lifecycle
- Enable agent-managed launch ecosystems

_Rules:_

- No architecture
- No technology
- Focus on purpose

---

## Level 1 — Capability

Define **what the system can do**.

These are **user-visible capabilities**.

**Example:**

- Wallet authentication
- Token launch
- Internal trading market
- Liquidity graduation
- Agent-driven liquidity management

**Rules:**

Capabilities must be:

- User-facing
- Technology-agnostic
- Concise

---

## Level 2 — Components

Define **system building blocks**.

Each component must have **clear responsibility**.

**Example:**

### Frontend

- Web UI
- Wallet Connector

### Backend

- Auth Service
- Token Issuer
- Market Engine
- Agent Controller

### Infrastructure

- Database
- Blockchain indexer

**Rules:**

Components must be:

- Loosely coupled
- Responsibility focused

---

## Level 3 — Interaction

Define **system workflows**.

How components collaborate to produce capabilities.

**Example — Workflow: Launch Token**

1. User connects wallet
2. Frontend sends launch request
3. Token Issuer deploys token
4. Market Engine creates internal market
5. Agent Controller registers launch agent

**Rules:**

Focus on **flows**, not APIs.

---

## Level 4 — Interface

Define **contracts between components**.

**Example:**

```
POST /token/launch

request
{
  name
  symbol
  supply
}

response
{
  tokenAddress
}
```

Also define:

- Events
- Message formats
- Schemas

**Rules:**

No implementation logic here.

---

## Level 5 — Implementation

Now code can be written.

Choose:

- Frameworks
- Languages
- Database schema

**Example:**

| Layer    | Choices               |
| -------- | --------------------- |
| Frontend | React, Vite, Tailwind |
| Backend  | Node.js, Fastify      |
| Database | PostgreSQL, Redis     |

**Rules:**

Implementation must follow architecture.

---

## Level 6 — Runtime & Operations

Define **how the system runs in production**.

**Example:**

| Concern          | Choice      |
| ---------------- | ----------- |
| Deployment       | Docker      |
| Process manager  | PM2         |
| Monitoring       | Prometheus  |
| Agent automation | Cron agents |

**Rules:**

Systems must include runtime planning.

---

## Execution Protocol

Before writing code, AI must follow:

1. **Step 1** — Intent
2. **Step 2** — Capabilities
3. **Step 3** — Components
4. **Step 4** — Interactions
5. **Step 5** — Interfaces
6. **Step 6** — Implementation
7. **Step 7** — Runtime

If any level is unclear:

> AI must stop and ask questions.

---

## Design Principles

### 1. Structure First

Architecture determines system quality.

### 2. Clear Boundaries

Components must own responsibility.

### 3. Explicit Contracts

Interfaces must be clearly defined.

### 4. Observable Systems

Runtime and monitoring must be planned.

---

## Anti-Patterns

Avoid:

- Jumping directly to implementation
- Mixing responsibilities
- Implicit communication between components
- Duplicated logic across modules

---

## When To Use This Skill

Use this skill when:

- Designing new systems
- Building fullstack applications
- Working with AI coding agents
- Creating protocols or platforms
- Building scalable systems

---

## Philosophy

AI accelerates coding.

But architecture determines system quality.

Therefore:

> Design first.  
> Code second.
