// Leonida Legend — GTA 6 trophy guide & tracker.
// Loads app/data/trophies.json (the only fetch, a file of this app), renders
// the checklist, the roadmap and the filters, and saves progress in
// localStorage. No network request is ever made.

import { GUIDE_SOURCES } from './sources.js';
import { ROADMAP_STAGES, COLLECTIBLE_IDS } from './roadmap.js';

const STORAGE_KEY = 'gta6-trophy-guide-v1';
const DATA_URL = 'data/trophies.json';
const PLATINUM_ID = 'vice-got-a-price';

const earnedCountEl = document.getElementById('earnedCount');
const gradeCountsEl = document.getElementById('gradeCounts');
const progressFillEl = document.getElementById('progressFill');
const progressBarWrapEl = document.getElementById('progressBarWrap');
const platinumLineEl = document.getElementById('platinumLine');
const searchInputEl = document.getElementById('searchInput');
const filterRowEl = document.getElementById('filterRow');
const spoilerToggleEl = document.getElementById('spoilerToggle');
const exportBtnEl = document.getElementById('exportBtn');
const importBtnEl = document.getElementById('importBtn');
const importFileEl = document.getElementById('importFile');
const resetBtnEl = document.getElementById('resetBtn');
const filterHintEl = document.getElementById('filterHint');
const roadmapStagesEl = document.getElementById('roadmapStages');
const trophyCardsEl = document.getElementById('trophyCards');
const emptyStateEl = document.getElementById('emptyState');
const listHeadingEl = document.getElementById('listHeading');

let trophies = [];
let byId = new Map();
let progress = loadSavedProgress();
let activeFilter = 'all';
let searchText = '';

function loadSavedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshProgress();
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
      hideSpoilers: parsed.hideSpoilers !== false,
    };
  } catch {
    return freshProgress();
  }
}

function freshProgress() {
  return { earned: [], counts: {}, hideSpoilers: true };
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private mode or a full store: the checklist still works for this visit.
  }
}

function isEarned(trophy) {
  return progress.earned.includes(trophy.id);
}

function setEarned(trophy, earned) {
  const list = progress.earned;
  const at = list.indexOf(trophy.id);
  if (earned && at === -1) list.push(trophy.id);
  if (!earned && at !== -1) list.splice(at, 1);
  saveProgress();
}

function getCount(trophy) {
  return progress.counts[trophy.id] || 0;
}

function setCount(trophy, value) {
  const clamped = Math.max(0, Math.min(trophy.target || 0, value));
  progress.counts[trophy.id] = clamped;
  if (trophy.target && clamped >= trophy.target) setEarned(trophy, true);
  saveProgress();
}

function isStoryTrophy(trophy) {
  return trophy.category === 'story';
}

function isSpoilerHidden(trophy) {
  return (
    progress.hideSpoilers &&
    isStoryTrophy(trophy) &&
    trophy.id !== PLATINUM_ID &&
    !isEarned(trophy)
  );
}

function trophyKinds(trophy) {
  const kinds = new Set([trophy.category]);
  if (trophy.missable) kinds.add('missable');
  if (COLLECTIBLE_IDS.has(trophy.id)) kinds.add('collectibles');
  return kinds;
}

function trophyMatchesFilter(trophy) {
  if (activeFilter === 'all') return true;
  if (activeFilter === 'earned') return isEarned(trophy);
  if (activeFilter === 'not-earned') return !isEarned(trophy);
  if (activeFilter === 'online') return false; // No online trophies in this list.
  if (activeFilter === 'story') return isStoryTrophy(trophy);
  if (activeFilter === 'missable') return !!trophy.missable;
  if (activeFilter === 'collectibles') return COLLECTIBLE_IDS.has(trophy.id);
  if (activeFilter === 'activities') return trophy.category === 'activities';
  return true;
}

function trophyMatchesSearch(trophy) {
  if (!searchText) return true;
  const haystack = [trophy.name, trophy.description, trophy.guide, trophy.grade]
    .join(' ')
    .toLowerCase();
  return haystack.includes(searchText);
}

function gradeClass(grade) {
  return 'grade-' + grade.toLowerCase();
}

function sourceLinks(trophy) {
  const keys = trophy.guideSources || [];
  return keys
    .map((key) => GUIDE_SOURCES[key])
    .filter(Boolean)
    .map(
      (source) =>
        `<a href="${source.url}" target="_blank" rel="noopener">${source.name}</a>`,
    );
}

