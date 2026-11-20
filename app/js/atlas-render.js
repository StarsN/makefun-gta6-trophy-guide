// Vice Trophy Atlas — rendering: the progress card, the checklist, the guide pane,
// the roadmap and the missables. All markup is built from the state, never fetched.

import {
  KIND_LABELS,
  STAGE_COPY,
  displayDescription,
  displayName,
  gradeTallies,
  isConcealed,
  missableReason,
  missableTrophies,
  nextTarget,
  sourceText,
  stageMembers,
  visibleTrophies,
} from "./atlas-store.js";

export function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function tagHtml(trophy) {
  return `<span class="tag grade-${trophy.grade}">${trophy.grade}</span>` +
    `<span class="tag">${KIND_LABELS[trophy.kind] || trophy.kind}</span>` +
    (trophy.missable ? `<span class="tag missable">Missable</span>` : "") +
    (trophy.target ? `<span class="tag target">${esc(trophy.target)}</span>` : "");
}

export function paintProgress(state) {
  const earned = state.earned.size;
  const total = state.trophies.length;
  document.getElementById("earnedCount").textContent = earned;
  const fill = document.getElementById("progressFill");
  fill.style.width = total ? `${Math.round((earned / total) * 100)}%` : "0%";
  const meter = document.getElementById("progressMeter");
  meter.setAttribute("aria-valuenow", String(earned));
  const counts = gradeTallies(state);
  document.getElementById("gradeLine").innerHTML =
    `Platinum <b>${counts.platinum[0]}/${counts.platinum[1]}</b> &middot; ` +
    `Gold <b>${counts.gold[0]}/${counts.gold[1]}</b> &middot; ` +
    `Silver <b>${counts.silver[0]}/${counts.silver[1]}</b> &middot; ` +
    `Bronze <b>${counts.bronze[0]}/${counts.bronze[1]}</b>`;
  const up = nextTarget(state);
  document.getElementById("nextLine").textContent = up
    ? `Next up: ${isConcealed(state, up) ? "a hidden story trophy" : up.name} — stage ${up.stage} of the roadmap.`
    : "Platinum earned — you're a Leonida Legend.";
  document.getElementById("missablePill").textContent =
    String(state.trophies.filter((t) => t.missable).length);
}

export function paintList(state, onToggle, onSelect) {
  const list = document.getElementById("trophyList");
  const items = visibleTrophies(state);
  document.getElementById("showingLine").textContent =
    `Showing ${items.length} of ${state.trophies.length} trophies` +
    (state.earned.size ? ` — ${state.earned.size} earned` : "");
  if (!items.length) {
    list.innerHTML = `<li class="empty-note">No trophies match these filters. Clear the search or widen the filters.</li>`;
    return;
  }
  list.innerHTML = "";
  for (const t of items) {
    const earned = state.earned.has(t.id);
    const li = document.createElement("li");
    li.className = "trophy" + (earned ? " done" : "") + (state.selected === t.id ? " picked" : "");
    li.dataset.id = String(t.id);
    li.innerHTML =
      `<input type="checkbox" ${earned ? "checked" : ""} aria-label="Mark ${esc(displayName(state, t))} as earned">` +
      `<div class="trophy-body"><div class="trophy-name"><span class="medal ${t.grade}" aria-hidden="true"></span>${esc(displayName(state, t))}</div>` +
      `<div class="trophy-desc">${esc(displayDescription(state, t))}</div>` +
      `<div class="trophy-tags">${tagHtml(t)}</div></div>` +
      `<span class="earned-flag">${earned ? "✓ Earned" : ""}</span>`;
    li.querySelector("input").addEventListener("change", (e) => {
      e.stopPropagation();
      onToggle(t.id);
    });
    li.setAttribute("tabindex", "0");
    li.addEventListener("click", (e) => {
      if (e.target.tagName === "INPUT") return; // the checkbox has its own handler
      onSelect(t.id);
    });
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(t.id);
      }
    });
    list.appendChild(li);
  }
}

