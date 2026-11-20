// Leonida Ledger — GTA VI trophy guide and tracker.
// A static offline app: it fetches data/trophies.json from its own folder,
// keeps progress in localStorage, and makes no other request of any kind.

const DATA_PATH = "data/trophies.json";
const SAVE_KEY = "gta6-trophy-progress-v1";
const TOTAL_TROPHIES = 55;

const KIND_NAMES = {
  story: "Story",
  mission: "Mission",
  activity: "Activity",
  collectible: "Collectible",
  exploration: "Exploration",
  combat: "Combat & crime",
  money: "Money",
  event: "Event",
};

const GRADE_ORDER = ["platinum", "gold", "silver", "bronze"];
const GRADE_TITLES = {
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
};

const ROADMAP = [
  {
    stage: 1,
    heading: "Play the story",
    blurb: "Chapters 1–4, the final mission, the named missions and the stranger strands. Do the partner trophies (Hot Together, Retail Therapy) while the story still pairs you up, and take Cal's fishing challenge and Bret's hunt when they appear.",
  },
  {
    stage: 2,
    heading: "Activities & skills",
    blurb: "Try every activity once, then work the skill trophies: 250 stunts, 42 gold Shooting Range medals, 14 drone race wins, 20 race wins, 18 meditation spots, and the arcade, bowling and fishing stops.",
  },
  {
    stage: 3,
    heading: "Explore the map",
    blurb: "All 52 areas of Leonida, 100 vehicles discovered, 10 registered to Scooter Bros, 8 garages bought, 100 WAiNK It locations and 3 card sets. These four feed each other — cover the map once, thoroughly.",
  },
  {
    stage: 4,
    heading: "Crime & chaos",
    blurb: "Five bank vaults, the armored truck, one illegal operation per gang, the jewelry store, Combat Focus, the VCIA departure and the showroom smash. Plan each escape before the robbery.",
  },
  {
    stage: 5,
    heading: "Money & cleanup",
    blurb: "Launder $250,000 of Marked Bills, spend $100,000 in the shops, finish 50 challenges, then the quiet moments: a cocktail on Ocean Beach, the second-try trophy and the strange event. Last of all, 100% completion and the platinum.",
  },
];

// Preview helpers for screenshots and trying the guide: ?demo=1 seeds 13
// earned trophies in memory only, ?section=roadmap|missables opens a tab,
// ?open=<id> opens one trophy's guide, ?spoiler=off shows story names.
const query = new URLSearchParams(location.search);
const DEMO_IDS = [2, 3, 4, 5, 8, 10, 16, 21, 35, 42, 44, 46, 53];

const guide = {
  trophies: [],
  sourceNotes: {},
  earned: new Set(),
  hideSpoilers: true,
  kind: "all",
  grade: "all",
  status: "all",
  missableOnly: false,
  searchText: "",
  section: "checklist",
  openId: null,
  demo: query.get("demo") === "1",
};

function readSavedProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) {
      for (const id of saved.earned) guide.earned.add(id);
    }
    if (typeof saved.spoiler === "boolean") guide.hideSpoilers = saved.spoiler;
  } catch (err) {
    console.warn("Saved progress could not be read:", err);
  }
}

function writeSavedProgress() {
  if (guide.demo) return; // demo progress is a preview and is never stored
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        earned: [...guide.earned].sort((a, b) => a - b),
        spoiler: guide.hideSpoilers,
      }),
    );
  } catch (err) {
    console.warn("Saved progress could not be written:", err);
  }
}

function trophyIsHidden(t) {
  return t.spoiler && guide.hideSpoilers && !guide.earned.has(t.id);
}

function displayName(t) {
  return trophyIsHidden(t) ? "Hidden trophy — earn it to reveal" : t.name;
}

function displayDescription(t) {
  return trophyIsHidden(t)
    ? "A story trophy. Its name and description stay hidden until you earn it."
    : t.description;
}

function gradeTally() {
  const tally = {};
  for (const g of GRADE_ORDER) tally[g] = [0, 0];
  for (const t of guide.trophies) {
    tally[t.grade][1] += 1;
    if (guide.earned.has(t.id)) tally[t.grade][0] += 1;
  }
  return tally;
}

