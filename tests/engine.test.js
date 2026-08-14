import assert from "node:assert/strict";
import test from "node:test";

import {
  applyRound,
  createGameState,
  evaluateQuote,
  finalPnL
} from "../js/engine.js";

const scenario = {
  id: "test-scenario",
  trueValue: 100
};

test("createGameState returns a fresh active game state", () => {
  const state = createGameState({ scenario });

  assert.deepEqual(state, {
    scenarioId: "test-scenario",
    trueValue: 100,
    round: 1,
    maxRounds: 7,
    tradeSize: 1,
    position: 0,
    cash: 0,
    trades: [],
    status: "active"
  });
});

test("evaluateQuote sells when ask is below true value", () => {
  assert.deepEqual(evaluateQuote({ bid: 80, ask: 90, trueValue: 100, size: 1 }), {
    action: "sold",
    price: 90,
    size: 1,
    message: "Sold 1 at 90"
  });
});

test("evaluateQuote buys when bid is above true value", () => {
  assert.deepEqual(evaluateQuote({ bid: 110, ask: 120, trueValue: 100, size: 1 }), {
    action: "bought",
    price: 110,
    size: 1,
    message: "Bought 1 at 110"
  });
});

test("evaluateQuote returns no trade when quote straddles true value", () => {
  assert.deepEqual(evaluateQuote({ bid: 90, ask: 110, trueValue: 100, size: 1 }), {
    action: "none",
    price: undefined,
    size: undefined,
    message: "No trade"
  });
});

test("evaluateQuote uses strict boundaries for ask and bid equal to true value", () => {
  assert.equal(evaluateQuote({ bid: 90, ask: 100, trueValue: 100, size: 1 }).action, "none");
  assert.equal(evaluateQuote({ bid: 100, ask: 110, trueValue: 100, size: 1 }).action, "none");
});

test("applyRound updates position and cash for sold branch", () => {
  const state = createGameState({ scenario });
  const nextState = applyRound(state, { bid: 80, ask: 90 });

  assert.equal(nextState.position, -1);
  assert.equal(nextState.cash, 90);
  assert.equal(nextState.trades[0].action, "sold");
  assert.equal(nextState.trades[0].positionAfter, -1);
  assert.equal(nextState.trades[0].cashAfter, 90);
});

test("applyRound updates position and cash for bought branch", () => {
  const state = createGameState({ scenario });
  const nextState = applyRound(state, { bid: 110, ask: 120 });

  assert.equal(nextState.position, 1);
  assert.equal(nextState.cash, -110);
  assert.equal(nextState.trades[0].action, "bought");
  assert.equal(nextState.trades[0].positionAfter, 1);
  assert.equal(nextState.trades[0].cashAfter, -110);
});

test("applyRound leaves position and cash unchanged for no trade", () => {
  const state = createGameState({ scenario });
  const nextState = applyRound(state, { bid: 90, ask: 110 });

  assert.equal(nextState.position, 0);
  assert.equal(nextState.cash, 0);
  assert.equal(nextState.trades[0].action, "none");
  assert.equal(nextState.trades[0].price, undefined);
  assert.equal(nextState.trades[0].size, undefined);
});

test("applyRound does not mutate its input state or trades array", () => {
  const state = createGameState({ scenario });
  const originalTrades = state.trades;
  const nextState = applyRound(state, { bid: 80, ask: 90 });

  assert.notEqual(nextState, state);
  assert.notEqual(nextState.trades, originalTrades);
  assert.deepEqual(state.trades, []);
  assert.equal(state.round, 1);
  assert.equal(state.position, 0);
  assert.equal(state.cash, 0);
  assert.equal(state.status, "active");
});

test("applyRound advances rounds and finishes after maxRounds", () => {
  let state = createGameState({ scenario, maxRounds: 2 });

  state = applyRound(state, { bid: 90, ask: 110 });
  assert.equal(state.round, 2);
  assert.equal(state.status, "active");

  state = applyRound(state, { bid: 90, ask: 110 });
  assert.equal(state.round, 3);
  assert.equal(state.status, "finished");
});

test("applyRound throws when game is not active", () => {
  const state = {
    ...createGameState({ scenario }),
    status: "finished"
  };

  assert.throws(() => applyRound(state, { bid: 90, ask: 110 }), /active/);
});

test("applyRound throws for invalid quotes", () => {
  const state = createGameState({ scenario });

  assert.throws(() => applyRound(state, { bid: 100, ask: 100 }), /greater than bid/);
  assert.throws(() => applyRound(state, { bid: 110, ask: 100 }), /greater than bid/);
  assert.throws(() => applyRound(state, { bid: Number.NaN, ask: 100 }), /finite/);
  assert.throws(() => applyRound(state, { bid: 90, ask: Infinity }), /finite/);
  assert.throws(() => applyRound(state, { bid: 0, ask: 100 }), /positive/);
  assert.throws(() => applyRound(state, { bid: 90, ask: -1 }), /positive/);
});

test("finalPnL returns positive PnL for selling above true value", () => {
  const state = applyRound(
    createGameState({ scenario: { id: "sell-win", trueValue: 90 } }),
    { bid: 80, ask: 100 }
  );

  assert.equal(finalPnL(state), 10);
});

test("finalPnL returns negative PnL for selling below true value", () => {
  const state = applyRound(
    createGameState({ scenario: { id: "sell-loss", trueValue: 110 } }),
    { bid: 80, ask: 100 }
  );

  assert.equal(finalPnL(state), -10);
});
