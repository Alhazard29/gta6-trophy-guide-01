/* Leonida Legend — GTA VI trophy guide & tracker.
   Classic script (no modules, no fetch when the inlined data file is
   present), so the guide renders from file:// as well as over HTTP.
   Data comes from data/trophies-data.js (window.TROPHY_DATA); if that
   file is ever missing, the app falls back to fetching data/trophies.json
   from its own server. It makes no other request, ever. */

'use strict';

/* Where each guide's facts come from. Links open only when the reader
   follows them; the app itself fetches nothing from these sites. */
var SOURCES = {
  outputlag: {
    label: 'Output Lag — GTA 6 Trophy List',
    url: 'https://outputlag.com/guides/gta-6-trophy-list/'
  },
  planetgta6: {
    label: 'planetgta6 — GTA 6 Trophies',
    url: 'https://www.planetgta6.com/en/gta-6-trophies/'
  }
};

var STORAGE_KEY = 'leonida-legend-progress-v1';

/* Filter chips: kind -> label and test. "online" is deliberately absent:
   all 55 trophies are single-player, so there is nothing to filter by. */
var KIND_FILTERS = [
  { kind: 'all', label: 'All', test: function () { return true; } },
  { kind: 'story', label: 'Story', test: function (t) { return t.category === 'story'; } },
  { kind: 'missable', label: 'Missable', test: function (t) { return t.missable === true; } },
  { kind: 'collectible', label: 'Collectibles', test: function (t) { return t.category === 'collectible'; } },
  { kind: 'activity', label: 'Activities', test: function (t) { return t.category === 'activity'; } },
  { kind: 'side-story', label: 'Side stories', test: function (t) { return t.category === 'side-story'; } },
  { kind: 'robbery', label: 'Robbery', test: function (t) { return t.category === 'robbery'; } },
  { kind: 'combat', label: 'Combat', test: function (t) { return t.category === 'combat'; } },
  { kind: 'free-roam', label: 'Free-roam', test: function (t) { return t.category === 'free-roam'; } },
  { kind: 'money', label: 'Money', test: function (t) { return t.category === 'money'; } },
  { kind: 'exploration', label: 'Exploration', test: function (t) { return t.category === 'exploration'; } },
  { kind: 'completion', label: 'Completion', test: function (t) { return t.category === 'completion'; } },
  { kind: 'unconfirmed', label: 'Unconfirmed method', test: function (t) { return t.methodConfirmed === false; } }
];

var state = {
  trophies: [],
  earned: {},       /* id -> true */
  spoilersHidden: true,
  kind: 'all',
  status: 'all',
  query: ''
};

function $(id) { return document.getElementById(id); }

function el(tag, className, text) {
  var node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

/* ---------- saved progress ---------- */

function loadSavedProgress() {
  var saved = null;
  try { saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { saved = null; }
  if (!saved || typeof saved !== 'object') return;
  if (Array.isArray(saved.earned)) {
    saved.earned.forEach(function (id) { state.earned[id] = true; });
  }
  if (typeof saved.spoilersHidden === 'boolean') state.spoilersHidden = saved.spoilersHidden;
}

function saveProgress() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      earned: Object.keys(state.earned).sort(),
      spoilersHidden: state.spoilersHidden
    }));
  } catch (e) { /* private mode or file:// without storage: progress just won't persist */ }
}

/* ---------- data ---------- */

function dataReady(data) {
  state.trophies = (data && Array.isArray(data.trophies)) ? data.trophies : [];
  loadSavedProgress();
  renderFilterChips();
  bindControls();
  renderAll();
}

function loadTrophyData() {
  if (window.TROPHY_DATA && Array.isArray(window.TROPHY_DATA.trophies)) {
    dataReady(window.TROPHY_DATA);
    return;
  }
  /* Fallback for a server that serves the JSON: never runs from file://,
     where the inlined data file above already loaded. */
  fetch('data/trophies.json')
    .then(function (r) { return r.json(); })
    .then(dataReady)
    .catch(function () {
      $('trophy-list').textContent = 'Could not load the trophy list. ' +
        'Check that data/trophies-data.js sits next to this page.';
    });
}

/* ---------- filtering ---------- */

function kindFilterOf(kind) {
  for (var i = 0; i < KIND_FILTERS.length; i++) {
    if (KIND_FILTERS[i].kind === kind) return KIND_FILTERS[i];
  }
  return KIND_FILTERS[0];
}

