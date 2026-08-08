// Entry point for wiring data, engine logic, and UI modules.

import { scenarios } from "./data/scenarios.js";
import {
  bindBackControl,
  renderScenarioList,
  showGameView,
  showScenarioList
} from "./ui.js";

console.log("Market Making Trainer startup", { scenarioCount: scenarios.length });

renderScenarioList(scenarios, (scenario) => {
  showGameView(scenario);
});

bindBackControl(() => {
  showScenarioList();
});

showScenarioList();
