import assert from "node:assert/strict";
import test from "node:test";

import {
  applyRound,
  createGameState,
  evaluateQuote,
  finalPnL,
  makeRng
} from "../js/engine.js";

const scenario = {
  id: "test-scenario",
  trueValue: 100
};

function scriptedRng(values) {
  const queue = [...values];

  return () => {
    if (queue.length === 0) {
      throw new Error("scriptedRng queue is empty");
    }

    return queue.shift();
  };
}

function throwingRng() {
  throw new Error("rng should not be called");
}

test("createGameState returns a serializable active game state with flow settings", () => {
  const state = createGameState({ scenario });

  // V = 100 and bandFraction = 0.05, so band = 0.05 * 100 = 5.
  assert.deepEqual(state, {
    scenarioId: "test-scenario",
    trueValue: 100,
    round: 1,
    maxRounds: 7,
    tradeSize: 1,
    flowProb: 0.7,
    band: 5,
    position: 0,
    cash: 0,
    trades: [],
    status: "active"
  });
});

test("informed sell does not call rng and updates position and cash", () => {
  const state = createGameState({ scenario });
  const nextState = applyRound(state, { bid: 80, ask: 90 }, throwingRng);

  // ask 90 < V 100, so informed flow buys at ask and the user sells 1 at 90.
  assert.equal(nextState.trades[0].action, "sold");
  // The fill price is the ask, so price = 90.
  assert.equal(nextState.trades[0].price, 90);
  // Each trade uses q = 1, so size = 1.
  assert.equal(nextState.trades[0].size, 1);
  // The pickoff branch is informed flow.
  assert.equal(nextState.trades[0].counterparty, "informed");
  // User sells 1, so positionAfter = 0 - 1 = -1.
  assert.equal(nextState.position, -1);
  // User sells 1 at 90, so cashAfter = 0 + 90 * 1 = 90.
  assert.equal(nextState.cash, 90);
});

test("informed buy does not call rng and updates position and cash", () => {
  const state = createGameState({ scenario });
  const nextState = applyRound(state, { bid: 110, ask: 120 }, throwingRng);

  // bid 110 > V 100, so informed flow sells at bid and the user buys 1 at 110.
  assert.equal(nextState.trades[0].action, "bought");
  // The fill price is the bid, so price = 110.
  assert.equal(nextState.trades[0].price, 110);
  // Each trade uses q = 1, so size = 1.
  assert.equal(nextState.trades[0].size, 1);
  // The pickoff branch is informed flow.
  assert.equal(nextState.trades[0].counterparty, "informed");
  // User buys 1, so positionAfter = 0 + 1 = 1.
  assert.equal(nextState.position, 1);
  // User buys 1 at 110, so cashAfter = 0 - 110 * 1 = -110.
  assert.equal(nextState.cash, -110);
});

test("uninformed buyer in band sells to the user ask and earns spread", () => {
  const state = createGameState({ scenario, flowProb: 0.7, bandFraction: 0.05 });
  const nextState = applyRound(state, { bid: 98, ask: 103 }, scriptedRng([0.1, 0.2]));

  // Quote 98 <= V 100 <= 103 straddles, arrival 0.1 < flowProb 0.7, side 0.2 < 0.5, and ask 103 <= V + band 105.
  assert.equal(nextState.trades[0].action, "sold");
  // The uninformed buyer pays the ask, so price = 103.
  assert.equal(nextState.trades[0].price, 103);
  // User sells 1, so positionAfter = 0 - 1 = -1.
  assert.equal(nextState.position, -1);
  // User sells 1 at 103, so cashAfter = 0 + 103 * 1 = 103.
  assert.equal(nextState.cash, 103);
  // The straddle fill came from uninformed flow.
  assert.equal(nextState.trades[0].counterparty, "uninformed");
  // Final PnL = cash + position * V = 103 + (-1 * 100) = 3.
  assert.equal(finalPnL(nextState), 3);
});

test("uninformed seller in band buys at the user bid and earns spread", () => {
  const state = createGameState({ scenario, flowProb: 0.7, bandFraction: 0.05 });
  const nextState = applyRound(state, { bid: 98, ask: 103 }, scriptedRng([0.1, 0.8]));

  // Quote 98 <= V 100 <= 103 straddles, arrival 0.1 < flowProb 0.7, side 0.8 >= 0.5, and bid 98 >= V - band 95.
  assert.equal(nextState.trades[0].action, "bought");
  // The uninformed seller hits the bid, so price = 98.
  assert.equal(nextState.trades[0].price, 98);
  // User buys 1, so positionAfter = 0 + 1 = 1.
  assert.equal(nextState.position, 1);
  // User buys 1 at 98, so cashAfter = 0 - 98 * 1 = -98.
  assert.equal(nextState.cash, -98);
  // The straddle fill came from uninformed flow.
  assert.equal(nextState.trades[0].counterparty, "uninformed");
  // Final PnL = cash + position * V = -98 + (1 * 100) = 2.
  assert.equal(finalPnL(nextState), 2);
});

test("uninformed buyer out of band does not trade", () => {
  const state = createGameState({ scenario, flowProb: 0.7, bandFraction: 0.05 });
  const nextState = applyRound(state, { bid: 98, ask: 130 }, scriptedRng([0.1, 0.2]));

  // Quote straddles and buyer arrives, but ask 130 > V + band 105, so no fill.
  assert.equal(nextState.trades[0].action, "none");
  // No trade has no fill price, so price is undefined.
  assert.equal(nextState.trades[0].price, undefined);
  // No trade has no fill size, so size is undefined.
  assert.equal(nextState.trades[0].size, undefined);
  // No trade has no counterparty, so counterparty is null.
  assert.equal(nextState.trades[0].counterparty, null);
  // No trade leaves position unchanged at 0.
  assert.equal(nextState.position, 0);
  // No trade leaves cash unchanged at 0.
  assert.equal(nextState.cash, 0);
});

