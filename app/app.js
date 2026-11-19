/* Leonida Legend — GTA VI trophy guide & tracker.
   Classic script, no modules, no network: works via file:// and http://.
   Data comes from data/trophies-data.js (window.TROPHY_DATA). */

(function () {
  "use strict";

  var STORAGE_KEY = "gta6-trophy-guide-earned-v1";
  var data = window.TROPHY_DATA;
  var trophies = data.trophies;

  /* ---------- State ---------- */

  function loadEarned() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return {};
      return parsed;
    } catch (e) {
      return {};
    }
  }

  function saveEarned(earned) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(earned));
    } catch (e) {
      /* Storage unavailable (private mode, etc.) — checklist still works in memory. */
    }
  }

  var earned = loadEarned();

  function isEarned(trophy) {
    return !!earned[trophy.name];
  }

  function earnedList() {
    return trophies.filter(isEarned);
  }

  function earnedGamerscore() {
    var total = 0;
    trophies.forEach(function (t) {
      if (isEarned(t)) total += t.gamerscore;
    });
    return total;
  }

  /* ---------- DOM handles ---------- */

  var listEl = document.getElementById("trophy-list");
  var earnedCountEl = document.getElementById("earned-count");
  var gamerscoreEl = document.getElementById("gamerscore");
  var progressFillEl = document.getElementById("progress-fill");
  var progressBarEl = document.querySelector(".progress-bar");
  var resultsCountEl = document.getElementById("results-count");
  var searchEl = document.getElementById("search");
  var statusEl = document.getElementById("status-filter");
  var spoilerEl = document.getElementById("spoiler-toggle");
  var chipsEl = document.getElementById("kind-chips");
  var dataStatusEl = document.getElementById("data-status");

  var activeKind = "all";

  function spoilerOn() {
    return spoilerEl.checked;
  }

  /* ---------- Rendering ---------- */

  function gradeClass(grade) {
    return "grade-" + grade.toLowerCase();
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cardHtml(trophy) {
    var hiddenStory = spoilerOn() && trophy.kind === "story";
    var done = isEarned(trophy);
    var parts = [];

    parts.push('<article class="trophy-card' + (done ? " earned" : "") + '" data-name="' + escapeHtml(trophy.name) + '" data-kind="' + escapeHtml(trophy.kind) + '">');

    if (hiddenStory) {
      parts.push("<h3>Hidden story trophy</h3>");
      parts.push('<p class="trophy-desc spoiler-hidden-text">Story spoiler hidden — turn spoilers off to reveal this trophy.</p>');
    } else {
      parts.push("<h3>" + escapeHtml(trophy.name) + "</h3>");
      parts.push('<p class="trophy-desc">' + escapeHtml(trophy.description) + "</p>");
    }

    parts.push('<div class="trophy-meta">');
    parts.push('<span class="grade ' + gradeClass(trophy.grade) + '">' + escapeHtml(trophy.grade) + "</span>");
    parts.push('<span class="gamerscore">' + trophy.gamerscore + "G</span>");
    parts.push('<span class="kind-label">' + escapeHtml(trophy.kind) + "</span>");
    if (trophy.hidden) parts.push('<span class="badge badge-hidden">Hidden</span>');
    if (trophy.missable) parts.push('<span class="badge badge-missable">Missable</span>');
    if (!trophy.methodConfirmed) parts.push('<span class="badge badge-unconfirmed">Unconfirmed method</span>');
    if (trophy.count) parts.push('<span class="kind-label">Target: ' + trophy.count + "</span>");
    parts.push("</div>");

    if (hiddenStory) {
      parts.push('<p class="trophy-guide spoiler-hidden-text">Guide hidden with the spoiler.</p>');
    } else if (!trophy.methodConfirmed) {
      parts.push('<p class="trophy-guide"><span class="unconfirmed-note">Unconfirmed method:</span> ' + escapeHtml(trophy.guide) + "</p>");
    } else {
      parts.push('<p class="trophy-guide">' + escapeHtml(trophy.guide) + "</p>");
    }

    parts.push('<button type="button" class="earn-toggle" data-toggle="' + escapeHtml(trophy.name) + '" aria-pressed="' + done + '">');
    parts.push(done ? "&#10003; Earned" : "Mark as earned");
    parts.push("</button>");

    parts.push("</article>");
    return parts.join("");
  }

  function updateProgress() {
    var count = earnedList().length;
    var gs = earnedGamerscore();
    earnedCountEl.textContent = String(count);
    gamerscoreEl.textContent = gs + " / 1,000";
    progressFillEl.style.width = (count / trophies.length * 100) + "%";
    progressBarEl.setAttribute("aria-valuenow", String(count));
  }

  function matchesFilters(trophy) {
    var q = searchEl.value.trim().toLowerCase();
    if (q) {
      var haystack = (trophy.name + " " + trophy.description + " " + trophy.guide).toLowerCase();
      if (haystack.indexOf(q) === -1) return false;
    }
    if (activeKind !== "all" && trophy.kind !== activeKind) return false;
    var status = statusEl.value;
    if (status === "earned" && !isEarned(trophy)) return false;
    if (status === "unearned" && isEarned(trophy)) return false;
    return true;
  }

  function render() {
    var visible = trophies.filter(matchesFilters);
    if (visible.length === 0) {
      listEl.innerHTML = '<p class="no-results">No trophies match these filters. Clear the search or pick a different filter.</p>';
    } else {
      listEl.innerHTML = visible.map(cardHtml).join("");
    }
    var total = trophies.length;
    resultsCountEl.textContent = "Showing " + visible.length + " of " + total + " trophies.";
    updateProgress();
  }

  /* ---------- Events ---------- */

  listEl.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-toggle]");
    if (!btn) return;
    var name = btn.getAttribute("data-toggle");
    if (earned[name]) {
      delete earned[name];
    } else {
      earned[name] = true;
    }
    saveEarned(earned);
    render();
  });

  searchEl.addEventListener("input", render);
  statusEl.addEventListener("change", render);
  spoilerEl.addEventListener("change", render);

  chipsEl.addEventListener("click", function (event) {
    var chip = event.target.closest("[data-kind]");
    if (!chip) return;
    activeKind = chip.getAttribute("data-kind");
    var chips = chipsEl.querySelectorAll(".chip");
    chips.forEach(function (c) {
      c.classList.toggle("chip-active", c === chip);
    });
    render();
  });

  /* ---------- Export / import / clear ---------- */

  function downloadJson(filename, text) {
    var blob = new Blob([text], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  document.getElementById("export-btn").addEventListener("click", function () {
    var payload = {
      game: "Grand Theft Auto VI",
      exportedAt: new Date().toISOString(),
      earned: Object.keys(earned).sort()
    };
    downloadJson("gta6-trophy-progress.json", JSON.stringify(payload, null, 2));
    dataStatusEl.textContent = "Exported " + payload.earned.length + " earned trophies as JSON.";
  });

  var importFileEl = document.getElementById("import-file");

  document.getElementById("import-btn").addEventListener("click", function () {
    importFileEl.click();
  });

  importFileEl.addEventListener("change", function () {
    var file = importFileEl.files && importFileEl.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        var names = parsed.earned || parsed;
        if (!Array.isArray(names)) throw new Error("bad format");
        var known = {};
        trophies.forEach(function (t) { known[t.name] = true; });
        var restored = {};
        var count = 0;
        names.forEach(function (name) {
          if (known[name]) { restored[name] = true; count++; }
        });
        earned = restored;
        saveEarned(earned);
        render();
        dataStatusEl.textContent = "Imported " + count + " earned trophies.";
      } catch (e) {
        dataStatusEl.textContent = "Import failed: that file is not a valid progress export.";
      }
      importFileEl.value = "";
    };
    reader.readAsText(file);
  });

  document.getElementById("clear-btn").addEventListener("click", function () {
    if (!window.confirm("Clear your whole checklist? This cannot be undone (export first if you want a backup).")) return;
    earned = {};
    saveEarned(earned);
    render();
    dataStatusEl.textContent = "Checklist cleared.";
  });

  /* ---------- Test hooks ---------- */

  window.__guide = {
    data: data,
    trophies: trophies,
    getEarned: function () { return Object.keys(earned).sort(); },
    setEarned: function (names) {
      var next = {};
      names.forEach(function (n) { next[n] = true; });
      earned = next;
      saveEarned(earned);
      render();
    },
    earnedGamerscore: earnedGamerscore,
    render: render
  };

  render();
})();
