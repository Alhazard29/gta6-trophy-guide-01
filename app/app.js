/* Leonida Legend — GTA VI trophy guide & tracker.
   Classic script (not a module) so it works from file:// as well as http://.
   Data comes from data/trophies-data.js (window.TROPHIES). */
(function () {
  "use strict";

  var STORAGE_KEY = "gta6-trophy-guide-earned-v1";
  var MAX_GAMERSCORE = 1000;

  /* Xbox-style Gamerscore per grade (Platinum itself scores 0 on Xbox). */
  var POINTS = { Platinum: 0, Gold: 90, Silver: 30, Bronze: 15 };

  var data = window.TROPHIES || { trophies: [], grades: {} };
  var trophies = data.trophies || [];
  var byId = {};
  trophies.forEach(function (t) { byId[t.id] = t; });

  var earned = loadEarned();
  var state = { search: "", status: "all", kind: "all", spoiler: true };

  var grid = document.getElementById("grid");
  var searchInput = document.getElementById("search");
  var statusFilter = document.getElementById("statusFilter");
  var spoilerToggle = document.getElementById("spoilerToggle");
  var earnedCountEl = document.getElementById("earnedCount");
  var gamerscoreEl = document.getElementById("gamerscore");
  var progressFill = document.getElementById("progressFill");
  var progressBarWrap = document.getElementById("progressBarWrap");
  var resultCountEl = document.getElementById("resultCount");
  var emptyMessage = document.getElementById("emptyMessage");

  function loadEarned() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var arr = JSON.parse(raw);
      var out = {};
      if (Array.isArray(arr)) {
        arr.forEach(function (id) { if (byId[id]) out[id] = true; });
      }
      return out;
    } catch (e) {
      return {};
    }
  }

  function saveEarned() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.keys(earned)));
    } catch (e) { /* storage unavailable (e.g. private mode) — checklist still works in memory */ }
  }

  function isEarned(id) { return !!earned[id]; }

  function gamerscore() {
    var total = 0;
    Object.keys(earned).forEach(function (id) {
      var t = byId[id];
      if (t) total += POINTS[t.grade] || 0;
    });
    return total;
  }

  function isSpoilerHidden(t) {
    return state.spoiler && t.kind === "story" && !isEarned(t.id);
  }

  function matches(t) {
    if (state.kind !== "all" && t.kind !== state.kind) return false;
    if (state.status === "earned" && !isEarned(t.id)) return false;
    if (state.status === "unearned" && isEarned(t.id)) return false;
    if (state.search) {
      var hay = (t.name + " " + t.description + " " + t.guide).toLowerCase();
      if (hay.indexOf(state.search) === -1) return false;
    }
    return true;
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderCard(t) {
    var hidden = isSpoilerHidden(t);
    var card = el("article", "card" + (isEarned(t.id) ? " card-earned" : ""));
    card.setAttribute("data-id", t.id);

    var top = el("div", "card-top");
    top.appendChild(el("h3", null, hidden ? "Hidden story trophy" : t.name));
    var grade = el("span", "grade grade-" + t.grade.toLowerCase(), t.grade);
    top.appendChild(grade);
    card.appendChild(top);

    card.appendChild(el("p", "card-desc", hidden ? "Spoiler hidden — earn this trophy to reveal it." : t.description));

    var meta = el("div", "card-meta");
    meta.appendChild(el("span", "tag", t.kind));
    if (t.missable) meta.appendChild(el("span", "tag tag-missable", "Missable"));
    if (t.hidden) meta.appendChild(el("span", "tag", "Hidden trophy"));
    if (!t.methodConfirmed) meta.appendChild(el("span", "tag tag-unconfirmed", "Method unconfirmed"));
    card.appendChild(meta);

    if (hidden) {
      card.appendChild(el("p", "spoiler-hidden", "Story spoiler hidden. Tick the trophy as earned to reveal its name, description and guide."));
    } else {
      card.appendChild(el("p", "card-guide", t.guide));
    }

    var check = el("label", "card-check");
    var box = document.createElement("input");
    box.type = "checkbox";
    box.checked = isEarned(t.id);
    box.setAttribute("aria-label", "Mark " + t.name + " as earned");
    box.addEventListener("change", function () {
      if (box.checked) { earned[t.id] = true; } else { delete earned[t.id]; }
      saveEarned();
      render();
    });
    check.appendChild(box);
    check.appendChild(document.createTextNode(isEarned(t.id) ? "Earned" : "Mark as earned"));
    card.appendChild(check);

    return card;
  }

  function updateProgress() {
    var count = Object.keys(earned).length;
    earnedCountEl.textContent = String(count);
    gamerscoreEl.textContent = String(gamerscore());
    var pct = trophies.length ? Math.round((count / trophies.length) * 100) : 0;
    progressFill.style.width = pct + "%";
    progressBarWrap.setAttribute("aria-valuenow", String(count));
  }

  function render() {
    var visible = trophies.filter(matches);
    grid.innerHTML = "";
    visible.forEach(function (t) { grid.appendChild(renderCard(t)); });
    emptyMessage.hidden = visible.length !== 0;
    resultCountEl.textContent = "Showing " + visible.length + " of " + trophies.length + " trophies";
    updateProgress();
  }

  function exportData() {
    return JSON.stringify(Object.keys(earned).sort(), null, 2);
  }

  function exportEarned() {
    var blob = new Blob([exportData()], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "gta6-trophies-earned.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* Accepts a parsed JSON value (array of ids) or a JSON string.
     Restores earned state, silently skipping unknown ids. Returns the
     number of known ids that were applied. */
  function importData(value) {
    var arr = value;
    if (typeof value === "string") {
      try { arr = JSON.parse(value); } catch (e) { return 0; }
    }
    if (!Array.isArray(arr)) return 0;
    var applied = 0;
    arr.forEach(function (id) {
      if (byId[id] && !earned[id]) { earned[id] = true; applied++; }
    });
    saveEarned();
    render();
    return applied;
  }

  function clearAll() {
    earned = {};
    saveEarned();
    render();
  }

  function wireControls() {
    searchInput.addEventListener("input", function () {
      state.search = searchInput.value.trim().toLowerCase();
      render();
    });

    statusFilter.addEventListener("change", function () {
      state.status = statusFilter.value;
      render();
    });

    spoilerToggle.addEventListener("change", function () {
      state.spoiler = spoilerToggle.checked;
      render();
    });

    var chips = document.querySelectorAll(".chip[data-kind]");
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener("click", function () {
        state.kind = chip.getAttribute("data-kind");
        Array.prototype.forEach.call(chips, function (c) {
          c.classList.toggle("chip-active", c === chip);
        });
        render();
      });
    });

    document.getElementById("exportBtn").addEventListener("click", exportEarned);

    var importFile = document.getElementById("importFile");
    importFile.addEventListener("change", function () {
      var file = importFile.files && importFile.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { importData(reader.result); };
      reader.readAsText(file);
      importFile.value = "";
    });

    document.getElementById("clearBtn").addEventListener("click", function () {
      if (window.confirm("Clear the whole checklist? This removes all earned marks.")) {
        clearAll();
      }
    });
  }

  /* Test / automation hook. */
  window.__guide = {
    trophies: trophies,
    byId: byId,
    state: state,
    getEarned: function () { return Object.keys(earned).sort(); },
    setEarned: function (ids) {
      earned = {};
      (ids || []).forEach(function (id) { if (byId[id]) earned[id] = true; });
      saveEarned();
      render();
    },
    gamerscore: gamerscore,
    exportData: exportData,
    importData: importData,
    clearAll: clearAll,
    render: render,
    visibleCount: function () { return grid.children.length; },
    hiddenSpoilerCount: function () {
      return trophies.filter(function (t) { return isSpoilerHidden(t); }).length;
    }
  };

  state.spoiler = spoilerToggle.checked;
  wireControls();
  render();
})();
