# Market Making Trainer — Master Project Document

> **Purpose of this file.** This is the single source of truth for the project. Paste the whole document into any LLM as context, then hand it one stage prompt at a time (see Section 9). It contains the concept, the exact game mechanics, the data model, the tech stack, a staged build plan, and ready to paste prompts for each stage.

---

## 1. One paragraph pitch

A browser based training tool for quant style estimation and market making interviews. The user picks an estimation scenario (for example, the number of bikes in Amsterdam), then acts as a market maker by quoting a two sided market (a bid and an ask) over a fixed number of rounds. The app plays the counterparty and trades against the quote based on the hidden true value. The user accumulates a position and a running PnL, and at the end the true value is revealed and the app quizzes them on their final position and PnL. It runs entirely in the browser and is deployed on a global CDN so anyone can use it.

---

## 2. Requirements (what the product must do)

These are the fixed goals the build must satisfy.

- The user can choose from a list of preset scenarios shown in the UI.
- For each round, the user submits a bid and an ask.
- The app responds by buying from or selling to the user, or by not trading, based on the true value.
- The interaction runs for a fixed number of rounds (default 7) of back and forth, during which a well playing user converges their market toward the true value.
- After the final round, the app reveals the true value and quizzes the user on their final PnL and whether they are long or short.
- The app is a website accessible to everyone globally.
- Keep the stack as simple as possible. No unnecessary infrastructure.

---

## 3. Core mechanics (the exact spec)

This section is the heart of the project. An LLM implementing the app should treat it as precise and unambiguous.

### 3.1 Setup

- Each scenario has a hidden true value `V`, a positive number.
- The user is the **market maker**. They start flat: `position = 0`, `cash = 0`.
- A game runs for `N` rounds (default `N = 7`).
- Each trade is for a fixed size `q` (default `q = 1`). Size is configurable but fixed within a game for v1.

### 3.2 The user's quote

Each round the user submits a bid `b` and an ask `a`, subject to `a > b > 0`. A quote where `a <= b` is invalid and must be rejected by the UI before it reaches the engine.

### 3.3 Counterparty decision with informed and uninformed flow

The app knows `V` and models two kinds of counterparty flow.

Informed flow picks off a wrong quote and does not use randomness:

| Condition        | App action              | Effect on user                          |
|------------------|-------------------------|-----------------------------------------|
| `a < V`          | App buys `q` at `a`     | User **sells**: `position -= q`, `cash += a * q` |
| `b > V`          | App sells `q` at `b`    | User **buys**: `position += q`, `cash -= b * q`  |

Uninformed flow can only arrive when the quote straddles true value, `b <= V <= a`. It is controlled by:

- `flowProb`, the probability that uninformed flow arrives on a straddling quote. Default `0.7`.
- `band = bandFraction * V`, with default `bandFraction = 0.05`.
- `rng`, an injected function returning a number in `[0, 1)`.

The engine does not store `rng` in state. This keeps state pure and serializable while still allowing one seeded generator per game in production.

On a straddling quote, evaluate in this exact order:

1. Draw `arrival = rng()`. If `arrival >= flowProb`, there is no trade.
2. Draw `side = rng()`. If `side < 0.5`, an uninformed buyer may lift the ask.
3. The buyer trades only if `a <= V + band`; otherwise there is no trade.
4. If `side >= 0.5`, an uninformed seller may hit the bid.
5. The seller trades only if `b >= V - band`; otherwise there is no trade.

This rewards tight markets around `V` because they can earn spread from uninformed flow, while very wide straddling markets are not filled.

### 3.4 Bookkeeping

- `position` is the running sum of signed trades. The user is **long** if `position > 0`, **short** if `position < 0`, and **flat** if `position == 0`.
- `cash` is the running cash from all fills.
- Final PnL, marked to the revealed true value:

```
PnL = cash + position * V
```

**Worked check.** User sells 1 at 100 and `V = 90`: `cash = 100`, `position = -1`, `PnL = 100 + (-1)(90) = +10`. Selling above true value is a profit, correct. Flip `V` to 110 and `PnL = 100 - 110 = -10`, a loss, also correct. The counterparty rule only ever fills the user on the losing side of a wrong quote, so both directions stay consistent.

### 3.5 End of game quiz

After round `N`, reveal `V` and ask the user:

1. Are you long, short, or flat? (grade against `sign(position)`)
2. What is your final PnL? (grade against `cash + position * V`, within a small tolerance)
3. Optional stretch: what is the average price of your open position? (VWAP of the fills making up the current open position; reset the basis whenever the position flips sign)

