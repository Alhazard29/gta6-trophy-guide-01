// Leonida Legend — GTA VI trophy guide & tracker.
// Classic script (works from file://): renders 55 trophy cards, saves checklist
// progress in localStorage, filters by kind/status/search, hides story spoilers
// until earned, and exports/imports progress as JSON. No network is used.
(function () {
  'use strict';

  var DATA = window.TROPHY_DATA || { trophies: [] };
  var TROPHIES = DATA.trophies || [];
  var STORE_KEY = 'gta6-trophy-guide-earned-v1';

  var STAGES = {
    1: { title: 'Stage 1 — Play the story', blurb: 'Main story chapters and missions, in order. The platinum starts here.' },
    2: { title: 'Stage 2 — Stranger mission strands', blurb: 'Finish the stranger strands across Leonida: Andy, Kenton, Billy, Randy, Tyrone and more.' },
    3: { title: 'Stage 3 — Collectibles and activities', blurb: 'Meditation spots, cards, races, the shooting range and the rest of the open world. Do the missable trophy here, in Chapter 1.' },
    4: { title: 'Stage 4 — Robbery, money and the platinum', blurb: 'Heists, vaults, money goals and the last clean-up trophies. Earn the other 54 and the platinum is yours.' }
  };

  var KIND_CHIPS = [
    { key: 'all', label: 'All' },
    { key: 'story', label: 'Story' },
    { key: 'missable', label: 'Missable' },
    { key: 'collectible', label: 'Collectibles' },
    { key: 'activity', label: 'Activities' },
    { key: 'robbery', label: 'Robbery' },
    { key: 'exploration', label: 'Exploration' },
    { key: 'money', label: 'Money' },
    { key: 'unconfirmed', label: 'Unconfirmed method' }
  ];

  var KIND_LABELS = {
    story: 'Story',
    activity: 'Activity',
    collectible: 'Collectible',
    robbery: 'Robbery',
    exploration: 'Exploration',
    money: 'Money',
    misc: 'Misc'
  };

  // ------------------------------------------------------------ state
  function loadEarned() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      var out = {};
      Object.keys(parsed).forEach(function (k) { out[k] = true; });
      return out;
    } catch (e) {
      return {};
    }
  }

  function saveEarned() {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(earned));
    } catch (e) {
      // Storage unavailable (private mode, blocked cookies): progress lives
      // only until the page closes. Nothing else breaks.
    }
  }

  var earned = loadEarned();
  var query = '';
  var statusFilter = 'all';
  var kindFilter = 'all';
  var spoilerOn = true;

  function isEarned(t) { return !!earned[String(t.id)]; }
  function isStory(t) { return t.kind === 'story'; }
  function isSpoilerHidden(t) { return spoilerOn && isStory(t) && !isEarned(t); }

  // ------------------------------------------------------------ helpers
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function gradeLabel(grade) {
    return grade.charAt(0).toUpperCase() + grade.slice(1);
  }

  function fmt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function trophyMatches(t) {
    if (statusFilter === 'earned' && !isEarned(t)) return false;
    if (statusFilter === 'unearned' && isEarned(t)) return false;
    if (kindFilter === 'missable' && !t.missable) return false;
    if (kindFilter === 'unconfirmed' && t.methodConfirmed) return false;
    if (kindFilter !== 'all' && kindFilter !== 'missable' && kindFilter !== 'unconfirmed' && t.kind !== kindFilter) return false;
    if (query) {
      var hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (hay.indexOf(query) === -1) return false;
    }
    return true;
  }

  // ------------------------------------------------------------ progress
  function renderProgress() {
    var total = TROPHIES.length;
    var got = TROPHIES.filter(isEarned).length;
    var gradeTotals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    var gradeGot = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    var scoreGot = 0;
    var scoreTotal = 0;
    TROPHIES.forEach(function (t) {
      gradeTotals[t.grade] = (gradeTotals[t.grade] || 0) + 1;
      scoreTotal += t.gamerscore || 0;
      if (isEarned(t)) {
        gradeGot[t.grade] = (gradeGot[t.grade] || 0) + 1;
        scoreGot += t.gamerscore || 0;
      }
    });
    document.getElementById('progress-count').textContent = got + ' / ' + total + ' trophies earned';
    document.getElementById('progress-fill').style.width = (total ? Math.round(got / total * 100) : 0) + '%';
    document.getElementById('progress-bar').setAttribute('aria-valuenow', String(got));
    document.getElementById('grade-line').textContent =
      'Platinum ' + gradeGot.platinum + '/' + gradeTotals.platinum +
      ' · Gold ' + gradeGot.gold + '/' + gradeTotals.gold +
      ' · Silver ' + gradeGot.silver + '/' + gradeTotals.silver +
      ' · Bronze ' + gradeGot.bronze + '/' + gradeTotals.bronze;
    document.getElementById('score-line').textContent = 'Gamerscore earned: ' + fmt(scoreGot) + ' / ' + fmt(scoreTotal);
  }

  // ------------------------------------------------------------ roadmap
  function renderRoadmap() {
    var box = document.getElementById('roadmap-stages');
    box.textContent = '';
    [1, 2, 3, 4].forEach(function (stage) {
      var members = TROPHIES.filter(function (t) { return t.roadmapStage === stage; });
      if (!members.length) return;
      var wrap = el('div', 'stage');
      var head = el('h3');
      head.appendChild(document.createTextNode(STAGES[stage].title + ' '));
      var count = el('span', 'count', '(' + members.length + ' trophies)');
      head.appendChild(count);
      wrap.appendChild(head);
      wrap.appendChild(el('p', null, STAGES[stage].blurb));
      var names = members.map(function (t) {
        return isSpoilerHidden(t) ? 'Hidden story trophy' : t.name;
      });
      wrap.appendChild(el('p', null, names.join(' · ')));
      box.appendChild(wrap);
    });
  }

  // ------------------------------------------------------------ trophy list
  function renderChips() {
    var box = document.getElementById('kind-chips');
    box.textContent = '';
    KIND_CHIPS.forEach(function (chip) {
      var btn = el('button', 'chip' + (kindFilter === chip.key ? ' active' : ''), chip.label);
      btn.type = 'button';
      btn.setAttribute('aria-pressed', kindFilter === chip.key ? 'true' : 'false');
      btn.addEventListener('click', function () {
        kindFilter = chip.key;
        renderChips();
        renderList();
      });
      box.appendChild(btn);
    });
  }

  function renderList() {
    var list = document.getElementById('trophy-list');
    list.textContent = '';
    var shown = 0;
    TROPHIES.forEach(function (t) {
      if (!trophyMatches(t)) return;
      shown++;
      var hidden = isSpoilerHidden(t);
      var card = el('article', 'card grade-' + t.grade +
        (isEarned(t) ? ' earned' : '') +
        (t.missable ? ' missable' : '') +
        (!t.methodConfirmed ? ' unconfirmed' : ''));

      var head = el('div', 'card-head');
      head.appendChild(el('h3', null, hidden ? 'Hidden story trophy' : t.name));
      head.appendChild(el('span', 'badge ' + t.grade, gradeLabel(t.grade)));
      head.appendChild(el('span', 'score', '+' + (t.gamerscore || 0) + ' GS'));
      card.appendChild(head);

      if (hidden) {
        card.appendChild(el('p', 'hidden-note', 'Hidden until earned — turn the spoiler setting off to reveal this story trophy.'));
      } else {
        card.appendChild(el('p', 'desc', t.description));
      }
      card.appendChild(el('p', 'guide', t.guide));

      var tags = el('p', 'tags');
      if (t.missable) tags.appendChild(el('span', 'tag missable', 'MISSABLE'));
      if (!t.methodConfirmed) tags.appendChild(el('span', 'tag unconfirmed', 'METHOD UNCONFIRMED'));
      tags.appendChild(el('span', 'tag kind', KIND_LABELS[t.kind] || t.kind));
      if (t.hidden) tags.appendChild(el('span', 'tag kind', 'Hidden on PSN'));
      card.appendChild(tags);

      var src = el('p', 'sources', 'Sources: ' + (t.sources || []).join(', '));
      card.appendChild(src);

      var row = el('label', 'earned-row');
      var box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = isEarned(t);
      box.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
      box.addEventListener('change', function () {
        if (box.checked) earned[String(t.id)] = true;
        else delete earned[String(t.id)];
        saveEarned();
        renderProgress();
        renderRoadmap();
        renderList();
      });
      row.appendChild(box);
      row.appendChild(document.createTextNode(isEarned(t) ? 'Earned' : 'Mark as earned'));
      card.appendChild(row);

      list.appendChild(card);
    });
    document.getElementById('showing-line').textContent = 'Showing ' + shown + ' of ' + TROPHIES.length + ' trophies';
  }

  // ------------------------------------------------------------ export / import / clear
  function downloadJson(filename, obj) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function exportProgress() {
    var ids = Object.keys(earned).map(function (k) { return Number(k); }).sort(function (a, b) { return a - b; });
    downloadJson('gta6-trophy-progress.json', {
      app: 'leonida-legend-gta6-trophy-guide',
      exportedAt: new Date().toISOString(),
      earned: ids
    });
    document.getElementById('import-note').textContent = 'Exported ' + ids.length + ' earned trophies.';
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var note = document.getElementById('import-note');
      var parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch (e) {
        note.textContent = 'Could not read that file: it is not valid JSON.';
        return;
      }
      var ids = parsed && Array.isArray(parsed.earned) ? parsed.earned : (Array.isArray(parsed) ? parsed : null);
      if (!ids) {
        note.textContent = 'That file has no earned-trophy list to import.';
        return;
      }
      var known = {};
      TROPHIES.forEach(function (t) { known[String(t.id)] = true; });
      var count = 0;
      var skipped = 0;
      ids.forEach(function (id) {
        if (known[String(id)]) {
          if (!earned[String(id)]) { earned[String(id)] = true; count++; }
        } else {
          skipped++;
        }
      });
      saveEarned();
      renderProgress();
      renderRoadmap();
      renderList();
      note.textContent = 'Imported ' + count + ' earned trophies.' + (skipped ? ' Skipped ' + skipped + ' unknown id(s).' : '');
    };
    reader.readAsText(file);
  }

  function clearProgress() {
    if (!window.confirm('Clear all earned trophies? This cannot be undone.')) return;
    earned = {};
    saveEarned();
    renderProgress();
    renderRoadmap();
    renderList();
    document.getElementById('import-note').textContent = 'Progress cleared.';
  }

  // ------------------------------------------------------------ wire up
  function init() {
    document.getElementById('search').addEventListener('input', function (ev) {
      query = String(ev.target.value || '').trim().toLowerCase();
      renderList();
    });
    document.getElementById('status-filter').addEventListener('change', function (ev) {
      statusFilter = ev.target.value;
      renderList();
    });
    document.getElementById('spoiler-toggle').addEventListener('change', function (ev) {
      spoilerOn = !!ev.target.checked;
      renderRoadmap();
      renderList();
    });
    document.getElementById('export-btn').addEventListener('click', exportProgress);
    document.getElementById('import-btn').addEventListener('click', function () {
      document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', function (ev) {
      if (ev.target.files && ev.target.files[0]) importProgress(ev.target.files[0]);
      ev.target.value = '';
    });
    document.getElementById('clear-btn').addEventListener('click', clearProgress);

    renderProgress();
    renderRoadmap();
    renderChips();
    renderList();

    window.__guide = {
      trophies: TROPHIES,
      get earned() { return Object.keys(earned).map(Number); },
      get spoilerOn() { return spoilerOn; },
      render: function () { renderProgress(); renderRoadmap(); renderChips(); renderList(); }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