function nextUnearned() {
  const ordered = [...guide.trophies].sort(
    (a, b) => a.stage - b.stage || a.id - b.id,
  );
  return ordered.find((t) => !guide.earned.has(t.id)) || null;
}

function renderScoreboard() {
  const earnedCount = guide.earned.size;
  const total = guide.trophies.length || TOTAL_TROPHIES;
  document.getElementById("earnedTotal").textContent = earnedCount;
  const fill = document.getElementById("meterFill");
  fill.style.width = total ? `${Math.round((earnedCount / total) * 100)}%` : "0%";
  const meter = document.getElementById("meter");
  meter.setAttribute("aria-valuenow", String(earnedCount));
  meter.setAttribute("aria-valuemax", String(total));

  const tally = gradeTally();
  document.getElementById("gradeBars").innerHTML = GRADE_ORDER.map((g) => {
    const [done, all] = tally[g];
    const pct = all ? Math.round((done / all) * 100) : 0;
    return `<li><span class="grade-label"><span class="medal ${g}" aria-hidden="true"></span>${GRADE_TITLES[g]} <b>${done}/${all}</b></span>` +
      `<span class="mini-bar"><span class="bar-${g}" style="width:${pct}%"></span></span></li>`;
  }).join("");

  const next = nextUnearned();
  document.getElementById("upNext").textContent = next
    ? `Next up: ${trophyIsHidden(next) ? "a hidden story trophy" : next.name} — stage ${next.stage} of the roadmap.`
    : "Platinum earned — you're a Leonida Legend.";
  document.getElementById("missableCount").textContent =
    guide.trophies.filter((t) => t.missable).length;
}

