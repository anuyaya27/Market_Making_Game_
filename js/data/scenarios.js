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
  },
  {
    id: "everest-height",
    title: "Mount Everest Height",
    prompt: "What is the official height of Mount Everest above sea level?",
    unit: "meters",
    // Verified: Nepal and China joint survey, announced 8 Dec 2020.
    trueValue: 8848.86,
    source: "Nepal and China joint survey, 8 December 2020"
  },
  {
    id: "great-wall-length",
    title: "Great Wall of China Length",
    prompt: "What is the official total length of the Great Wall of China across all dynasties?",
    unit: "kilometers",
    // Verified: China State Administration of Cultural Heritage, 5 June 2012.
    trueValue: 21196.18,
    source: "China State Administration of Cultural Heritage survey, 5 June 2012"
  },
  {
    id: "burj-khalifa-height",
    title: "Burj Khalifa Height",
    prompt: "What is the total height of the Burj Khalifa in Dubai to its architectural tip?",
    unit: "meters",
    // Stable structure. Confirm against the Emaar or CTBUH figure.
    trueValue: 828,
    source: "Emaar / CTBUH official height"
  },
  {
    id: "earth-moon-distance",
    title: "Earth to Moon Distance",
    prompt: "What is the average distance from the Earth to the Moon?",
    unit: "kilometers",
    // Mean distance. Confirm against the NASA Moon fact sheet.
    trueValue: 384400,
    source: "NASA, mean Earth to Moon distance"
  },
  {
    id: "golden-gate-main-span",
    title: "Golden Gate Bridge Main Span",
    prompt: "What is the length of the main suspension span of the Golden Gate Bridge?",
    unit: "meters",
    // 4,200 ft. Confirm against the Golden Gate Bridge District.
    trueValue: 1280,
    source: "Golden Gate Bridge Highway and Transportation District"
  },
  {
    id: "earth-equatorial-circumference",
    title: "Earth Equatorial Circumference",
    prompt: "What is the circumference of the Earth around the equator?",
    unit: "kilometers",
    // Confirm against the NASA Earth fact sheet.
    trueValue: 40075,
    source: "NASA Earth fact sheet"
  },
  {
    id: "un-member-states",
    title: "UN Member States",
    prompt: "How many member states does the United Nations currently have?",
    unit: "states",
    // Changes only rarely. Confirm against un.org current membership.
    trueValue: 193,
    source: "United Nations current membership"
  },
  {
    id: "speed-of-light",
    title: "Speed of Light",
    prompt: "What is the speed of light in a vacuum?",
    unit: "kilometers per second",
    // Defined SI constant, exact. 299,792,458 m/s.
    trueValue: 299792.458,
    source: "SI defined constant"
  },
  {
    id: "trees-on-earth",
    title: "Trees on Earth",
    prompt: "Roughly how many trees are estimated to be on Earth?",
    unit: "trees",
    // Estimate, not exact: Crowther et al., Nature 2015 (about 3.04 trillion).
    trueValue: 3040000000000,
    source: "Crowther et al., Nature 2015"
  },
  {
    id: "living-languages",
    title: "Living Languages",
    prompt: "About how many living languages are spoken in the world today?",
    unit: "languages",
    // Estimate, varies by classification: Ethnologue (about 7,170).
    trueValue: 7170,
    source: "Ethnologue, 2024 edition"
  },
  {
    id: "cells-in-human-body",
    title: "Cells in the Human Body",
    prompt: "Roughly how many cells are in the adult human body?",
    unit: "cells",
    // Estimate, not exact: Bianchi et al. 2013 (about 37.2 trillion).
    trueValue: 37000000000000,
    source: "Bianchi et al., Annals of Human Biology 2013"
  },
  {
    id: "earth-sun-distance",
    title: "Earth to Sun Distance",
    prompt: "What is the average distance from the Earth to the Sun, one astronomical unit?",
    unit: "kilometers",
    // 1 AU. Confirm against the NASA Sun fact sheet.
    trueValue: 149600000,
    source: "NASA, one astronomical unit"
  },
  {
    id: "periodic-table-elements",
    title: "Periodic Table Elements",
    prompt: "How many elements are on the periodic table?",
    unit: "elements",
    // Confirm against IUPAC. 118 confirmed elements.
    trueValue: 118,
    source: "IUPAC"
  },
  {
    id: "bones-adult-body",
    title: "Bones in the Adult Body",
    prompt: "How many bones are in the adult human body?",
    unit: "bones",
    // Standard anatomical count.
    trueValue: 206,
    source: "Standard anatomy reference"
  },
  {
    id: "piano-keys",
    title: "Piano Keys",
    prompt: "How many keys are on a standard full-size piano?",
    unit: "keys",
    // Standard 88-key piano.
    trueValue: 88,
    source: "Standard piano specification"
  },
  {
    id: "marathon-distance",
    title: "Marathon Distance",
    prompt: "What is the official distance of a marathon?",
    unit: "kilometers",
    // Fixed by World Athletics. 26.219 miles.
    trueValue: 42.195,
    source: "World Athletics official distance"
  },
  {
    id: "moon-diameter",
    title: "Moon Diameter",
    prompt: "What is the diameter of the Moon?",
    unit: "kilometers",
    // Confirm against the NASA Moon fact sheet.
    trueValue: 3474,
    source: "NASA Moon fact sheet"
  }
];