function trophyMatches(trophy) {
  if (!kindFilterOf(state.kind).test(trophy)) return false;
  if (state.status === 'earned' && !state.earned[trophy.id]) return false;
  if (state.status === 'unearned' && state.earned[trophy.id]) return false;
  if (state.query) {
    var hay = (trophy.name + ' ' + trophy.description + ' ' + trophy.guide).toLowerCase();
    if (hay.indexOf(state.query) === -1) return false;
  }
  return true;
}

function spoilerHides(trophy) {
  return state.spoilersHidden && trophy.category === 'story' && !state.earned[trophy.id];
}

/* ---------- rendering ---------- */

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function kindLabel(trophy) {
  var labels = {
    platinum: 'Platinum', story: 'Story', completion: 'Completion',
    activity: 'Activity', 'side-story': 'Side story', collectible: 'Collectible',
    robbery: 'Robbery', combat: 'Combat', 'free-roam': 'Free-roam',
    exploration: 'Exploration', money: 'Money'
  };
  return labels[trophy.category] || trophy.category;
}

function renderTrophyCard(trophy) {
  var card = el('article', 'trophy-card');
  if (state.earned[trophy.id]) card.classList.add('earned');
  if (trophy.missable) card.classList.add('missable-card');
  if (trophy.methodConfirmed === false) card.classList.add('unconfirmed-card');

  var top = el('div', 'trophy-top');
  var name = el('h3', 'trophy-name');
  if (spoilerHides(trophy)) {
    name.textContent = 'Hidden story trophy';
    name.classList.add('spoiler-hidden-name');
  } else {
    name.textContent = trophy.name;
  }
  top.appendChild(name);
  var badge = el('span', 'grade-badge grade-' + trophy.grade, gradeLabel(trophy.grade));
  top.appendChild(badge);
  card.appendChild(top);

  if (spoilerHides(trophy)) {
    card.appendChild(el('p', 'trophy-desc', 'Complete the story to reveal this trophy.'));
  } else {
    card.appendChild(el('p', 'trophy-desc', trophy.description));
    card.appendChild(el('p', 'trophy-guide', trophy.guide));
  }

  var meta = el('div', 'trophy-meta');
  meta.appendChild(el('span', 'tag', kindLabel(trophy)));
  if (trophy.hidden) meta.appendChild(el('span', 'tag hidden-tag', 'Hidden on PSN'));
  if (trophy.missable) meta.appendChild(el('span', 'tag missable', 'MISSABLE — only one on the list'));
  if (trophy.methodConfirmed === false) meta.appendChild(el('span', 'tag unconfirmed', 'Method unconfirmed'));
  if (typeof trophy.gamerscore === 'number' && trophy.gamerscore > 0) {
    meta.appendChild(el('span', 'tag', trophy.gamerscore + 'G'));
  }
  card.appendChild(meta);

  if (!spoilerHides(trophy) && Array.isArray(trophy.sources) && trophy.sources.length) {
    var src = el('p', 'trophy-sources', 'Sources: ');
    trophy.sources.forEach(function (key, i) {
      var info = SOURCES[key];
      if (!info) return;
      if (i > 0) src.appendChild(document.createTextNode(' · '));
      var a = el('a', null, info.label);
      a.href = info.url;
      a.rel = 'noopener';
      src.appendChild(a);
    });
    card.appendChild(src);
  }

  var label = el('label', 'earned-label');
  var box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = !!state.earned[trophy.id];
  box.setAttribute('aria-label', 'Mark ' + trophy.name + ' as earned');
  box.addEventListener('change', function () {
    if (box.checked) { state.earned[trophy.id] = true; } else { delete state.earned[trophy.id]; }
    saveProgress();
    renderAll();
  });
  label.appendChild(box);
  label.appendChild(document.createTextNode(state.earned[trophy.id] ? 'Earned' : 'Mark as earned'));
  card.appendChild(label);

  return card;
}

function renderTrophyList() {
  var list = $('trophy-list');
  while (list.firstChild) list.removeChild(list.firstChild);
  var shown = 0;
  state.trophies.forEach(function (trophy) {
    if (!trophyMatches(trophy)) return;
    list.appendChild(renderTrophyCard(trophy));
    shown++;
  });
  if (shown === 0) {
    list.appendChild(el('p', 'empty-note', 'No trophies match these filters. Clear the search or pick another kind.'));
  }
  $('counts-line').textContent = 'Showing ' + shown + ' of ' + state.trophies.length + ' trophies.';
}

