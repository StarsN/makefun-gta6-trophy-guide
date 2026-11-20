// Leonida Ledger — GTA VI trophy guide and tracker.
// A static offline app: it loads data/trophies.json from its own folder,
// stores progress in localStorage, and makes no other request of any kind.

const DATA_URL = "data/trophies.json";
const STORE_KEY = "gta6-trophy-progress-v1";
const TOTAL = 55;

const KIND_LABEL = {
  story: "Story",
  mission: "Mission",
  activity: "Activity",
  collectible: "Collectible",
  exploration: "Exploration",
  combat: "Combat & crime",
  money: "Money",
  event: "Event",
};

const GRADES = ["platinum", "gold", "silver", "bronze"];
const GRADE_LABEL = {
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
};

const STAGES = [
  { n: 1, title: "Play the story", text: "Chapters 1–4, the final mission, the named missions and the stranger strands. Do the partner trophies (Hot Together, Retail Therapy) while the story still pairs you up, and take Cal's fishing challenge and Bret's hunt when they appear." },
  { n: 2, title: "Activities & skills", text: "Try every activity once, then work the skill trophies: 250 stunts, 42 gold Shooting Range medals, 14 drone race wins, 20 race wins, 18 meditation spots, and the arcade, bowling and fishing stops." },
  { n: 3, title: "Explore the map", text: "All 52 areas of Leonida, 100 vehicles discovered, 10 registered to Scooter Bros, 8 garages bought, 100 WAiNK It locations and 3 card sets. These four feed each other — cover the map once, thoroughly." },
  { n: 4, title: "Crime & chaos", text: "Five bank vaults, the armored truck, one illegal operation per gang, the jewelry store, Combat Focus, the VCIA departure and the showroom smash. Plan each escape before the robbery." },
  { n: 5, title: "Money & cleanup", text: "Launder $250,000 of Marked Bills, spend $100,000 in the shops, finish 50 challenges, then the quiet moments: a cocktail on Ocean Beach, the second-try trophy and the strange event. Last of all, 100% completion and the platinum." },
];

// Preview helpers for screenshots and trying the guide: ?demo=1 seeds 13
// earned trophies in memory only, ?tab=roadmap|missables opens a tab,
// ?open=<id> opens one trophy's guide, ?spoiler=off shows story names.
const params = new URLSearchParams(location.search);
const DEMO_EARNED = [2, 3, 4, 5, 8, 10, 16, 21, 35, 42, 44, 46, 53];

const S = {
  list: [],
  notes: {},
  got: new Set(),
  spoilers: true,
  kind: "all",
  grade: "all",
  status: "all",
  missable: false,
  query: "",
  tab: "checklist",
  open: null,
  demo: params.get("demo") === "1",
};

function loadStored() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) saved.earned.forEach((id) => S.got.add(id));
    if (typeof saved.spoiler === "boolean") S.spoilers = saved.spoiler;
  } catch (err) {
    console.warn("Could not read saved progress:", err);
  }
}

function saveStored() {
  if (S.demo) return; // demo progress is a preview, never saved
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      earned: [...S.got].sort((a, b) => a - b),
      spoiler: S.spoilers,
    }));
  } catch (err) {
    console.warn("Could not save progress:", err);
  }
}

function isHidden(t) {
  return t.spoiler && S.spoilers && !S.got.has(t.id);
}

function shownName(t) {
  return isHidden(t) ? "Hidden trophy — earn it to reveal" : t.name;
}

function shownDesc(t) {
  return isHidden(t) ? "A story trophy. Its name and description stay hidden until you earn it." : t.description;
}

function countsByGrade() {
  const out = {};
  for (const g of GRADES) out[g] = [0, 0];
  for (const t of S.list) {
    out[t.grade][1] += 1;
    if (S.got.has(t.id)) out[t.grade][0] += 1;
  }
  return out;
}

function countsByKind() {
  const out = {};
  for (const t of S.list) out[t.kind] = (out[t.kind] || 0) + 1;
  return out;
}

function nextTarget() {
  const ordered = [...S.list].sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  return ordered.find((t) => !S.got.has(t.id)) || null;
}

