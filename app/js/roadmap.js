// The roadmap to the Platinum, built from the official trophy descriptions:
// which story chapters and missions, which collectibles and counts, in what
// order. Trophy ids must match app/data/trophies.json. "Collectibles" here
// means trophies whose official description asks for a set of things found
// across Leonida (spots, locations, vehicles, card sets, properties).

window.ROADMAP_STAGES = [
  {
    title: 'Play the story — Chapters 1 to 4 and the final mission',
    blurb:
      'Twelve story trophies unlock simply by finishing missions and chapters. ' +
      'Do them in order; nothing here can be missed except one thing in stage 2.',
    trophyIds: [
      'just-like-paradise',
      'paradise-lost',
      'tits-ass-drug-money',
      'vice-city-baby',
      'top-of-the-world-ma',
      'you-gotta-know-when-to-get-off',
      'trust',
      'break-the-bank',
      'family-matters',
      'dwnfall',
      'hi-jacked',
      'snow-storm',
    ],
  },
  {
    title: 'The one missable trophy — meditate as you go',
    blurb:
      'Positive Mental Attitude needs 18 meditation spots across Leonida, and ' +
      'one of them — Lucia’s balcony — is only available in Chapter 1. The game ' +
      'has no mission replay, so meditate at every spot you pass and keep a manual ' +
      'save at the start of every chapter.',
    trophyIds: ['positive-mental-attitude'],
  },
  {
    title: 'Strangers and side characters',
    blurb:
      'Finish the final mission for each side character — Andy, Kenton, Billy, ' +
      'Randy and Tyrone — and complete 8 mission strands for strangers across Leonida.',
    trophyIds: [
      'road-to-rehabilitation',
      'this-was-no-boat-accident',
      'the-lone-rider',
      'supply-and-demand',
      'spin-on-this',
      'strangers-and-freaks',
      'fair-game',
    ],
  },
  {
    title: 'Collectibles and exploration',
    blurb:
      'Sweep Leonida for the counted collections: 100 WAiNK locations, 100 vehicles ' +
      'discovered, all of the map, 3 collectible card sets, 8 garage properties and ' +
      '10 vehicles registered to the Scooter Bros app.',
    trophyIds: [
      'you-wainker',
      'whip-it-good',
      'the-goodtime-state',
      'dont-touch-my-deck',
      'little-boxes',
      'on-the-spot',
    ],
  },
  {
    title: 'Activities and challenges',
    blurb:
      'The long grinds: 250 stunts, 42 Shooting Range gold medals, 20 different race ' +
      'wins, a Top Fun drone race win at every location, 50 challenges, plus fishing, ' +
      'the arcade, and trying each activity type once.',
    trophyIds: [
      'cunning-stunts',
      'the-shootist',
      'earn-cash-not-kudos',
      'top-fun',
      'one-last-thing',
      'master-of-none',
      'baited-my-tackle',
      'stick-fiddler',
    ],
  },
  {
    title: 'Robberies, combat and money',
    blurb:
      'Robberies open up in Chapters 3 and 4: shops back-to-back, a jewelry store ' +
      'undetected, an armored truck, 5 bank vaults and one illegal operation per gang. ' +
      'Alongside them, launder $250,000 of Marked Bills and spend $100,000 in shops.',
    trophyIds: [
      'hot-together',
      'retail-therapy',
      'sneakthief',
      'a-classic-blitz-play',
      'maximum-withdrawal',
      'pest-control',
      'dime-on-the-dollar',
      'treat-yo-self',
      'gunslinger',
      'challenging-tank',
    ],
  },
  {
    title: 'Odd ones out, then 100% completion',
    blurb:
      'The remaining one-off trophies — a cocktail on Ocean Beach, the bowling alley, ' +
      'the showroom, the unscheduled departure at VCIA — and the five hidden trophies ' +
      'whose methods are still unconfirmed at launch. Finish with A Long Road ' +
      '(100% completion) and the Platinum pops.',
    trophyIds: [
      'in-the-beginning',
      'capital-offense',
      'lets-go-bowling',
      'personal-best',
      'actions-speak-louder',
      'bad-luck-i-guess',
      'the-truth-is-out-there',
      'ten-pin',
      'catch-me-if-you-can',
      'a-long-road',
      'vice-got-a-price',
    ],
  },
];

// Trophy ids whose official description asks for a collection of things found
// across Leonida — the "Collectibles" filter.
window.COLLECTIBLE_IDS = new Set([
  'positive-mental-attitude',
  'dont-touch-my-deck',
  'you-wainker',
  'whip-it-good',
  'the-goodtime-state',
  'little-boxes',
  'on-the-spot',
]);
