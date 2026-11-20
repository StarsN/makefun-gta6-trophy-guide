// Vice Trophy Atlas — state: the trophy list, what the reader has earned, and the
// filters. Progress lives in localStorage; demo mode seeds a preview in memory only.

export const STORE_KEY = "vice-trophy-atlas-v1";

// The demo preview earns a spread of thirteen trophies across the kinds, so the
// screenshots show progress bars, per-grade counts and a guide pane already open.
export const DEMO_EARNED = [2, 3, 4, 5, 8, 10, 16, 21, 35, 42, 44, 46, 53];

export const KIND_LABELS = {
  story: "Story",
  mission: "Mission",
  activity: "Activity",
  collectible: "Collectible",
  exploration: "Exploration",
  combat: "Combat & crime",
  money: "Money",
  event: "Event",
  platinum: "Platinum",
};

export const STAGE_COPY = [
  { n: 1, title: "Play the story", text: "Chapters 1–4, the final mission, the named missions and the stranger strands. Do the partner trophies (Hot Together, Retail Therapy) while the story still pairs you up, and take Cal's fishing challenge and Bret's hunt when they appear." },
  { n: 2, title: "Activities & skills", text: "Try every activity once, then work the skill trophies: 250 stunts, 42 gold Shooting Range medals, 14 drone race wins, 20 race wins, 18 meditation spots, and the arcade, bowling and fishing stops." },
  { n: 3, title: "Explore the map", text: "All 52 areas of Leonida, 100 vehicles discovered, 10 registered to Scooter Bros, 8 garages bought, 100 WAiNK It locations and 3 card sets. These four feed each other — cover the map once, thoroughly." },
  { n: 4, title: "Crime & chaos", text: "Five bank vaults, the armored truck, one illegal operation per gang, the jewelry store, Combat Focus, the VCIA departure and the showroom smash. Plan each escape before the robbery." },
  { n: 5, title: "Money & cleanup", text: "Launder $250,000 of Marked Bills, spend $100,000 in the shops, finish 50 challenges, then the quiet moments: a cocktail on Ocean Beach, the second-try trophy and the strange event. Last of all, 100% completion and the platinum." },
];

export function freshState(data, params) {
  return {
    trophies: data.trophies,
    sources: data.sources || {},
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
}

export function loadSaved(state) {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.earned)) {
      for (const id of data.earned) state.earned.add(id);
    }
    if (typeof data.spoiler === "boolean") state.spoiler = data.spoiler;
  } catch (err) {
    console.warn("Vice Trophy Atlas: could not read saved progress:", err);
  }
}

export function saveSaved(state) {
  if (state.demo) return; // a demo preview is never written to storage
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      earned: [...state.earned].sort((a, b) => a - b),
      spoiler: state.spoiler,
    }));
  } catch (err) {
    console.warn("Vice Trophy Atlas: could not save progress:", err);
  }
}

export function flipEarned(state, id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveSaved(state);
}

export function gradeTallies(state) {
  const out = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const t of state.trophies) {
    out[t.grade][1] += 1;
    if (state.earned.has(t.id)) out[t.grade][0] += 1;
  }
  return out;
}

// A story trophy stays concealed while spoilers are hidden and it is unearned.
export function isConcealed(state, trophy) {
  return trophy.spoiler && state.spoiler && !state.earned.has(trophy.id);
}

export function displayName(state, trophy) {
  return isConcealed(state, trophy) ? "Hidden trophy — earn it to reveal" : trophy.name;
}

export function displayDescription(state, trophy) {
  return isConcealed(state, trophy)
    ? "A story trophy. Its name and description stay hidden until you earn it."
    : trophy.description;
}

export function nextTarget(state) {
  const order = [...state.trophies].sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  return order.find((t) => !state.earned.has(t.id)) || null;
}

export function visibleTrophies(state) {
  const q = state.search.trim().toLowerCase();
  return state.trophies.filter((t) => {
    if (state.kind !== "all" && t.kind !== state.kind) return false;
    if (state.grade !== "all" && t.grade !== state.grade) return false;
    if (state.status === "earned" && !state.earned.has(t.id)) return false;
    if (state.status === "missing" && state.earned.has(t.id)) return false;
    if (state.missableOnly && !t.missable) return false;
    if (!q) return true;
    // A concealed trophy must not match on its hidden name: search what is shown.
    const hay = (displayName(state, t) + " " + displayDescription(state, t) + " " + (t.target || "")).toLowerCase();
    return hay.includes(q);
  });
}

export function stageMembers(state, n) {
  return state.trophies.filter((t) => t.stage === n).sort((a, b) => a.id - b.id);
}

export function missableTrophies(state) {
  return state.trophies.filter((t) => t.missable).sort((a, b) => a.id - b.id);
}

// The "why" of a missable card is the guide's own sentence holding "flagged missable".
export function missableReason(trophy) {
  const hit = trophy.guide.match(/[^.]*flagged missable[^.]*\./);
  return hit
    ? hit[0].trim()
    : "The official description names a single moment rather than a grind you can return to.";
}

export function sourceText(state, key) {
  return state.sources[key] || key;
}
