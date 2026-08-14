// DOM rendering and UI event handling for the trainer.

const listView = document.querySelector("#scenario-list-view");
const gameView = document.querySelector("#game-view");
const scenarioList = document.querySelector("#scenario-list");
const gameTitle = document.querySelector("#game-title");
const gameUnit = document.querySelector("#game-unit");
const gamePrompt = document.querySelector("#game-prompt");
const backButton = document.querySelector("#back-to-list");
const gameStatus = document.querySelector("#game-status");
const quoteForm = document.querySelector("#quote-form");
const bidInput = document.querySelector("#bid-input");
const askInput = document.querySelector("#ask-input");
const submitQuote = document.querySelector("#submit-quote");
const quoteError = document.querySelector("#quote-error");
const roundResult = document.querySelector("#round-result");
const roundHint = document.querySelector("#round-hint");
const roundLog = document.querySelector("#round-log");
const resultsSection = document.querySelector("#results-section");
const trueValueResult = document.querySelector("#true-value-result");
const quizForm = document.querySelector("#quiz-form");
const pnlAnswerInput = document.querySelector("#pnl-answer");
const quizFeedback = document.querySelector("#quiz-feedback");
const tradeSummary = document.querySelector("#trade-summary");
const playAgainButton = document.querySelector("#play-again");
const chooseAnotherScenarioButton = document.querySelector("#choose-another-scenario");

function describePosition(position) {
  if (position > 0) {
    return `Long +${position}`;
  }

  if (position < 0) {
    return `Short ${position}`;
  }

  return "Flat 0";
}

function formatDisplayNumber(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6
  }).format(value);
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function setQuoteFormDisabled(disabled) {
  bidInput.disabled = disabled;
  askInput.disabled = disabled;
  submitQuote.disabled = disabled;
}

function tradeOutcomeMessage(trade) {
  if (trade.action === "none") {
    return "No trade";
  }

  const verb = trade.action === "sold" ? "Sold" : "Bought";
  return `${verb} ${trade.size} at ${trade.price} (${trade.counterparty})`;
}

function clearQuizAnswer() {
  quizForm.reset();
}

function createStatusStat(label, value) {
  const stat = document.createElement("span");
  stat.className = "status-stat";

  const labelElement = document.createElement("span");
  labelElement.className = "status-label";
  labelElement.textContent = label;

  const valueElement = document.createElement("span");
  valueElement.className = "status-value";
  valueElement.textContent = value;

  stat.append(labelElement, valueElement);
  return stat;
}

export function renderScenarioList(scenarios, onSelectScenario) {
  scenarioList.replaceChildren();

  scenarios.forEach((scenario) => {
    const button = document.createElement("button");
    button.className = "scenario-button";
    button.type = "button";
    button.textContent = scenario.title;
    button.addEventListener("click", () => {
      onSelectScenario(scenario);
    });

    scenarioList.append(button);
  });
}

export function showScenarioList() {
  listView.hidden = false;
  gameView.hidden = true;
}

export function showGameView(scenario) {
  gameTitle.textContent = scenario.title;
  gameUnit.textContent = scenario.unit;
  gamePrompt.textContent = scenario.prompt;

  listView.hidden = true;
  gameView.hidden = false;
  bidInput.focus();
}

export function bindBackControl(onBack) {
  backButton.addEventListener("click", onBack);
}

export function bindQuoteForm(onSubmitQuote) {
  quoteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmitQuote({
      bid: bidInput.value,
      ask: askInput.value
    });
  });
}

export function bindQuizForm(onSubmitAnswers) {
  quizForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const selectedPosition = quizForm.querySelector("input[name='position-answer']:checked");

    onSubmitAnswers({
      positionAnswer: selectedPosition ? selectedPosition.value : "",
      pnlAnswer: pnlAnswerInput.value
    });
  });
}

export function bindResultsControls({ onPlayAgain, onChooseAnotherScenario }) {
  playAgainButton.addEventListener("click", onPlayAgain);
  chooseAnotherScenarioButton.addEventListener("click", onChooseAnotherScenario);
}