Keep the quiz to items 1 and 2 for v1. Item 3 is a stretch because average price is ambiguous once a position flips sides, so define it carefully before adding it.

---

## 4. Data model

```ts
type Scenario = {
  id: string;
  title: string;        // "Number of bikes in Amsterdam"
  prompt: string;       // full question text shown to the user
  unit: string;         // "bikes"
  trueValue: number;    // V. Verify each value before use.
  source?: string;      // where the number came from
};

type Trade = {
  round: number;
  bid: number;
  ask: number;
  action: 'sold' | 'bought' | 'none';
  price?: number;       // fill price if a trade happened
  size?: number;        // q if a trade happened
  counterparty: 'informed' | 'uninformed' | null;
  positionAfter: number;
  cashAfter: number;
};

type GameState = {
  scenarioId: string;
  trueValue: number;    // kept server side in the backend variant (Stage 6)
  round: number;        // current round, 1..maxRounds
  maxRounds: number;    // N, default 7
  tradeSize: number;    // q, default 1
  flowProb: number;     // probability of uninformed flow on a straddling quote
  band: number;         // max distance from V where uninformed flow will trade
  position: number;
  cash: number;
  trades: Trade[];
  status: 'active' | 'finished';
};
```

Core engine functions to implement (pure, no UI, unit testable):

```ts
makeRng(seed: number): () => number;  // mulberry32, returns numbers in [0, 1)

evaluateQuote(input: {
  bid: number;
  ask: number;
  trueValue: number;
  size: number;
  band: number;
  flowProb: number;
  rng: () => number;
}): {
  action: 'sold' | 'bought' | 'none';
  price?: number;
  size?: number;
  counterparty: 'informed' | 'uninformed' | null;
  message: string;
};

applyRound(state: GameState, quote: { bid: number; ask: number }, rng: () => number)
  : GameState;

finalPnL(state: GameState): number;   // cash + position * trueValue
```

---

## 5. Starter scenarios

Use scenarios that have a real, verifiable ground truth so scoring is defensible. Pure Fermi puzzles with no true answer are fun but hard to grade, so prefer factual ones for v1. **Every value below is an example and must be verified before shipping.**

- Number of bikes in Amsterdam (bikes)
- Number of McDonald's locations in the US (locations)
- Number of Starbucks worldwide (locations)
- Height of the Eiffel Tower in metres (metres)
- Number of commercial airports in the US (airports)
- Population of a mid size city of your choice (people)

Store them in a `scenarios.json` file so adding more is a data change, not a code change.

---

## 6. Tech stack

Keep it light. The mechanics are pure frontend logic with injected randomness and no server required for v1.

- **UI:** Vanilla browser UI with native ES modules.
- **Language:** JavaScript.
- **Styling:** plain CSS.
- **Data:** scenarios and true values in a local ES module.
- **Deployment:** Vercel or Netlify. Both are free and serve from a global CDN, so global accessibility is handled with zero infrastructure.
- **Local development:** Vite dev server. No Docker.

**When to add a backend.** The only reason is to stop users from opening dev tools and reading the true values out of the bundle, which matters only if the tool is used for real evaluation. The clean upgrade is Next.js (same React, same Vercel deploy) with `V` and the trade evaluation moved into an API route so the browser never sees the answer. A small Python FastAPI service is an equally good backend if preferred, at the cost of a second deploy. This is Stage 6 and is optional.

---

## 7. Constraints and conventions

- No Docker. Local dev only.
- Keep the game engine (Section 4) decoupled from React so it can be unit tested in isolation.
- Money and position math must be exact and covered by tests. This is a trading tool, so a wrong PnL is a credibility problem.
- When asking an LLM to edit existing code, instruct it to keep method names and function signatures unchanged unless the task is explicitly to rename them.

---

## 8. Staged build plan

Each stage has a goal, a scope, and a definition of done. Build them in order. Each one leaves you with something that runs.

**Stage 0 — Scaffold and deploy pipeline.**
Goal: an empty app that is live. Scope: Vite + React + TypeScript project, a basic layout shell, connected to Vercel or Netlify with automatic deploys. Done when: pushing to main updates a public URL.

**Stage 1 — Scenario data and selection screen.**
Goal: the user can pick a scenario. Scope: `scenarios.json`, a scenario list screen, navigation into a game screen that shows the chosen prompt. Done when: selecting a scenario lands the user on a game screen showing that scenario's question.

**Stage 2 — Game engine (pure logic).**
Goal: the mechanics work as pure functions. Scope: `makeRng`, `evaluateQuote`, `applyRound`, `finalPnL`, plus the `GameState` reducer, with a unit test suite covering informed flow, uninformed flow, position and cash updates, immutability, seeded RNG behavior, and the worked PnL check from Section 3.4. Done when: `node --test` passes and no UI code is involved.

