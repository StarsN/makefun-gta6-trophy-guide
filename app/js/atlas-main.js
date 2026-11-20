// Vice Trophy Atlas — boot: loads the trophy data, wires the controls, and reads the
// URL for demo and deep-link modes (?demo=1, ?view=, ?open=<id>, ?spoiler=off, ?q=).

import {
  DEMO_EARNED,
  flipEarned,
  freshState,
  loadSaved,
  saveSaved,
} from "./atlas-store.js";
import {
  paintDetail,
  paintList,
  paintProgress,
  repaintAll,
  switchView,
} from "./atlas-render.js";

const DATA_URL = "data/trophies.json";
const params = new URLSearchParams(location.search);

function downloadProgress(state) {
  const data = {
    app: "Vice Trophy Atlas — GTA VI trophy guide",
    exported: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    spoiler: state.spoiler,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "vice-trophy-atlas-progress.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function uploadProgress(state, file, refresh) {
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
        document.getElementById("spoilerSwitch").checked = state.spoiler;
      }
      saveSaved(state);
      refresh();
      alert(`Imported progress: ${kept.length} trophies earned.`);
    } catch (err) {
      alert("That file is not a Vice Trophy Atlas progress export.");
    }
  };
  reader.readAsText(file);
}

async function boot() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Could not load ${DATA_URL}: ${res.status}`);
  const data = await res.json();
  const state = freshState(data, params);
  loadSaved(state);
  if (state.demo) DEMO_EARNED.forEach((id) => state.earned.add(id));
  if (params.get("spoiler") === "off") state.spoiler = false;
  document.getElementById("spoilerSwitch").checked = state.spoiler;

  const refresh = () => repaintAll(state, onToggle, onSelect);
  function onToggle(id) {
    flipEarned(state, id);
    refresh();
  }
  function onSelect(id, scroll = true) {
    state.selected = id;
    paintList(state, onToggle, onSelect);
    paintDetail(state, onToggle);
    // A click scrolls the guide pane into view; a deep link (?open=) does not,
    // so a linked page still opens at the top.
    if (scroll) document.getElementById("detailPane").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  document.querySelectorAll(".tab").forEach((b) =>
    b.addEventListener("click", () => switchView(state, b.dataset.view)));
  document.getElementById("searchBox").addEventListener("input", (e) => {
    state.search = e.target.value;
    paintList(state, onToggle, onSelect);
  });
  document.getElementById("kindPick").addEventListener("change", (e) => {
    state.kind = e.target.value;
    paintList(state, onToggle, onSelect);
  });
  document.getElementById("gradePick").addEventListener("change", (e) => {
    state.grade = e.target.value;
    paintList(state, onToggle, onSelect);
  });
  document.getElementById("statusPick").addEventListener("change", (e) => {
    state.status = e.target.value;
    paintList(state, onToggle, onSelect);
  });
  document.getElementById("missableOnly").addEventListener("change", (e) => {
    state.missableOnly = e.target.checked;
    paintList(state, onToggle, onSelect);
  });
  document.getElementById("spoilerSwitch").addEventListener("change", (e) => {
    state.spoiler = e.target.checked;
    saveSaved(state);
    refresh();
  });
  document.getElementById("exportBtn").addEventListener("click", () => downloadProgress(state));
  document.getElementById("importFile").addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) uploadProgress(state, e.target.files[0], refresh);
    e.target.value = "";
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Clear all earned trophies? This cannot be undone.")) return;
    state.earned.clear();
    saveSaved(state);
    refresh();
  });

  const q = params.get("q");
  if (q) {
    state.search = q;
    document.getElementById("searchBox").value = q;
  }

  refresh();
  const view = params.get("view");
  if (view && ["checklist", "roadmap", "missables", "about"].includes(view)) switchView(state, view);
  const open = Number(params.get("open"));
  if (open && state.trophies.some((t) => t.id === open)) onSelect(open, false);
  window.__shotReady = true;
}

boot().catch((err) => {
  document.getElementById("trophyList").innerHTML =
    `<li class="empty-note">The trophy list could not be loaded. Serve this folder with a static server and open index.html from it.</li>`;
  console.error(err);
  window.__shotReady = true;
});