export function resetGameView() {
  quoteForm.reset();
  quoteError.textContent = "";
  roundResult.textContent = "";
  roundHint.textContent = "";
  roundLog.replaceChildren();
  trueValueResult.textContent = "";
  quizFeedback.replaceChildren();
  tradeSummary.replaceChildren();
  clearQuizAnswer();
  resultsSection.hidden = true;
  setQuoteFormDisabled(false);
}

export function renderGameStatus(state) {
  const displayRound = Math.min(state.round, state.maxRounds);
  gameStatus.replaceChildren(
    createStatusStat("Round", `${displayRound} of ${state.maxRounds}`),
    createStatusStat("Position", describePosition(state.position)),
    createStatusStat("Cash", formatMoney(state.cash))
  );
}

export function showQuoteError(message) {
  quoteError.textContent = message;
}

export function clearQuoteError() {
  quoteError.textContent = "";
}

export function showRoundResult(message) {
  roundResult.textContent = message;
}

export function showRoundHint(message) {
  roundHint.textContent = message;
}

export function appendRoundLog(trade, message) {
  const item = document.createElement("li");
  item.textContent = `Round ${trade.round}: bid ${trade.bid}, ask ${trade.ask}. ${message}`;
  roundLog.append(item);
}

export function disableQuoteForm() {
  setQuoteFormDisabled(true);
}

export function showResultsSection(scenario) {
  trueValueResult.textContent = `True value: ${formatDisplayNumber(scenario.trueValue)} ${scenario.unit}`;
  resultsSection.hidden = false;
  quizForm.hidden = false;
  quizFeedback.replaceChildren();
  tradeSummary.replaceChildren();
}

export function renderQuizFeedback({
  positionCorrect,
  pnlCorrect,
  correctPositionLabel,
  correctPnl,
  positionAnswerLabel,
  pnlAnswer
}) {
  quizFeedback.replaceChildren();

  const positionFeedback = document.createElement("p");
  positionFeedback.className = "feedback-item";
  const positionResult = document.createElement("span");
  positionResult.className = positionCorrect ? "feedback-correct" : "feedback-incorrect";
  positionResult.textContent = positionCorrect ? "Position correct." : "Position incorrect.";
  positionFeedback.append(
    positionResult,
    ` You answered ${positionAnswerLabel || "no answer"}. Correct position: ${correctPositionLabel}.`
  );

  const pnlFeedback = document.createElement("p");
  pnlFeedback.className = "feedback-item";
  const pnlResult = document.createElement("span");
  pnlResult.className = pnlCorrect ? "feedback-correct" : "feedback-incorrect";
  pnlResult.textContent = pnlCorrect ? "PnL correct." : "PnL incorrect.";
  pnlFeedback.append(
    pnlResult,
    ` You answered ${pnlAnswer}. Correct PnL: ${formatMoney(correctPnl)}.`
  );

  quizFeedback.append(positionFeedback, pnlFeedback);
}

export function renderTradeSummary(state, finalPositionLabel, finalPnl) {
  tradeSummary.replaceChildren();

  const table = document.createElement("table");
  table.className = "trade-history-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Round", "Bid", "Ask", "Outcome", "Position after", "Cash after"].forEach((heading) => {
    const th = document.createElement("th");
    th.textContent = heading;
    headerRow.append(th);
  });
  thead.append(headerRow);

  const tbody = document.createElement("tbody");
  state.trades.forEach((trade) => {
    const row = document.createElement("tr");
    [
      trade.round,
      trade.bid,
      trade.ask,
      tradeOutcomeMessage(trade),
      trade.positionAfter,
      formatMoney(trade.cashAfter)
    ].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = String(value);
      row.append(cell);
    });
    tbody.append(row);
  });

  table.append(thead, tbody);

  const finalLine = document.createElement("p");
  finalLine.className = "final-summary";
  finalLine.textContent = `Final position: ${finalPositionLabel}. Final PnL: ${formatMoney(finalPnl)}.`;

  tradeSummary.append(table, finalLine);
}
