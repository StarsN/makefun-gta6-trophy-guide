[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/StarsN/makefun-gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/StarsN/makefun-gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

[make.fun bounty: Build the best GTA 6 trophy guide](https://make.fun/bounty/gta6-trophy-guide-01)

# Vice Trophy Atlas — GTA VI Trophy Guide & Tracker

An offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI: 1 platinum, 2 gold, 6 silver and 46 bronze. Every trophy carries its official name, description and grade, a guide written in the Atlas's own words that cites its sources, and a tracker that remembers your progress.

## What it does

- **Checklist** — tick a trophy off when you earn it; progress is saved in the browser (localStorage) and survives reloads. Export it to a JSON file and import it back on another machine.
- **Filters** — narrow the list by kind (story, mission, activity, collectible, exploration, combat, money, event, platinum), grade, earned or missing, missable only, or free-text search.
- **Spoiler switch** — with spoilers hidden, story trophies stay unnamed and undescribed until you earn them (or turn the switch off).
- **Roadmap** — five stages to the platinum, in order, each with its own progress bar: story first (the missables live there), then activities, then the map, then crime, then money and cleanup.
- **Missables** — the ten one-shot trophies, each with the reason it cannot wait, in the guide's own words.
- **Guides with sources** — every guide cites where its facts come from: the official trophy description (PlayStation, via Exophase and PSNProfiles), PSNProfiles for the progress target where a trophy tracks a count, and the Atlas's own advice for the strategy.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. It works with the network off: every file it loads lives under `app/`, and it makes no network request at run time.

Demo mode: open with `?demo=1` to preview the Atlas with 13 trophies already earned (in memory only, never saved). `?view=roadmap` or `?view=missables` opens a view directly; `?open=<id>` opens one trophy's guide; `?spoiler=off` shows story names; `?q=<text>` pre-fills the search.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Sources

Official trophy names, descriptions and grades are as PlayStation publishes them, as listed by Exophase and PSNProfiles (the two agree on every name, description and grade). Progress targets (counts) come from PSNProfiles. Every guide is written in the Atlas's own words. No Rockstar Games logo, artwork or screenshot appears anywhere in this guide; Grand Theft Auto and GTA are trademarks of Take-Two Interactive, and this is an unofficial fan guide, not affiliated with or endorsed by Rockstar Games or PlayStation.
