// Leonida Ledger — GTA VI trophy guide and tracker.
// Offline static app: loads data/trophies.json from its own folder, saves
// progress in localStorage, and makes no other network request.

const DATA_URL = "data/trophies.json";
const STORE_KEY = "gta6-trophy-progress-v1";

const KIND_LABELS = {
  story: "Story",
  mission: "Mission",
  activity: "Activity",
  collectible: "Collectible",
  exploration: "Exploration",
  combat: "Combat & crime",
  money: "Money",
  event: "Event",
};

const STAGES = [
  { n: 1, title: "Play the story", text: "Chapters 1–4, the final mission, the named missions and the stranger strands. Do the partner trophies (Hot Together, Retail Therapy) while the story still pairs you up, and take Cal's fishing challenge and Bret's hunt when they appear." },
  { n: 2, title: "Activities & skills", text: "Try every activity once, then work the skill trophies: 250 stunts, 42 gold Shooting Range medals, 14 drone race wins, 20 race wins, 18 meditation spots, and the arcade, bowling and fishing stops." },
  { n: 3, title: "Explore the map", text: "All 52 areas of Leonida, 100 vehicles discovered, 10 registered to Scooter Bros, 8 garages bought, 100 WAiNK It locations and 3 card sets. These four feed each other — cover the map once, thoroughly." },
  { n: 4, title: "Crime & chaos", text: "Five bank vaults, the armored truck, one illegal operation per gang, the jewelry store, Combat Focus, the VCIA departure and the showroom smash. Plan each escape before the robbery." },
  { n: 5, title: "Money & cleanup", text: "Launder $250,000 of Marked Bills, spend $100,000 in the shops, finish 50 challenges, then the quiet moments: a cocktail on Ocean Beach, the second-try trophy and the strange event. Last of all, 100% completion and the platinum." },
];

// Demo mode is for previewing the guide (and for its screenshots):
// ?demo=1 seeds 13 earned trophies in memory only, ?view=roadmap|missables,
// ?open=<id> opens one trophy's guide, ?spoiler=off shows story names.
const params = new URLSearchParams(location.search);
const DEMO_EARNED = [2, 3, 4, 5, 8, 10, 16, 21, 35, 42, 44, 46, 53];

const state = {
  trophies: [],
  sources: {},
  earned: new Set(),
  spoiler: true,
  kind: "all",
  grade: "all",
  status: "all",
  missableOnly: false,
  search: "",
  view: "checklist",
  selected: null,
  demo: params.get("demo") === "1",
};

function loadStored() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.earned)) data.earned.forEach((id) => state.earned.add(id));
    if (typeof data.spoiler === "boolean") state.spoiler = data.spoiler;
  } catch (err) {
    console.warn("Could not read saved progress:", err);
  }
}

function saveStored() {
  if (state.demo) return; // demo progress is a preview, never saved
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      earned: [...state.earned].sort((a, b) => a - b),
      spoiler: state.spoiler,
    }));
  } catch (err) {
    console.warn("Could not save progress:", err);
  }
}

function gradeCounts() {
  const out = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const t of state.trophies) {
    out[t.grade][1] += 1;
    if (state.earned.has(t.id)) out[t.grade][0] += 1;
  }
  return out;
}

function isHidden(t) {
  return t.spoiler && state.spoiler && !state.earned.has(t.id);
}

function nextUp() {
  const order = [...state.trophies].sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  return order.find((t) => !state.earned.has(t.id)) || null;
}

function renderProgress() {
  const earned = state.earned.size;
  const total = state.trophies.length;
  document.getElementById("earnedCount").textContent = earned;
  const fill = document.getElementById("progressFill");
  fill.style.width = total ? `${Math.round((earned / total) * 100)}%` : "0%";
  const bar = document.getElementById("progressBar");
  bar.setAttribute("aria-valuenow", String(earned));
  const counts = gradeCounts();
  document.getElementById("gradeCounts").innerHTML =
    `Platinum <b>${counts.platinum[0]}/${counts.platinum[1]}</b> &middot; ` +
    `Gold <b>${counts.gold[0]}/${counts.gold[1]}</b> &middot; ` +
    `Silver <b>${counts.silver[0]}/${counts.silver[1]}</b> &middot; ` +
    `Bronze <b>${counts.bronze[0]}/${counts.bronze[1]}</b>`;
  const up = nextUp();
  document.getElementById("nextUp").textContent = up
    ? `Next up: ${isHidden(up) ? "a hidden story trophy" : up.name} — stage ${up.stage} of the roadmap.`
    : "Platinum earned — you're a Leonida Legend.";
  document.getElementById("missablePill").textContent =
    state.trophies.filter((t) => t.missable).length;
}

function filteredTrophies() {
  const q = state.search.trim().toLowerCase();
  return state.trophies.filter((t) => {
    if (state.kind !== "all" && t.kind !== state.kind) return false;
    if (state.grade !== "all" && t.grade !== state.grade) return false;
    if (state.status === "earned" && !state.earned.has(t.id)) return false;
    if (state.status === "missing" && state.earned.has(t.id)) return false;
    if (state.missableOnly && !t.missable) return false;
    if (q && !(t.name + " " + t.description + " " + (t.target || "")).toLowerCase().includes(q)) return false;
    return true;
  });
}

