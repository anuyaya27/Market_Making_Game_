// DOM rendering and UI event handling for the trainer.

const listView = document.querySelector("#scenario-list-view");
const gameView = document.querySelector("#game-view");
const scenarioList = document.querySelector("#scenario-list");
const gameTitle = document.querySelector("#game-title");
const gameUnit = document.querySelector("#game-unit");
const gamePrompt = document.querySelector("#game-prompt");
const backButton = document.querySelector("#back-to-list");

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
  backButton.focus();
}

export function bindBackControl(onBack) {
  backButton.addEventListener("click", onBack);
}