function trophiesMatchingFilters() {
  const needle = guide.searchText.trim().toLowerCase();
  return guide.trophies.filter((t) => {
    if (guide.kind !== "all" && t.kind !== guide.kind) return false;
    if (guide.grade !== "all" && t.grade !== guide.grade) return false;
    if (guide.status === "earned" && !guide.earned.has(t.id)) return false;
    if (guide.status === "missing" && guide.earned.has(t.id)) return false;
    if (guide.missableOnly && !t.missable) return false;
    if (needle) {
      // Search what the reader can actually see: hidden story trophies are
      // matched by their placeholder text, not by their hidden names.
      const haystack = `${displayName(t)} ${displayDescription(t)} ${t.target || ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

function escapeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderChecklist() {
  const list = document.getElementById("trophyList");
  const shown = trophiesMatchingFilters();
  document.getElementById("resultCount").textContent =
    `Showing ${shown.length} of ${guide.trophies.length} trophies` +
    (guide.earned.size ? ` — ${guide.earned.size} earned` : "");
  if (!shown.length) {
    list.innerHTML = `<li class="no-results">No trophies match these filters. Clear the search or widen the filters.</li>`;
    return;
  }
  list.innerHTML = "";
  for (const t of shown) {
    const earned = guide.earned.has(t.id);
    const item = document.createElement("li");
    item.className =
      "trophy-row" + (earned ? " is-earned" : "") + (guide.openId === t.id ? " is-open" : "");
    item.dataset.id = t.id;
    item.innerHTML =
      `<input type="checkbox" ${earned ? "checked" : ""} aria-label="Mark ${escapeText(displayName(t))} as earned">` +
      `<div class="trophy-body"><div class="trophy-title"><span class="medal ${t.grade}" aria-hidden="true"></span>${escapeText(displayName(t))}</div>` +
      `<div class="trophy-desc">${escapeText(displayDescription(t))}</div>` +
      `<div class="trophy-tags">` +
      `<span class="tag grade-${t.grade}">${t.grade}</span>` +
      `<span class="tag">${KIND_NAMES[t.kind] || t.kind}</span>` +
      (t.missable ? `<span class="tag is-missable">Missable</span>` : "") +
      (t.target ? `<span class="tag is-target">${escapeText(t.target)}</span>` : "") +
      `</div></div>` +
      `<span class="earned-flag">${earned ? "✓ Earned" : ""}</span>`;
    item.querySelector("input").addEventListener("change", (event) => {
      event.stopPropagation();
      flipEarned(t.id);
    });
    item.setAttribute("tabindex", "0");
    item.addEventListener("click", (event) => {
      if (event.target.tagName === "INPUT") return;
      openGuide(t.id);
    });
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openGuide(t.id);
      }
    });
    list.appendChild(item);
  }
}

function flipEarned(id) {
  if (guide.earned.has(id)) guide.earned.delete(id);
  else guide.earned.add(id);
  writeSavedProgress();
  renderScoreboard();
  renderChecklist();
  if (guide.openId === id) renderGuidePane();
}

function openGuide(id) {
  guide.openId = id;
  renderChecklist();
  renderGuidePane();
  document.getElementById("guidePane").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function sourceNote(key) {
  return guide.sourceNotes[key] || key;
}

function renderGuidePane() {
  const pane = document.getElementById("guidePane");
  const t = guide.trophies.find((x) => x.id === guide.openId);
  if (!t) {
    pane.innerHTML = `<p class="pane-empty">Select a trophy to read its guide, its sources, and when it can be missed.</p>`;
    return;
  }
  const earned = guide.earned.has(t.id);
  const hidden = trophyIsHidden(t);
  const stage = ROADMAP.find((s) => s.stage === t.stage);
  pane.innerHTML =
    `<h2>${escapeText(displayName(t))}</h2>` +
    `<p class="official-line">“${escapeText(displayDescription(t))}” — official description, grade ${t.grade}, ${KIND_NAMES[t.kind] || t.kind}` +
    `${t.target ? `, target ${escapeText(t.target)}` : ""}` +
    `${t.missable ? ", missable" : ""}${stage ? `, roadmap stage ${stage.stage} — ${escapeText(stage.heading)}` : ""}.</p>` +
    (hidden
      ? `<p class="guide-body">Spoilers are on, so this story trophy's guide stays hidden too. Earn it — or turn spoilers off — to read the guide.</p>`
      : `<h3>Guide</h3><p class="guide-body">${escapeText(t.guide)}</p>` +
        `<h3>Sources</h3><ul class="source-lines">${t.sources.map((s) => `<li>${escapeText(sourceNote(s))}</li>`).join("")}</ul>`) +
    `<div class="pane-actions"><button type="button" id="paneToggle">${earned ? "Mark as not earned" : "Mark as earned"}</button></div>`;
  document.getElementById("paneToggle").addEventListener("click", () => flipEarned(t.id));
}

function renderRoadmap() {
  const host = document.getElementById("roadmapList");
  host.innerHTML = "";
  for (const step of ROADMAP) {
    const members = guide.trophies
      .filter((t) => t.stage === step.stage)
      .sort((a, b) => a.id - b.id);
    const done = members.filter((t) => guide.earned.has(t.id)).length;
    const card = document.createElement("div");
    card.className = "stage-card";
    card.innerHTML =
      `<h2><span class="stage-no">Stage ${step.stage}.</span> ${escapeText(step.heading)} <span class="stage-count">— ${done}/${members.length} earned</span></h2>` +
      `<p>${escapeText(step.blurb)}</p>` +
      `<ul>${members.map((t) => {
        const earned = guide.earned.has(t.id);
        return `<li class="${earned ? "" : "is-missing"}"><span class="tick">${earned ? "✓" : "○"}</span>` +
          `<span class="stage-trophy">${escapeText(displayName(t))}</span>` +
          `<span class="stage-meta">${t.grade}${t.missable ? " · missable" : ""}${t.target ? ` · ${escapeText(t.target)}` : ""}</span></li>`;
      }).join("")}</ul>`;
    host.appendChild(card);
  }
}

// The "why" for a missable trophy is the guide's own sentence that starts
// with "Flagged missable": it states the reason in the guide's words instead
// of repeating the whole guide. Falls back to the general rule.
function missableReason(t) {
  const found = t.guide.match(/Flagged missable[^.]*\./);
  return found
    ? found[0]
    : "The official description names a single moment rather than a grind you can return to.";
}

function renderMissables() {
  const host = document.getElementById("missableCards");
  const items = guide.trophies.filter((t) => t.missable);
  host.innerHTML = "";
  for (const t of items) {
    const card = document.createElement("div");
    card.className = "missable-card";
    card.innerHTML =
      `<h3>${escapeText(displayName(t))} <span class="tag grade-${t.grade}">${t.grade}</span></h3>` +
      `<p>“${escapeText(displayDescription(t))}”</p>` +
      `<p class="missable-why">${escapeText(missableReason(t))}</p>` +
      `<p>${escapeText(t.guide)}</p>` +
      `<p class="missable-sources">Sources: ${t.sources.map((s) => escapeText(sourceNote(s))).join(" · ")}</p>`;
    host.appendChild(card);
  }
}

function showSection(section) {
  guide.section = section;
  document.querySelectorAll(".tab").forEach((button) => {
    const active = button.dataset.section === section;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === `section-${section}`);
  });
  if (section === "roadmap") renderRoadmap();
  if (section === "missables") renderMissables();
}

function downloadProgress() {
  const payload = {
    app: "Leonida Ledger — GTA VI trophy guide",
    exported: new Date().toISOString(),
    earned: [...guide.earned].sort((a, b) => a - b),
    spoiler: guide.hideSpoilers,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "gta6-trophy-progress.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function uploadProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || !Array.isArray(data.earned)) throw new Error("not a progress file");
      const known = new Set(guide.trophies.map((t) => t.id));
      const kept = data.earned.filter((id) => known.has(id));
      guide.earned = new Set(kept);
      if (typeof data.spoiler === "boolean") {
        guide.hideSpoilers = data.spoiler;
        document.getElementById("spoilerCheck").checked = guide.hideSpoilers;
      }
      writeSavedProgress();
      renderScoreboard();
      renderChecklist();
      renderGuidePane();
      alert(`Imported progress: ${kept.length} trophies earned.`);
    } catch (err) {
      alert("That file is not a Leonida Ledger progress export.");
    }
  };
  reader.readAsText(file);
}