**Stage 3 — Game UI wiring.**
Goal: a playable round loop. Scope: bid and ask inputs with validation (`a > b > 0`), a submit action that calls the engine, a per round result message, and live display of round number, position, and running cash. Done when: a user can play all `N` rounds and see the counterparty respond each round.

**Stage 4 — Reveal and quiz.**
Goal: the full loop, end to end. Scope: on the final round, reveal `V`, ask the two quiz questions, grade the answers against the engine, and show a summary (trade history, final position, final PnL). Done when: a full game runs from scenario pick to graded result.

**Stage 5 — Polish and UX.**
Goal: it feels good to use. Scope: convergence hints, responsive layout, clean styling, a play again flow, optionally a local history of past games. Done when: it looks and feels like a finished tool on desktop and mobile.

**Stage 6 (optional) — Hide the answers with a backend.**
Goal: users cannot read `V` from the client. Scope: move `V` and trade evaluation into a Next.js API route (or FastAPI), and have the client call it. Done when: the true value is never present in the client bundle.

---

## 9. How to prompt an LLM through the build

Workflow: paste this entire document first as context, then paste one stage prompt below. After the model produces code, review it, then move to the next stage. The prompts assume the master document is already in context.

Optional context primer to prepend to any stage prompt:

> You are helping me build the Market Making Trainer described in the master document I just gave you. Follow its mechanics (Section 3), data model (Section 4), tech stack (Section 6), and constraints (Section 7) exactly. Ask me before deviating from the spec. Do not use em dashes in any prose you write.

### Stage 0 prompt

> Set up the Stage 0 scaffold. Create a Vite + React + TypeScript project with a clean layout shell (a header and a main content area, no game logic yet). Give me the file tree, the key files, and step by step commands to run it locally with the Vite dev server (no Docker) and to deploy it to Vercel with automatic deploys from main. Keep dependencies minimal.

### Stage 1 prompt

> Implement Stage 1. Create `scenarios.json` using the starter scenarios from Section 5 with clearly marked placeholder values I will verify. Build a scenario selection screen that lists them, and wire navigation so selecting one opens a game screen that displays that scenario's prompt and unit. No trading logic yet. Show me the new and changed files.

### Stage 2 prompt

> Implement Stage 2: the pure game engine from Section 4, with no UI dependency. Write `makeRng`, `evaluateQuote`, `applyRound`, and `finalPnL`, plus the `GameState` shape. Then write a unit test suite using `node:test` and `node:assert` that covers informed flow, uninformed flow, position and cash updates, immutability, seeded RNG behavior, and the worked PnL check from Section 3.4 in both directions. Keep the engine free of any DOM dependency. Show me the engine file and the test file, and confirm the tests pass.

### Stage 3 prompt

> Implement Stage 3: wire the engine into the game screen. Add bid and ask inputs with validation that enforces `a > b > 0` and rejects invalid quotes before calling the engine. On submit, call `applyRound`, show a clear result message for the round (sold, bought, or no trade, with price and size), and display the current round number, position, and running cash. Let the user play through all `N` rounds. Do not reveal the true value yet. Keep engine method names unchanged.

### Stage 4 prompt

> Implement Stage 4: the reveal and quiz. After the final round, reveal the true value, then ask the user (1) whether they are long, short, or flat, and (2) their final PnL. Grade both against the engine, using a small tolerance for the PnL answer. Show an end screen with the full trade history, final position, final PnL, and their quiz results. Keep engine method names unchanged.

### Stage 5 prompt

> Implement Stage 5: polish. Add convergence hints, a responsive layout that works on mobile and desktop, clean styling, and a play again flow. Optionally add a local history of past games using in memory state (no browser storage APIs). Do not change any engine logic or method names. Show me only the changed files.

### Stage 6 prompt (optional)

> Implement Stage 6: hide the true values. Migrate the app so that the true value and the trade evaluation live in a server side API route and the client never receives `V` in its bundle. Recommend the smallest change path (Next.js API route on the same Vercel deploy, or a separate FastAPI service) and explain the trade offs before writing code. Keep the engine's function names and behavior identical, just relocate where they run.

---

## 10. Future extensions (not required for v1)

- Variable trade size per round, chosen by the counterparty, to simulate size pressure.
- Difficulty tiers (tighter width requirements, more rounds, noisier scenarios).
- A scoring model that rewards fast convergence, not just final PnL.
- A shared scoreboard (requires a backend and a datastore).
- Timed rounds to mimic interview pressure.