function buildTrophyCard(trophy) {
  const li = document.createElement('li');
  li.className = 'card' + (isEarned(trophy) ? ' earned' : '');
  li.id = 'trophy-' + trophy.id;

  const head = document.createElement('div');
  head.className = 'card-head';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = isEarned(trophy);
  checkbox.setAttribute('aria-label', 'Earned: ' + trophy.name);
  checkbox.addEventListener('change', () => {
    setEarned(trophy, checkbox.checked);
    renderAll();
  });
  head.appendChild(checkbox);

  const title = document.createElement('div');
  title.className = 'card-title';
  const nameEl = document.createElement('h3');
  if (isSpoilerHidden(trophy)) {
    nameEl.textContent = 'Hidden story trophy';
    nameEl.classList.add('hidden-trophy');
  } else {
    nameEl.textContent = trophy.name;
    if (isEarned(trophy)) nameEl.classList.add('earned-name');
  }
  title.appendChild(nameEl);
  head.appendChild(title);

  const gradeEl = document.createElement('span');
  gradeEl.className = 'grade ' + gradeClass(trophy.grade);
  gradeEl.textContent = trophy.grade;
  head.appendChild(gradeEl);

  li.appendChild(head);

  if (isSpoilerHidden(trophy)) {
    const hidden = document.createElement('p');
    hidden.className = 'hidden-trophy';
    hidden.textContent =
      'A story trophy — its name and description stay hidden until you earn it. ' +
      'Turn off “Hide story spoilers until earned” above to reveal it.';
    li.appendChild(hidden);
    return li;
  }

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = trophy.description;
  li.appendChild(official);

  const badges = document.createElement('div');
  badges.className = 'badges';
  if (trophy.missable) {
    const badge = document.createElement('span');
    badge.className = 'badge badge-missable';
    badge.textContent = 'Missable — do it before you leave Chapter 1';
    badges.appendChild(badge);
  }
  if (trophy.methodConfirmed === false) {
    const badge = document.createElement('span');
    badge.className = 'badge badge-unconfirmed';
    badge.textContent = 'Method unconfirmed at launch';
    badges.appendChild(badge);
  }
  if (trophy.category) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = trophy.category;
    badges.appendChild(badge);
  }
  if (badges.children.length) li.appendChild(badges);

  const guide = document.createElement('div');
  guide.className = 'guide';
  const guideLabel = document.createElement('span');
  guideLabel.className = 'label';
  guideLabel.textContent = 'Guide';
  guide.appendChild(guideLabel);
  const guideText = document.createElement('p');
  guideText.textContent = trophy.guide;
  guide.appendChild(guideText);
  li.appendChild(guide);

  const links = sourceLinks(trophy);
  if (links.length) {
    const sources = document.createElement('p');
    sources.className = 'sources';
    sources.innerHTML = 'Sources: ' + links.join(' · ');
    li.appendChild(sources);
  }

  if (trophy.target) {
    const counter = document.createElement('div');
    counter.className = 'counter';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', 'Decrease count for ' + trophy.name);
    const countEl = document.createElement('span');
    countEl.className = 'count';
    const label = document.createElement('span');
    label.className = 'count-label';
    label.textContent = 'of ' + trophy.target + ' — count as you go; reaching the target ticks the trophy';
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'Increase count for ' + trophy.name);
    const refreshCount = () => {
      countEl.textContent = getCount(trophy) + ' / ' + trophy.target;
    };
    minus.addEventListener('click', () => {
      setCount(trophy, getCount(trophy) - 1);
      refreshCount();
      renderAll();
    });
    plus.addEventListener('click', () => {
      setCount(trophy, getCount(trophy) + 1);
      refreshCount();
      renderAll();
    });
    refreshCount();
    counter.append(minus, countEl, plus, label);
    li.appendChild(counter);
  }

  return li;
}

function renderTrophyList() {
  trophyCardsEl.textContent = '';
  const shown = trophies.filter(
    (trophy) => trophyMatchesFilter(trophy) && trophyMatchesSearch(trophy),
  );
  for (const trophy of shown) trophyCardsEl.appendChild(buildTrophyCard(trophy));
  emptyStateEl.hidden = shown.length !== 0;
  if (activeFilter === 'online') {
    emptyStateEl.hidden = false;
    emptyStateEl.textContent =
      'No online trophies: all 55 trophies are single-player, so this filter is empty by design.';
  } else {
    emptyStateEl.textContent = 'No trophies match this filter.';
  }
  const headings = {
    all: 'All trophies',
    story: 'Story trophies',
    missable: 'Missable trophies',
    collectibles: 'Collectible trophies',
    activities: 'Activity trophies',
    online: 'Online trophies',
    earned: 'Trophies you have earned',
    'not-earned': 'Trophies still to earn',
  };
  listHeadingEl.textContent = headings[activeFilter] || 'All trophies';
  filterHintEl.textContent =
    'Showing ' + shown.length + ' of ' + trophies.length + ' trophies.';
}

function renderRoadmap() {
  roadmapStagesEl.textContent = '';
  for (const stage of ROADMAP_STAGES) {
    const stageTrophies = stage.trophyIds
      .map((id) => byId.get(id))
      .filter(Boolean);
    const earned = stageTrophies.filter(isEarned).length;
    const li = document.createElement('li');
    li.className = 'stage';
    const heading = document.createElement('h3');
    heading.textContent = stage.title;
    const blurb = document.createElement('p');
    blurb.textContent = stage.blurb;
    const stageProgress = document.createElement('p');
    stageProgress.className = 'stage-progress';
    stageProgress.textContent =
      earned + ' of ' + stageTrophies.length + ' earned in this stage';
    const names = document.createElement('ul');
    for (const trophy of stageTrophies) {
      const item = document.createElement('li');
      if (isEarned(trophy)) item.classList.add('earned');
      const link = document.createElement('a');
      link.href = '#trophy-' + trophy.id;
      link.textContent = isSpoilerHidden(trophy)
        ? 'Hidden story trophy'
        : trophy.name;
      item.appendChild(link);
      names.appendChild(item);
    }
    li.append(heading, blurb, stageProgress, names);
    roadmapStagesEl.appendChild(li);
  }
}