function paintHeader() {
  const earned = S.got.size;
  const total = S.list.length || TOTAL;
  document.getElementById("earnedNum").textContent = earned;
  const fill = document.getElementById("barFill");
  fill.style.width = total ? `${Math.round((earned / total) * 100)}%` : "0%";
  const wrap = document.getElementById("barWrap");
  wrap.setAttribute("aria-valuenow", String(earned));
  wrap.setAttribute("aria-valuemax", String(total));

  const tally = countsByGrade();
  document.getElementById("gradeList").innerHTML = GRADES.map((g) => {
    const [done, all] = tally[g];
    const pct = all ? Math.round((done / all) * 100) : 0;
    return `<li><span class="grade-name"><span class="dot ${g}" aria-hidden="true"></span>${GRADE_LABEL[g]} <b>${done}/${all}</b></span>` +
      `<span class="grade-track"><span class="grade-fill fill-${g}" style="width:${pct}%"></span></span></li>`;
  }).join("");

  const next = nextTarget();
  document.getElementById("nextLine").textContent = next
    ? `Next up: ${isHidden(next) ? "a hidden story trophy" : next.name} — stage ${next.stage} of the roadmap.`
    : "Platinum earned — you're a Leonida Legend.";
  document.getElementById("missCount").textContent =
    S.list.filter((t) => t.missable).length;

  // Kind filter options carry their counts, so the reader sees the shape
  // of the list at a glance.
  const kinds = countsByKind();
  document.querySelectorAll("#kindPick option").forEach((opt) => {
    if (opt.value !== "all") opt.textContent = `${KIND_LABEL[opt.value]} · ${kinds[opt.value] || 0}`;
  });
}