export function paintDetail(state, onToggle) {
  const pane = document.getElementById("detailPane");
  const t = state.trophies.find((x) => x.id === state.selected);
  if (!t) {
    pane.innerHTML = `<p class="detail-empty">Select a trophy to read its guide, its sources, and when it can be missed.</p>`;
    return;
  }
  const earned = state.earned.has(t.id);
  const hidden = isConcealed(state, t);
  pane.innerHTML =
    `<h2>${esc(displayName(state, t))}</h2>` +
    `<p class="official">&ldquo;${esc(displayDescription(state, t))}&rdquo; — official description, grade ${t.grade}, ${KIND_LABELS[t.kind] || t.kind}${t.target ? `, target ${esc(t.target)}` : ""}${t.missable ? ", missable" : ""}.</p>` +
    (hidden
      ? `<p class="guide-text">Spoilers are on, so this story trophy's guide stays hidden too. Earn it — or turn spoilers off — to read the guide.</p>`
      : `<h3>Guide</h3><p class="guide-text">${esc(t.guide)}</p>` +
        `<h3>Sources</h3><ul class="sources">${t.sources.map((s) => `<li>${esc(sourceText(state, s))}</li>`).join("")}</ul>`) +
    `<div class="earn-row"><button type="button" id="detailToggle">${earned ? "Mark as not earned" : "Mark as earned"}</button></div>`;
  document.getElementById("detailToggle").addEventListener("click", () => onToggle(t.id));
}

export function paintRoadmap(state) {
  const host = document.getElementById("roadmapStages");
  host.innerHTML = "";
  for (const stage of STAGE_COPY) {
    const items = stageMembers(state, stage.n);
    const done = items.filter((t) => state.earned.has(t.id)).length;
    const div = document.createElement("div");
    div.className = "stage-card";
    div.innerHTML =
      `<h3><span class="stage-num">Stage ${stage.n}.</span> ${esc(stage.title)} <span class="tmeta">— ${done}/${items.length} earned</span></h3>` +
      `<p>${esc(stage.text)}</p>` +
      `<div class="stage-bar"><span style="width:${items.length ? Math.round((done / items.length) * 100) : 0}%"></span></div>` +
      `<ul class="stage-list">${items.map((t) => {
        const earned = state.earned.has(t.id);
        return `<li class="${earned ? "got" : ""}"><span class="dot">${earned ? "✓" : "○"}</span>` +
          `<span class="tname">${esc(displayName(state, t))}</span>` +
          `<span class="tmeta">${t.grade}${t.missable ? " · missable" : ""}${t.target ? ` · ${esc(t.target)}` : ""}</span></li>`;
      }).join("")}</ul>`;
    host.appendChild(div);
  }
}

export function paintMissables(state) {
  const host = document.getElementById("missableGrid");
  host.innerHTML = "";
  for (const t of missableTrophies(state)) {
    const div = document.createElement("div");
    div.className = "missable-card";
    // The "why" is the guide's own sentence holding "flagged missable"; the guide
    // below it drops that sentence so the card does not repeat it.
    const why = missableReason(t);
    const rest = t.guide.replace(why, "").replace(/^\s+/, "");
    div.innerHTML =
      `<h3>${esc(displayName(state, t))} <span class="tag grade-${t.grade}">${t.grade}</span></h3>` +
      `<p>&ldquo;${esc(displayDescription(state, t))}&rdquo;</p>` +
      `<p class="why">${esc(why)}</p>` +
      `<p>${esc(rest)}</p>` +
      `<p class="sources">Sources: ${t.sources.map((s) => esc(sourceText(state, s))).join(" · ")}</p>`;
    host.appendChild(div);
  }
}

export function switchView(state, view) {
  state.view = view;
  document.querySelectorAll(".tab").forEach((b) => {
    const on = b.dataset.view === view;
    b.classList.toggle("on", on);
    b.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll(".view").forEach((s) => {
    s.classList.toggle("on", s.id === `view-${view}`);
  });
  if (view === "roadmap") paintRoadmap(state);
  if (view === "missables") paintMissables(state);
}

export function repaintAll(state, onToggle, onSelect) {
  paintProgress(state);
  paintList(state, onToggle, onSelect);
  paintDetail(state, onToggle);
  paintRoadmap(state);
  paintMissables(state);
}