function renderProgress() {
  const earned = trophies.filter(isEarned).length;
  earnedCountEl.textContent = String(earned);
  progressFillEl.style.width = (earned / Math.max(1, trophies.length)) * 100 + '%';
  progressBarWrapEl.setAttribute('aria-valuenow', String(earned));
  const byGrade = {};
  for (const trophy of trophies) {
    if (!isEarned(trophy)) continue;
    byGrade[trophy.grade] = (byGrade[trophy.grade] || 0) + 1;
  }
  const totals = {};
  for (const trophy of trophies) {
    totals[trophy.grade] = (totals[trophy.grade] || 0) + 1;
  }
  gradeCountsEl.textContent = ['Platinum', 'Gold', 'Silver', 'Bronze']
    .map(
      (grade) => (byGrade[grade] || 0) + '/' + (totals[grade] || 0) + ' ' + grade,
    )
    .join(' · ');
  const platinum = byId.get(PLATINUM_ID);
  platinumLineEl.textContent =
    platinum && isEarned(platinum)
      ? 'Vice Got a Price! — the Platinum — is yours. Leonida Legend, congratulations!'
      : 'Vice Got a Price! — the Platinum — unlocks when the other 54 are earned.';
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderTrophyList();
}

function exportProgress() {
  const payload = {
    app: 'leonida-legend-gta6-trophy-guide',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: progress.earned.slice(),
    counts: { ...progress.counts },
    hideSpoilers: progress.hideSpoilers,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importProgressFile(file) {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const earned = Array.isArray(parsed.earned)
        ? parsed.earned.filter((id) => byId.has(id))
        : [];
      const counts = {};
      if (parsed.counts && typeof parsed.counts === 'object') {
        for (const [id, value] of Object.entries(parsed.counts)) {
          const trophy = byId.get(id);
          if (trophy && trophy.target && Number.isFinite(value)) {
            counts[id] = Math.max(0, Math.min(trophy.target, Math.floor(value)));
          }
        }
      }
      progress = {
        earned,
        counts,
        hideSpoilers:
          typeof parsed.hideSpoilers === 'boolean'
            ? parsed.hideSpoilers
            : progress.hideSpoilers,
      };
      spoilerToggleEl.checked = progress.hideSpoilers;
      saveProgress();
      renderAll();
      filterHintEl.textContent =
        'Imported ' + earned.length + ' earned trophies.';
    } catch {
      filterHintEl.textContent =
        'That file could not be imported — it is not a progress export from this guide.';
    }
  });
  reader.readAsText(file);
}

function wireControls() {
  searchInputEl.addEventListener('input', () => {
    searchText = searchInputEl.value.trim().toLowerCase();
    renderTrophyList();
  });
  filterRowEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    activeFilter = button.dataset.filter;
    for (const chip of filterRowEl.querySelectorAll('.chip')) {
      chip.classList.toggle('active', chip === button);
    }
    renderTrophyList();
  });
  spoilerToggleEl.addEventListener('change', () => {
    progress.hideSpoilers = spoilerToggleEl.checked;
    saveProgress();
    renderAll();
  });
  exportBtnEl.addEventListener('click', exportProgress);
  importBtnEl.addEventListener('click', () => importFileEl.click());
  importFileEl.addEventListener('change', () => {
    if (importFileEl.files && importFileEl.files[0]) {
      importProgressFile(importFileEl.files[0]);
    }
    importFileEl.value = '';
  });
  resetBtnEl.addEventListener('click', () => {
    if (
      window.confirm(
        'Reset all progress? This clears every ticked trophy and every counter in this browser.',
      )
    ) {
      progress = freshProgress();
      spoilerToggleEl.checked = progress.hideSpoilers;
      saveProgress();
      renderAll();
    }
  });
}

async function loadTrophyData() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error('Could not load ' + DATA_URL);
  const data = await response.json();
  trophies = Array.isArray(data) ? data : data.trophies;
  if (!Array.isArray(trophies) || trophies.length !== 55) {
    throw new Error('Expected 55 trophies, got ' + trophies.length);
  }
  byId = new Map(trophies.map((trophy) => [trophy.id, trophy]));
}

async function initGuide() {
  spoilerToggleEl.checked = progress.hideSpoilers;
  wireControls();
  try {
    await loadTrophyData();
  } catch (error) {
    trophyCardsEl.textContent = '';
    emptyStateEl.hidden = false;
    emptyStateEl.textContent =
      'The trophy list could not be loaded. Open this guide from its own files ' +
      '(serve app/ with a static server) and try again.';
    return;
  }
  renderAll();
}

initGuide();
