// Deterministic scenario data for estimation questions.

export const scenarios = [
  {
    id: "nyc-population-2024",
    title: "New York City Population",
    prompt: "What was the estimated population of New York City on July 1, 2024?",
    unit: "people",
    // Placeholder true value. Verify before real use.
    trueValue: 8478072,
    source: "U.S. Census QuickFacts, 2024 estimate"
  },
  {
    id: "london-population-2024",
    title: "Greater London Population",
    prompt: "What was the estimated resident population of Greater London in 2024?",
    unit: "people",
    // Placeholder true value. Verify before real use.
    trueValue: 9089736,
    source: "ONS via Nomis, 2024 estimate"
  },
  {
    id: "eiffel-tower-height",
    title: "Eiffel Tower Height",
    prompt: "What is the current height of the Eiffel Tower, including its antenna?",
    unit: "meters",
    // Placeholder true value. Verify before real use.
    trueValue: 330,
    source: "Official Eiffel Tower website"
  },
  {
    id: "statue-liberty-height",
    title: "Statue of Liberty Height",
    prompt: "What is the height from the ground to the tip of the Statue of Liberty's torch?",
    unit: "feet",
    // Placeholder true value. Verify before real use.
    trueValue: 305.083,
    source: "U.S. National Park Service"
  },
  {
    id: "mcdonalds-restaurants-2024",
    title: "McDonald's Restaurants",
    prompt: "How many McDonald's restaurants were there worldwide at year-end 2024?",
    unit: "restaurants",
    // Placeholder true value. Verify before real use.
    trueValue: 43477,
    source: "McDonald's 2024 Form 10-K"
  },
  {
    id: "starbucks-stores-2024",
    title: "Starbucks Stores",
    prompt: "How many Starbucks stores were open worldwide at the end of fiscal 2024?",
    unit: "stores",
    // Placeholder true value. Verify before real use.
    trueValue: 40199,
    source: "Starbucks FY2024 results"
  }
];