function trophyName(t) {
  return isHidden(t) ? "Hidden trophy — earn it to reveal" : t.name;
}

function trophyDesc(t) {
  return isHidden(t) ? "A story trophy. Its name and description stay hidden until you earn it." : t.description;
}

function renderList() {
  const list = document.getElementById("trophyList");
  const items = filteredTrophies();
  document.getElementById("showing").textContent =
    `Showing ${items.length} of ${state.trophies.length} trophies` +
    (state.earned.size ? ` — ${state.earned.size} earned` : "");
  if (!items.length) {
    list.innerHTML = `<li class="empty-note">No trophies match these filters. Clear the search or widen the filters.</li>`;
    return;
  }
  list.innerHTML = "";
  for (const t of items) {
    const li = document.createElement("li");
    li.className = "trophy" + (state.earned.has(t.id) ? " earned" : "") +
      (state.selected === t.id ? " selected" : "");
    li.dataset.id = t.id;
    const earned = state.earned.has(t.id);
    li.innerHTML =
      `<input type="checkbox" ${earned ? "checked" : ""} aria-label="Mark ${escapeHtml(trophyName(t))} as earned">` +
      `<div><div class="trophy-name"><span class="medal ${t.grade}" aria-hidden="true"></span>${escapeHtml(trophyName(t))}</div>` +
      `<div class="trophy-desc">${escapeHtml(trophyDesc(t))}</div>` +
      `<div class="trophy-meta">` +
      `<span class="tag grade-${t.grade}">${t.grade}</span>` +
      `<span class="tag">${KIND_LABELS[t.kind] || t.kind}</span>` +
      (t.missable ? `<span class="tag missable">Missable</span>` : "") +
      (t.target ? `<span class="tag target">${escapeHtml(t.target)}</span>` : "") +
      `</div></div>` +
      `<span class="earned-mark">${earned ? "✓ Earned" : ""}</span>`;
    li.querySelector("input").addEventListener("change", (e) => {
      e.stopPropagation();
      toggleEarned(t.id);
    });
    li.setAttribute("tabindex", "0");
    li.addEventListener("click", (e) => {
      if (e.target.tagName === "INPUT") return; // the checkbox has its own handler
      selectTrophy(t.id);
    });
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectTrophy(t.id);
      }
    });
    list.appendChild(li);
  }
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveStored();
  renderProgress();
  renderList();
  if (state.selected === id) renderDetail();
}