function renderProgress() {
  var total = state.trophies.length;
  var earnedCount = 0;
  var byGrade = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  var score = 0;
  state.trophies.forEach(function (t) {
    if (byGrade[t.grade]) byGrade[t.grade][1]++;
    if (!state.earned[t.id]) return;
    earnedCount++;
    if (byGrade[t.grade]) byGrade[t.grade][0]++;
    score += (typeof t.gamerscore === 'number') ? t.gamerscore : 0;
  });
  var pct = total ? Math.round((earnedCount / total) * 100) : 0;
  $('earned-count').textContent = earnedCount + ' / ' + total;
  $('earned-percent').textContent = '(' + pct + '%)';
  var bar = $('progress-bar');
  bar.setAttribute('aria-valuenow', String(earnedCount));
  bar.setAttribute('aria-valuemax', String(total));
  $('progress-fill').style.width = pct + '%';
  $('grade-line').textContent =
    'Platinum ' + byGrade.platinum[0] + '/' + byGrade.platinum[1] +
    ' · Gold ' + byGrade.gold[0] + '/' + byGrade.gold[1] +
    ' · Silver ' + byGrade.silver[0] + '/' + byGrade.silver[1] +
    ' · Bronze ' + byGrade.bronze[0] + '/' + byGrade.bronze[1];
  $('score-line').textContent = 'Gamerscore earned: ' + score + ' / 1,000';
}

function renderFilterChips() {
  var wrap = $('filter-chips');
  while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
  KIND_FILTERS.forEach(function (f) {
    var chip = el('button', 'chip', f.label);
    chip.type = 'button';
    chip.setAttribute('aria-pressed', state.kind === f.kind ? 'true' : 'false');
    chip.addEventListener('click', function () {
      state.kind = f.kind;
      renderFilterChips();
      renderTrophyList();
    });
    wrap.appendChild(chip);
  });
}

function renderAll() {
  renderProgress();
  renderTrophyList();
}

/* ---------- export / import / reset ---------- */

function exportProgress() {
  var payload = {
    app: 'leonida-legend-gta6-trophy-guide',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: Object.keys(state.earned).sort(),
    spoilersHidden: state.spoilersHidden
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

function importProgressFile(file) {
  var note = $('import-note');
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var data = JSON.parse(String(reader.result));
      if (!data || !Array.isArray(data.earned)) throw new Error('no earned list');
      var known = {};
      state.trophies.forEach(function (t) { known[t.id] = true; });
      var fresh = {};
      var imported = 0;
      var skipped = 0;
      data.earned.forEach(function (id) {
        if (known[id]) { fresh[id] = true; imported++; } else { skipped++; }
      });
      state.earned = fresh;
      if (typeof data.spoilersHidden === 'boolean') {
        state.spoilersHidden = data.spoilersHidden;
        $('spoiler-toggle').checked = state.spoilersHidden;
      }
      saveProgress();
      renderAll();
      note.classList.remove('error');
      note.textContent = 'Imported ' + imported + ' earned trophies' +
        (skipped ? ' (' + skipped + ' unknown entries skipped)' : '') + '.';
    } catch (e) {
      note.classList.add('error');
      note.textContent = 'That file is not a progress export from this guide.';
    }
  };
  reader.onerror = function () {
    note.classList.add('error');
    note.textContent = 'Could not read that file.';
  };
  reader.readAsText(file);
}

/* ---------- controls ---------- */

function bindControls() {
  var search = $('search');
  search.addEventListener('input', function () {
    state.query = search.value.trim().toLowerCase();
    renderTrophyList();
  });
  $('status-filter').addEventListener('change', function (e) {
    state.status = e.target.value;
    renderTrophyList();
  });
  var spoiler = $('spoiler-toggle');
  spoiler.checked = state.spoilersHidden;
  spoiler.addEventListener('change', function () {
    state.spoilersHidden = spoiler.checked;
    saveProgress();
    renderTrophyList();
  });
  $('export-button').addEventListener('click', exportProgress);
  var fileInput = $('import-file');
  $('import-button').addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    if (fileInput.files && fileInput.files[0]) importProgressFile(fileInput.files[0]);
    fileInput.value = '';
  });
  $('reset-button').addEventListener('click', function () {
    if (!window.confirm('Clear every earned trophy and start the checklist over?')) return;
    state.earned = {};
    saveProgress();
    renderAll();
    $('import-note').classList.remove('error');
    $('import-note').textContent = 'Progress cleared.';
  });
}

/* ---------- start ---------- */

loadTrophyData();
