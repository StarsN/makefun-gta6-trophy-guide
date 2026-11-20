# Leonida Ledger — GTA VI Trophy Guide & Tracker

An offline, open-source guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze). Static files only — serve `app/` with any static server and open `index.html` in a desktop browser with the network off.

## What it does

- **Checklist** of every trophy with its official name, description and grade, saved in the browser (localStorage), with **export / import** of progress as a JSON file.
- **Filters** by kind (story, mission, activity, collectible, exploration, combat & crime, money, event), grade, earned/missing, missable only, plus text search.
- **Spoiler setting**: hides the names and descriptions of story trophies until they are earned.
- **Roadmap to platinum**: five stages in order, with per-stage progress.
- **Missables**: the 10 trophies that can be missed, each with why — flagged from what the official description names (a single moment, person or choice, not a grind).
- **A guide to each trophy in our own words**, with its sources named beside it: the official trophy list on Exophase (names, descriptions, grades), PSNProfiles (PSN progress counts), and our own advice built from the official description. Steps that go beyond the description are labelled as not yet checked in the game.

## Try it

```sh
node serve.ts        # serves app/ at http://localhost:8080
```

Preview states for screenshots and testing (in-memory only, never saved):

- `?demo=1` seeds 13 earned trophies
- `?view=roadmap|missables|about` opens a section
- `?open=<id>` opens one trophy's guide
- `?spoiler=off` shows story trophy names

## Handing it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library (`vendor/makefun-frontend.ts`, the kit's copy, unchanged).

## Files

- `app/index.html`, `app/style.css`, `app/app.js` — the guide itself
- `app/data/trophies.json` — the 55 trophies: official name, description and grade, plus kind, missable flag, spoiler flag, roadmap stage, target count and the guide
- `screenshots/` — renders of the guide in a browser
- `main.ts`, `serve.ts`, `vendor/makefun-frontend.ts`

## License

MIT — see `LICENSE`. Unofficial and fan-made: Grand Theft Auto VI and its trophies belong to their owners. Trophy names and descriptions are shown as PlayStation publishes them; all guide text is this guide's own words.