function selectTrophy(id) {
  state.selected = id;
  renderList();
  renderDetail();
  document.getElementById("detailPane").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function sourceText(key) {
  return state.sources[key] || key;
}

function renderDetail() {
  const pane = document.getElementById("detailPane");
  const t = state.trophies.find((x) => x.id === state.selected);
  if (!t) {
    pane.innerHTML = `<p class="detail-empty">Select a trophy to read its guide, its sources, and when it can be missed.</p>`;
    return;
  }
  const earned = state.earned.has(t.id);
  const hidden = isHidden(t);
  pane.innerHTML =
    `<h2>${escapeHtml(trophyName(t))}</h2>` +
    `<p class="official">“${escapeHtml(trophyDesc(t))}” — official description, grade ${t.grade}, ${KIND_LABELS[t.kind] || t.kind}${t.target ? `, target ${escapeHtml(t.target)}` : ""}${t.missable ? ", missable" : ""}.</p>` +
    (hidden ? `<p class="guide-text">Spoilers are on, so this story trophy's guide stays hidden too. Earn it — or turn spoilers off — to read the guide.</p>`
      : `<h3>Guide</h3><p class="guide-text">${escapeHtml(t.guide)}</p>` +
        `<h3>Sources</h3><ul class="sources">${t.sources.map((s) => `<li>${escapeHtml(sourceText(s))}</li>`).join("")}</ul>`) +
    `<div class="earn-row"><button type="button" id="detailToggle">${earned ? "Mark as not earned" : "Mark as earned"}</button></div>`;
  document.getElementById("detailToggle").addEventListener("click", () => toggleEarned(t.id));
}

function renderRoadmap() {
  const host = document.getElementById("roadmapStages");
  host.innerHTML = "";
  for (const stage of STAGES) {
    const items = state.trophies.filter((t) => t.stage === stage.n)
      .sort((a, b) => a.id - b.id);
    const done = items.filter((t) => state.earned.has(t.id)).length;
    const div = document.createElement("div");
    div.className = "stage";
    div.innerHTML =
      `<h2><span class="stage-num">Stage ${stage.n}.</span> ${escapeHtml(stage.title)} <span class="tmeta">— ${done}/${items.length} earned</span></h2>` +
      `<p>${escapeHtml(stage.text)}</p>` +
      `<ul>${items.map((t) => {
        const earned = state.earned.has(t.id);
        return `<li class="${earned ? "" : "missing"}"><span class="dot">${earned ? "✓" : "○"}</span>` +
          `<span class="tname">${escapeHtml(trophyName(t))}</span>` +
          `<span class="tmeta">${t.grade}${t.missable ? " · missable" : ""}${t.target ? ` · ${escapeHtml(t.target)}` : ""}</span></li>`;
      }).join("")}</ul>`;
    host.appendChild(div);
  }
}

function renderMissables() {
  const host = document.getElementById("missableList");
  const items = state.trophies.filter((t) => t.missable);
  host.innerHTML = "";
  for (const t of items) {
    const div = document.createElement("div");
    div.className = "missable-card";
    // The "why" is the guide's own sentence that starts "Flagged missable":
    // it states the reason in the guide's words, instead of repeating the
    // whole guide. Fall back to the general rule if a guide ever lacks one.
    const whyMatch = t.guide.match(/Flagged missable[^.]*\./);
    const why = whyMatch
      ? whyMatch[0]
      : "The official description names a single moment rather than a grind you can return to.";
    div.innerHTML =
      `<h3>${escapeHtml(trophyName(t))} <span class="tag grade-${t.grade}">${t.grade}</span></h3>` +
      `<p>“${escapeHtml(trophyDesc(t))}”</p>` +
      `<p class="why">${escapeHtml(why)}</p>` +
      `<p>${escapeHtml(t.guide)}</p>` +
      `<p class="sources">Sources: ${t.sources.map((s) => escapeHtml(sourceText(s))).join(" · ")}</p>`;
    host.appendChild(div);
  }
}

function setView(view) {
  state.view = view;
  document.querySelectorAll(".tab").forEach((b) => {
    const on = b.dataset.view === view;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll(".view").forEach((s) => {
    s.classList.toggle("active", s.id === `view-${view}`);
  });
  if (view === "roadmap") renderRoadmap();
  if (view === "missables") renderMissables();
}

function exportProgress() {
  const data = {
    app: "Leonida Ledger — GTA VI trophy guide",
    exported: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    spoiler: state.spoiler,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gta6-trophy-progress.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || !Array.isArray(data.earned)) throw new Error("not a progress file");
      const ids = new Set(state.trophies.map((t) => t.id));
      const kept = data.earned.filter((id) => ids.has(id));
      state.earned = new Set(kept);
      if (typeof data.spoiler === "boolean") {
        state.spoiler = data.spoiler;
        document.getElementById("spoilerToggle").checked = state.spoiler;
      }
      saveStored();
      renderProgress();
      renderList();
      renderDetail();
      alert(`Imported progress: ${kept.length} trophies earned.`);
    } catch (err) {
      alert("That file is not a Leonida Ledger progress export.");
    }
  };
  reader.readAsText(file);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function boot() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Could not load ${DATA_URL}: ${res.status}`);
  const data = await res.json();
  state.trophies = data.trophies;
  state.sources = data.sources || {};
  loadStored();
  if (state.demo) DEMO_EARNED.forEach((id) => state.earned.add(id));
  if (params.get("spoiler") === "off") state.spoiler = false;
  document.getElementById("spoilerToggle").checked = state.spoiler;

  document.querySelectorAll(".tab").forEach((b) =>
    b.addEventListener("click", () => setView(b.dataset.view)));
  document.getElementById("search").addEventListener("input", (e) => {
    state.search = e.target.value;
    renderList();
  });
  document.getElementById("kindFilter").addEventListener("change", (e) => {
    state.kind = e.target.value;
    renderList();
  });
  document.getElementById("gradeFilter").addEventListener("change", (e) => {
    state.grade = e.target.value;
    renderList();
  });
  document.getElementById("statusFilter").addEventListener("change", (e) => {
    state.status = e.target.value;
    renderList();
  });
  document.getElementById("missableOnly").addEventListener("change", (e) => {
    state.missableOnly = e.target.checked;
    renderList();
  });
  document.getElementById("spoilerToggle").addEventListener("change", (e) => {
    state.spoiler = e.target.checked;
    saveStored();
    renderProgress();
    renderList();
    renderDetail();
  });
  document.getElementById("exportBtn").addEventListener("click", exportProgress);
  document.getElementById("importFile").addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = "";
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Clear all earned trophies? This cannot be undone.")) return;
    state.earned.clear();
    saveStored();
    renderProgress();
    renderList();
    renderDetail();
  });

  renderProgress();
  renderList();
  renderRoadmap();
  renderMissables();
  const view = params.get("view");
  if (view && ["checklist", "roadmap", "missables", "about"].includes(view)) setView(view);
  const open = Number(params.get("open"));
  if (open && state.trophies.some((t) => t.id === open)) selectTrophy(open);
}

boot().catch((err) => {
  document.getElementById("trophyList").innerHTML =
    `<li class="empty-note">The trophy list could not be loaded. Serve this folder with a static server and open index.html from it.</li>`;
  console.error(err);
});