test("no uninformed arrival does not trade", () => {
  const state = createGameState({ scenario, flowProb: 0.7, bandFraction: 0.05 });
  const nextState = applyRound(state, { bid: 98, ask: 103 }, scriptedRng([0.9]));

  // Quote straddles, but arrival 0.9 >= flowProb 0.7, so no flow arrives.
  assert.equal(nextState.trades[0].action, "none");
  // No trade has no fill price, so price is undefined.
  assert.equal(nextState.trades[0].price, undefined);
  // No trade has no fill size, so size is undefined.
  assert.equal(nextState.trades[0].size, undefined);
  // No trade has no counterparty, so counterparty is null.
  assert.equal(nextState.trades[0].counterparty, null);
});

test("equality boundaries use the straddle branch rather than informed pickoff", () => {
  const askEqual = evaluateQuote({
    bid: 90,
    ask: 100,
    trueValue: 100,
    size: 1,
    band: 5,
    flowProb: 0.7,
    rng: scriptedRng([0.9])
  });
  const bidEqual = evaluateQuote({
    bid: 100,
    ask: 110,
    trueValue: 100,
    size: 1,
    band: 5,
    flowProb: 0.7,
    rng: scriptedRng([0.9])
  });

  // ask == V is not ask < V, and arrival 0.9 >= 0.7 means straddle no trade.
  assert.equal(askEqual.action, "none");
  // A straddle no trade has counterparty null, not informed.
  assert.equal(askEqual.counterparty, null);
  // bid == V is not bid > V, and arrival 0.9 >= 0.7 means straddle no trade.
  assert.equal(bidEqual.action, "none");
  // A straddle no trade has counterparty null, not informed.
  assert.equal(bidEqual.counterparty, null);
});

test("finalPnL directly applies cash plus marked position value", () => {
  // PnL = cash + position * V = 100 + (-1 * 90) = 10.
  assert.equal(finalPnL({ cash: 100, position: -1, trueValue: 90 }), 10);
  // PnL = cash + position * V = 100 + (-1 * 110) = -10.
  assert.equal(finalPnL({ cash: 100, position: -1, trueValue: 110 }), -10);
});

test("applyRound does not mutate its input state or trades array", () => {
  const state = createGameState({ scenario });
  const originalTrades = state.trades;
  const nextState = applyRound(state, { bid: 80, ask: 90 });

  // applyRound returns a different object reference from the input state.
  assert.notEqual(nextState, state);
  // applyRound creates a new trades array instead of reusing the original array.
  assert.notEqual(nextState.trades, originalTrades);
  // The original trades array started empty and remains empty.
  assert.deepEqual(state.trades, []);
  // The input round started at 1 and remains 1.
  assert.equal(state.round, 1);
  // The input position started at 0 and remains 0.
  assert.equal(state.position, 0);
  // The input cash started at 0 and remains 0.
  assert.equal(state.cash, 0);
  // The input status started active and remains active.
  assert.equal(state.status, "active");
});

test("applyRound advances rounds and finishes after maxRounds", () => {
  let state = createGameState({ scenario, maxRounds: 2 });

  state = applyRound(state, { bid: 80, ask: 90 });
  // Starting round 1 advances to next round 2 after one round.
  assert.equal(state.round, 2);
  // nextRound 2 <= maxRounds 2, so status remains active.
  assert.equal(state.status, "active");

  state = applyRound(state, { bid: 80, ask: 90 });
  // Round 2 advances to next round 3 after the second round.
  assert.equal(state.round, 3);
  // nextRound 3 > maxRounds 2, so status is finished.
  assert.equal(state.status, "finished");
});

test("applyRound throws when game is not active", () => {
  const state = {
    ...createGameState({ scenario }),
    status: "finished"
  };

  // A finished state is not active, so applyRound must throw before trading.
  assert.throws(() => applyRound(state, { bid: 80, ask: 90 }), /active/);
});

test("applyRound throws for invalid quotes", () => {
  const state = createGameState({ scenario });

  // ask 100 <= bid 100 violates ask > bid.
  assert.throws(() => applyRound(state, { bid: 100, ask: 100 }), /greater than bid/);
  // ask 100 <= bid 110 violates ask > bid.
  assert.throws(() => applyRound(state, { bid: 110, ask: 100 }), /greater than bid/);
  // bid NaN is not finite.
  assert.throws(() => applyRound(state, { bid: Number.NaN, ask: 100 }), /finite/);
  // ask Infinity is not finite.
  assert.throws(() => applyRound(state, { bid: 90, ask: Infinity }), /finite/);
  // bid 0 violates bid > 0.
  assert.throws(() => applyRound(state, { bid: 0, ask: 100 }), /positive/);
  // ask -1 violates ask > 0.
  assert.throws(() => applyRound(state, { bid: 90, ask: -1 }), /positive/);
});

test("makeRng is deterministic by seed", () => {
  const first = makeRng(123);
  const second = makeRng(123);
  const different = makeRng(456);

  const firstValues = [first(), first(), first(), first()];
  const secondValues = [second(), second(), second(), second()];
  const differentValues = [different(), different(), different(), different()];

  // Same seed 123 uses the same recurrence, so the first four values match exactly.
  assert.deepEqual(firstValues, secondValues);
  // Seed 456 initializes a different 32 bit state than seed 123, so the first four values differ.
  assert.notDeepEqual(firstValues, differentValues);
});