async function start() {
  const response = await fetch(DATA_PATH);
  if (!response.ok) throw new Error(`Could not load ${DATA_PATH}: ${response.status}`);
  const data = await response.json();
  guide.trophies = data.trophies;
  guide.sourceNotes = data.sources || {};
  readSavedProgress();
  if (guide.demo) for (const id of DEMO_IDS) guide.earned.add(id);
  if (query.get("spoiler") === "off") guide.hideSpoilers = false;
  document.getElementById("spoilerCheck").checked = guide.hideSpoilers;

  document.querySelectorAll(".tab").forEach((button) =>
    button.addEventListener("click", () => showSection(button.dataset.section)));
  document.getElementById("searchBox").addEventListener("input", (event) => {
    guide.searchText = event.target.value;
    renderChecklist();
  });
  document.getElementById("kindSelect").addEventListener("change", (event) => {
    guide.kind = event.target.value;
    renderChecklist();
  });
  document.getElementById("gradeSelect").addEventListener("change", (event) => {
    guide.grade = event.target.value;
    renderChecklist();
  });
  document.getElementById("statusSelect").addEventListener("change", (event) => {
    guide.status = event.target.value;
    renderChecklist();
  });
  document.getElementById("missableCheck").addEventListener("change", (event) => {
    guide.missableOnly = event.target.checked;
    renderChecklist();
  });
  document.getElementById("spoilerCheck").addEventListener("change", (event) => {
    guide.hideSpoilers = event.target.checked;
    writeSavedProgress();
    renderScoreboard();
    renderChecklist();
    renderGuidePane();
  });
  document.getElementById("exportButton").addEventListener("click", downloadProgress);
  document.getElementById("importInput").addEventListener("change", (event) => {
    if (event.target.files && event.target.files[0]) uploadProgress(event.target.files[0]);
    event.target.value = "";
  });
  document.getElementById("resetButton").addEventListener("click", () => {
    if (!confirm("Clear all earned trophies? This cannot be undone.")) return;
    guide.earned.clear();
    writeSavedProgress();
    renderScoreboard();
    renderChecklist();
    renderGuidePane();
  });

  renderScoreboard();
  renderChecklist();
  renderRoadmap();
  renderMissables();
  const section = query.get("section");
  if (section && ["checklist", "roadmap", "missables", "about"].includes(section)) {
    showSection(section);
  }
  const open = Number(query.get("open"));
  if (open && guide.trophies.some((t) => t.id === open)) openGuide(open);
}

start().catch((err) => {
  document.getElementById("trophyList").innerHTML =
    `<li class="no-results">The trophy list could not be loaded. Serve this folder with a static server and open index.html from it.</li>`;
  console.error(err);
});
