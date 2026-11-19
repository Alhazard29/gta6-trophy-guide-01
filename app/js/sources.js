// Source directory for the trophy guides.
// The trophy data (app/data/trophies.json) cites each guide with a short key;
// this file turns each key into the source's full name and the page a reader
// can open to check it. Links are plain anchors: the app fetches nothing.

export const GUIDE_SOURCES = {
  gtavice: {
    name: 'GTAVice — Trophies & Achievements',
    url: 'https://www.gtavice.net/guides/trophies-and-achievements',
  },
  keengamer: {
    name: 'KeenGamer — GTA 6 Trophy Guide & Platinum Roadmap',
    url: 'https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/',
  },
};

// The official list itself, as PlayStation publishes it, was checked against
// both sources above: they agree on every one of the 55 names, descriptions
// and grades (1 Platinum, 2 Gold, 6 Silver, 46 Bronze).
export const OFFICIAL_LIST_NOTE =
  'Official names, descriptions and grades as published on PlayStation, ' +
  'cross-checked on GTAVice and KeenGamer.';