function matchingList() {
  const needle = S.query.trim().toLowerCase();
  return S.list.filter((t) => {
    if (S.kind !== "all" && t.kind !== S.kind) return false;
    if (S.grade !== "all" && t.grade !== S.grade) return false;
    if (S.status === "earned" && !S.got.has(t.id)) return false;
    if (S.status === "missing" && S.got.has(t.id)) return false;
    if (S.missable && !t.missable) return false;
    if (needle) {
      // Search only what the reader can actually see: a hidden story
      // trophy is matched by its placeholder text, not its hidden name.
      const hay = `${shownName(t)} ${shownDesc(t)} ${t.target || ""}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function paintRows() {
  const host = document.getElementById("rows");
  const shown = matchingList();
  document.getElementById("countLine").textContent =
    `Showing ${shown.length} of ${S.list.length} trophies` +
    (S.got.size ? ` — ${S.got.size} earned` : "");
  if (!shown.length) {
    host.innerHTML = `<li class="empty-row">No trophies match these filters. Clear the search or widen the filters.</li>`;
    return;
  }
  host.innerHTML = "";
  for (const t of shown) {
    const got = S.got.has(t.id);
    const row = document.createElement("li");
    row.className = "row" + (got ? " got" : "") + (S.open === t.id ? " open" : "");
    row.dataset.id = t.id;
    row.innerHTML =
      `<input type="checkbox" ${got ? "checked" : ""} aria-label="Mark ${esc(shownName(t))} as earned">` +
      `<div class="row-main"><div class="row-title"><span class="dot ${t.grade}" aria-hidden="true"></span>${esc(shownName(t))}</div>` +
      `<div class="row-desc">${esc(shownDesc(t))}</div>` +
      `<div class="row-tags">` +
      `<span class="chip grade-${t.grade}">${t.grade}</span>` +
      `<span class="chip">${KIND_LABEL[t.kind] || t.kind}</span>` +
      (t.missable ? `<span class="chip miss">Missable</span>` : "") +
      (t.target ? `<span class="chip target">${esc(t.target)}</span>` : "") +
      `</div></div>` +
      `<span class="got-mark">${got ? "✓ Earned" : ""}</span>`;
    row.querySelector("input").addEventListener("change", (e) => {
      e.stopPropagation();
      toggleGot(t.id);
    });
    row.setAttribute("tabindex", "0");
    row.addEventListener("click", (e) => {
      if (e.target.tagName === "INPUT") return; // the checkbox has its own handler
      openDetail(t.id);
    });
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDetail(t.id);
      }
    });
    host.appendChild(row);
  }
}

function toggleGot(id) {
  if (S.got.has(id)) S.got.delete(id);
  else S.got.add(id);
  saveStored();
  paintHeader();
  paintRows();
  if (S.open === id) paintDetail();
}

function openDetail(id) {
  S.open = id;
  paintRows();
  paintDetail();
  document.getElementById("detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function noteText(key) {
  return S.notes[key] || key;
}

function paintDetail() {
  const pane = document.getElementById("detail");
  const t = S.list.find((x) => x.id === S.open);
  if (!t) {
    pane.innerHTML = `<p class="detail-empty">Select a trophy to read its guide, its sources, and when it can be missed.</p>`;
    return;
  }
  const got = S.got.has(t.id);
  const hidden = isHidden(t);
  const stage = STAGES.find((s) => s.n === t.stage);
  pane.innerHTML =
    `<h2>${esc(shownName(t))}</h2>` +
    `<p class="official">“${esc(shownDesc(t))}” — official description, grade ${t.grade}, ${KIND_LABEL[t.kind] || t.kind}` +
    `${t.target ? `, target ${esc(t.target)}` : ""}` +
    `${t.missable ? ", missable" : ""}` +
    `${stage ? `, roadmap stage ${stage.n} — ${esc(stage.title)}` : ""}.</p>` +
    (hidden
      ? `<p class="guide-text">Spoilers are on, so this story trophy's guide stays hidden too. Earn it — or turn spoilers off — to read the guide.</p>`
      : `<h3>Guide</h3><p class="guide-text">${esc(t.guide)}</p>` +
        `<h3>Sources</h3><ul class="source-list">${t.sources.map((s) => `<li>${esc(noteText(s))}</li>`).join("")}</ul>`) +
    `<div class="detail-actions"><button type="button" id="detailToggle">${got ? "Mark as not earned" : "Mark as earned"}</button></div>`;
  document.getElementById("detailToggle").addEventListener("click", () => toggleGot(t.id));
}

function paintRoadmap() {
  const host = document.getElementById("roadmapWrap");
  host.innerHTML = "";
  for (const step of STAGES) {
    const members = S.list.filter((t) => t.stage === step.n).sort((a, b) => a.id - b.id);
    const done = members.filter((t) => S.got.has(t.id)).length;
    const pct = members.length ? Math.round((done / members.length) * 100) : 0;
    const card = document.createElement("div");
    card.className = "stage";
    card.innerHTML =
      `<h2><span class="stage-num">Stage ${step.n}.</span> ${esc(step.title)} <span class="stage-done">— ${done}/${members.length} earned</span></h2>` +
      `<div class="stage-bar"><span style="width:${pct}%"></span></div>` +
      `<p>${esc(step.text)}</p>` +
      `<ul>${members.map((t) => {
        const got = S.got.has(t.id);
        return `<li class="${got ? "" : "todo"}"><span class="tick">${got ? "✓" : "○"}</span>` +
          `<span class="stage-name">${esc(shownName(t))}</span>` +
          `<span class="stage-meta">${t.grade}${t.missable ? " · missable" : ""}${t.target ? ` · ${esc(t.target)}` : ""}</span></li>`;
      }).join("")}</ul>`;
    host.appendChild(card);
  }
}

// The "why" for a missable trophy is the guide's own sentence that starts
// "Flagged missable": it states the reason in the guide's words, instead of
// repeating the whole guide. Falls back to the general rule.
function missReason(t) {
  const found = t.guide.match(/Flagged missable[^.]*\./);
  return found
    ? found[0]
    : "The official description names a single moment rather than a grind you can return to.";
}

function paintMissables() {
  const host = document.getElementById("missWrap");
  const items = S.list.filter((t) => t.missable);
  host.innerHTML = "";
  for (const t of items) {
    const card = document.createElement("div");
    card.className = "miss-card";
    // The "why" line above already carries the guide's "Flagged missable"
    // sentence, so the body below shows the guide without repeating it.
    const body = t.guide.replace(/Flagged missable[^.]*\.\s*/, "");
    card.innerHTML =
      `<h3>${esc(shownName(t))} <span class="chip grade-${t.grade}">${t.grade}</span></h3>` +
      `<p>“${esc(shownDesc(t))}”</p>` +
      `<p class="miss-why">${esc(missReason(t))}</p>` +
      `<p>${esc(body)}</p>` +
      `<p class="miss-sources">Sources: ${t.sources.map((s) => esc(noteText(s))).join(" · ")}</p>`;
    host.appendChild(card);
  }
}

function switchTab(tab) {
  S.tab = tab;
  document.querySelectorAll(".tab-btn").forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.toggle("is-on", v.id === `sec-${tab}`);
  });
  if (tab === "roadmap") paintRoadmap();
  if (tab === "missables") paintMissables();
}

