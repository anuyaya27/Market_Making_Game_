// Pure game logic for quotes, flow, positions, and PnL.

function assertFinitePositiveNumber(value, name) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a finite positive number.`);
  }
}

function assertProbability(value, name) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be a finite number between 0 and 1.`);
  }
}

function assertNonNegativeNumber(value, name) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite non-negative number.`);
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

function noTrade() {
  return {
    action: "none",
    price: undefined,
    size: undefined,
    counterparty: null,
    message: "No trade"
  };
}

function filledTrade({ action, price, size, counterparty }) {
  const verb = action === "sold" ? "Sold" : "Bought";

  return {
    action,
    price,
    size,
    counterparty,
    message: `${verb} ${size} at ${price} (${counterparty})`
  };
}

export function makeRng(seed) {
  let value = seed >>> 0;

  return function rng() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGameState({
  scenario,
  maxRounds = 7,
  tradeSize = 1,
  flowProb = 0.7,
  bandFraction = 0.05
}) {
  if (!scenario) {
    throw new Error("Scenario is required.");
  }

  assertFinitePositiveNumber(scenario.trueValue, "Scenario trueValue");
  assertFinitePositiveNumber(maxRounds, "maxRounds");
  assertFinitePositiveNumber(tradeSize, "tradeSize");
  assertProbability(flowProb, "flowProb");
  assertNonNegativeNumber(bandFraction, "bandFraction");

  return {
    scenarioId: scenario.id,
    trueValue: scenario.trueValue,
    round: 1,
    maxRounds,
    tradeSize,
    flowProb,
    band: bandFraction * scenario.trueValue,
    position: 0,
    cash: 0,
    trades: [],
    status: "active"
  };
}

export function evaluateQuote({
  bid,
  ask,
  trueValue,
  size,
  band,
  flowProb,
  rng
}) {
  if (ask < trueValue) {
    return filledTrade({
      action: "sold",
      price: ask,
      size,
      counterparty: "informed"
    });
  }

  if (bid > trueValue) {
    return filledTrade({
      action: "bought",
      price: bid,
      size,
      counterparty: "informed"
    });
  }

  if (typeof rng !== "function") {
    throw new Error("rng must be provided for straddling quotes.");
  }

  const arrival = rng();
  if (arrival >= flowProb) {
    return noTrade();
  }

  const side = rng();
  if (side < 0.5) {
    if (ask <= trueValue + band) {
      return filledTrade({
        action: "sold",
        price: ask,
        size,
        counterparty: "uninformed"
      });
    }

    return noTrade();
  }

  if (bid >= trueValue - band) {
    return filledTrade({
      action: "bought",
      price: bid,
      size,
      counterparty: "uninformed"
    });
  }

  return noTrade();
}

export function applyRound(state, { bid, ask }, rng) {
  if (state.status !== "active") {
    throw new Error("Cannot apply a round unless the game is active.");
  }

  validateQuote({ bid, ask });

  const result = evaluateQuote({
    bid,
    ask,
    trueValue: state.trueValue,
    size: state.tradeSize,
    band: state.band,
    flowProb: state.flowProb,
    rng
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
    counterparty: result.counterparty,
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
