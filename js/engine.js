// Pure deterministic game logic for quoting, trades, positions, and PnL.

function assertFinitePositiveNumber(value, name) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a finite positive number.`);
  }
}

function validateQuote({ bid, ask }) {
  if (!Number.isFinite(bid) || !Number.isFinite(ask)) {
    throw new Error("Bid and ask must be finite numbers.");
  }

  if (bid <= 0 || ask <= 0) {
    throw new Error("Bid and ask must be positive numbers.");
  }

  if (ask <= bid) {
    throw new Error("Ask must be greater than bid.");
  }
}

export function createGameState({ scenario, maxRounds = 7, tradeSize = 1 }) {
  if (!scenario) {
    throw new Error("Scenario is required.");
  }

  assertFinitePositiveNumber(scenario.trueValue, "Scenario trueValue");
  assertFinitePositiveNumber(maxRounds, "maxRounds");
  assertFinitePositiveNumber(tradeSize, "tradeSize");

  return {
    scenarioId: scenario.id,
    trueValue: scenario.trueValue,
    round: 1,
    maxRounds,
    tradeSize,
    position: 0,
    cash: 0,
    trades: [],
    status: "active"
  };
}

export function evaluateQuote({ bid, ask, trueValue, size }) {
  if (ask < trueValue) {
    return {
      action: "sold",
      price: ask,
      size,
      message: `Sold ${size} at ${ask}`
    };
  }

  if (bid > trueValue) {
    return {
      action: "bought",
      price: bid,
      size,
      message: `Bought ${size} at ${bid}`
    };
  }

  return {
    action: "none",
    price: undefined,
    size: undefined,
    message: "No trade"
  };
}

export function applyRound(state, { bid, ask }) {
  if (state.status !== "active") {
    throw new Error("Cannot apply a round unless the game is active.");
  }

  validateQuote({ bid, ask });

  const result = evaluateQuote({
    bid,
    ask,
    trueValue: state.trueValue,
    size: state.tradeSize
  });

  let positionAfter = state.position;
  let cashAfter = state.cash;

  if (result.action === "sold") {
    positionAfter -= result.size;
    cashAfter += result.price * result.size;
  } else if (result.action === "bought") {
    positionAfter += result.size;
    cashAfter -= result.price * result.size;
  }

  const nextRound = state.round + 1;
  const status = nextRound > state.maxRounds ? "finished" : "active";
  const trade = {
    round: state.round,
    bid,
    ask,
    action: result.action,
    price: result.price,
    size: result.size,
    positionAfter,
    cashAfter
  };

  return {
    ...state,
    round: nextRound,
    position: positionAfter,
    cash: cashAfter,
    trades: [...state.trades, trade],
    status
  };
}

export function finalPnL(state) {
  return state.cash + state.position * state.trueValue;
}