function exportFile() {
  const payload = {
    app: "Leonida Ledger — GTA VI trophy guide",
    exported: new Date().toISOString(),
    earned: [...S.got].sort((a, b) => a - b),
    spoiler: S.spoilers,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gta6-trophy-progress.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || !Array.isArray(data.earned)) throw new Error("not a progress file");
      const known = new Set(S.list.map((t) => t.id));
      const kept = data.earned.filter((id) => known.has(id));
      S.got = new Set(kept);
      if (typeof data.spoiler === "boolean") {
        S.spoilers = data.spoiler;
        document.getElementById("spoilerBox").checked = S.spoilers;
      }
      saveStored();
      paintHeader();
      paintRows();
      paintDetail();
      alert(`Imported progress: ${kept.length} trophies earned.`);
    } catch (err) {
      alert("That file is not a Leonida Ledger progress export.");
    }
  };
  reader.readAsText(file);
}

async function boot() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Could not load ${DATA_URL}: ${res.status}`);
  const data = await res.json();
  S.list = data.trophies;
  S.notes = data.sources || {};
  loadStored();
  if (S.demo) DEMO_EARNED.forEach((id) => S.got.add(id));
  if (params.get("spoiler") === "off") S.spoilers = false;
  document.getElementById("spoilerBox").checked = S.spoilers;

  document.querySelectorAll(".tab-btn").forEach((b) =>
    b.addEventListener("click", () => switchTab(b.dataset.tab)));
  document.getElementById("searchInput").addEventListener("input", (e) => {
    S.query = e.target.value;
    paintRows();
  });
  document.getElementById("kindPick").addEventListener("change", (e) => {
    S.kind = e.target.value;
    paintRows();
  });
  document.getElementById("gradePick").addEventListener("change", (e) => {
    S.grade = e.target.value;
    paintRows();
  });
  document.getElementById("statusPick").addEventListener("change", (e) => {
    S.status = e.target.value;
    paintRows();
  });
  document.getElementById("missOnly").addEventListener("change", (e) => {
    S.missable = e.target.checked;
    paintRows();
  });
  document.getElementById("spoilerBox").addEventListener("change", (e) => {
    S.spoilers = e.target.checked;
    saveStored();
    paintHeader();
    paintRows();
    paintDetail();
  });
  document.getElementById("exportBtn").addEventListener("click", exportFile);
  document.getElementById("importFile").addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) importFile(e.target.files[0]);
    e.target.value = "";
  });
  document.getElementById("wipeBtn").addEventListener("click", () => {
    if (!confirm("Clear all earned trophies? This cannot be undone.")) return;
    S.got.clear();
    saveStored();
    paintHeader();
    paintRows();
    paintDetail();
  });

  paintHeader();
  paintRows();
  paintRoadmap();
  paintMissables();
  // A ?q= term pre-fills the search, so a link can open the guide on one
  // slice of the list — the screenshots use ?q=hidden to show the spoiler
  // setting hiding unearned story trophies.
  const preset = params.get("q");
  if (preset) {
    S.query = preset;
    document.getElementById("searchInput").value = preset;
    paintRows();
  }
  const tab = params.get("tab");
  if (tab && ["checklist", "roadmap", "missables", "about"].includes(tab)) switchTab(tab);
  const open = Number(params.get("open"));
  if (open && S.list.some((t) => t.id === open)) openDetail(open);
}

boot().catch((err) => {
  document.getElementById("rows").innerHTML =
    `<li class="empty-row">The trophy list could not be loaded. Serve this folder with a static server and open index.html from it.</li>`;
  console.error(err);
});
