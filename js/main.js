// Entry point for wiring data, engine logic, and UI modules.

import { scenarios } from "./data/scenarios.js";
import { applyRound, createGameState, finalPnL, makeRng } from "./engine.js";
import {
  appendRoundLog,
  bindResultsControls,
  bindQuizForm,
  bindQuoteForm,
  bindBackControl,
  clearQuoteError,
  disableQuoteForm,
  renderGameStatus,
  renderQuizFeedback,
  renderScenarioList,
  renderTradeSummary,
  resetGameView,
  showGameView,
  showQuoteError,
  showResultsSection,
  showRoundHint,
  showRoundResult,
  showScenarioList
} from "./ui.js";

// This can be loosened later if users enter rounded PnL estimates.
const PNL_TOLERANCE = 0.5;

let currentState = null;
let currentRng = null;
let currentScenario = null;

function parseQuoteValue(value) {
  if (value.trim() === "") {
    return Number.NaN;
  }

  return Number(value);
}

function validateQuoteInput({ bid, ask }) {
  const parsedBid = parseQuoteValue(bid);
  const parsedAsk = parseQuoteValue(ask);

  if (!Number.isFinite(parsedBid) || !Number.isFinite(parsedAsk)) {
    return {
      valid: false,
      message: "Enter finite numbers for both bid and ask."
    };
  }

  if (parsedBid <= 0 || parsedAsk <= 0) {
    return {
      valid: false,
      message: "Bid and ask must both be greater than zero."
    };
  }

  if (parsedAsk <= parsedBid) {
    return {
      valid: false,
      message: "Ask must be greater than bid."
    };
  }

  return {
    valid: true,
    bid: parsedBid,
    ask: parsedAsk
  };
}

function tradeMessage(trade) {
  if (trade.action === "none") {
    return "No trade";
  }

  const verb = trade.action === "sold" ? "Sold" : "Bought";
  return `${verb} ${trade.size} at ${trade.price} (${trade.counterparty})`;
}

function convergenceHint(trade) {
  // This reads only the visible last-trade action, never the hidden true value.
  if (trade.action === "sold") {
    return "Your ask kept getting lifted, so the market may be higher than your ask.";
  }

  if (trade.action === "bought") {
    return "Your bid kept getting hit, so the market may be lower than your bid.";
  }

  return "Your market held with no trade, so consider tightening it.";
}

function positionAnswerFor(position) {
  if (position > 0) {
    return "long";
  }

  if (position < 0) {
    return "short";
  }

  return "flat";
}

function positionLabelFor(answer) {
  if (answer === "long") {
    return "Long";
  }

  if (answer === "short") {
    return "Short";
  }

  if (answer === "flat") {
    return "Flat";
  }

  return "";
}

function startGame(scenario) {
  currentScenario = scenario;
  currentState = createGameState({ scenario });
  currentRng = makeRng(Date.now());

  resetGameView();
  showGameView(scenario);
  renderGameStatus(currentState);
  showRoundResult("");
  showRoundHint("");
}

function abandonGame() {
  currentScenario = null;
  currentState = null;
  currentRng = null;
  showScenarioList();
}

function finishGame() {
  disableQuoteForm();
  showResultsSection(currentScenario);
}

function handleQuoteSubmit(rawQuote) {
  if (!currentState || !currentRng || currentState.status !== "active") {
    return;
  }

  const quote = validateQuoteInput(rawQuote);
  if (!quote.valid) {
    showQuoteError(quote.message);
    return;
  }

  clearQuoteError();

  currentState = applyRound(
    currentState,
    {
      bid: quote.bid,
      ask: quote.ask
    },
    currentRng
  );

  const latestTrade = currentState.trades[currentState.trades.length - 1];
  const message = tradeMessage(latestTrade);

  renderGameStatus(currentState);
  showRoundResult(message);
  showRoundHint(convergenceHint(latestTrade));
  appendRoundLog(latestTrade, message);

  if (currentState.status === "finished") {
    finishGame();
  }
}

function handleQuizSubmit({ positionAnswer, pnlAnswer }) {
  if (!currentState || currentState.status !== "finished") {
    return;
  }

  const parsedPnlAnswer = parseQuoteValue(pnlAnswer);
  const correctPositionAnswer = positionAnswerFor(currentState.position);
  const correctPositionLabel = positionLabelFor(correctPositionAnswer);
  const correctPnl = finalPnL(currentState);
  const positionCorrect = positionAnswer === correctPositionAnswer;
  const pnlCorrect =
    Number.isFinite(parsedPnlAnswer) &&
    Math.abs(parsedPnlAnswer - correctPnl) <= PNL_TOLERANCE;

  renderQuizFeedback({
    positionCorrect,
    pnlCorrect,
    correctPositionLabel,
    correctPnl,
    positionAnswerLabel: positionLabelFor(positionAnswer),
    pnlAnswer: Number.isFinite(parsedPnlAnswer) ? parsedPnlAnswer : "no answer"
  });
  renderTradeSummary(currentState, correctPositionLabel, correctPnl);
}

renderScenarioList(scenarios, (scenario) => {
  startGame(scenario);
});

bindBackControl(() => {
  abandonGame();
});

bindQuoteForm(handleQuoteSubmit);
bindQuizForm(handleQuizSubmit);
bindResultsControls({
  onPlayAgain: () => {
    if (currentScenario) {
      startGame(currentScenario);
    }
  },
  onChooseAnotherScenario: () => {
    abandonGame();
  }
});
showScenarioList();
