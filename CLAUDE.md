# CLAUDE.md — Båtføreprøven treningsside

## Project overview

An interactive training site for the Norwegian recreational boating-licence exam
(**båtførerprøven**). It is **not** a copy of existing free quizzes — it is an own
training engine with own questions, own explanations, deep references to official
rules, analyzed reference images, mastery tracking and adaptive practice.

Authoritative framework = official public sources (Sjøfartsdirektoratet pensum,
Kystverket, lovdata, Redningsselskapet). Own content = explanations, questions,
answers, illustrations, progress logic. See `plan_batforerprove_treningsside.md`
for the full product plan and `tasks/todo.md` for the live build checklist.

## Pipeline / architecture

Data flows one direction: **scrape → analyze → author → database → export → frontend.**

```
scraper/   →  data/{site}/   →  content/ (SQLite DB)  →  docs/data/*.json  →  docs/ (web app)
```

- **`scraper/`** — polite, depth-limited crawler.
  - `fetch_sources.py` (reads `sources.yaml`): HTML + extracted text + PDFs +
    images + per-page `.meta.json` (checksum, etag, anchors) → `data/{site}/`.
  - `rebuild_index.py` rebuilds per-site `index.json` from disk (multi-seed sites
    share a folder). `enrich_anchors.py` backfills section anchors.
    `analyze_images.py` ranks images by relevance → `data/images_catalog.json`.
- **`data/{source_site}/`** — raw scraped material (pages/, pdf/, images/,
  index.json) + `manifest.json` + **`images_analysis.json`** (vision analysis of
  fagbilder: category, norsk term, what it shows, `reusable` flag).
- **`content/`** — the **authoritative content database**.
  - `schema.sql` — normalized SQLite (sources, syllabus_areas, topics, concepts,
    learning_goals, questions, choices, *_sources, images, concept_images).
  - `syllabus_seed.json` — official pensum (4 parts, revidert 2014).
  - `CRIB.md` — legally-accurate facts + canonical source URLs that content
    authors/verifiers must follow. **Keep this current** (rules change — see below).
  - `authored/*.json` — the actual concepts + questions (one file per content set).
  - `build_db.py` → `batforer.db`; `validate.py` (structure/sources/images);
    `export_json.py` → `docs/data/*.json` (+ copies reusable images to `docs/data/img/`).
- **`docs/`** — static, zero-build web app (the GitHub Pages root).
  - `index.html` + `styles.css` + `app.js` (vanilla, classic script — no build).
  - Maritime design system; loads `data/*.json` via `fetch` (needs http, not file://).
  - localStorage student profiles (name, mastery per concept, feillogg, answers);
    adaptive question selection; Klarhetsindeks.

## Conventions

- **Language: Norwegian (bokmål)** for all user-facing content and questions.
- Content is authored as JSON in `content/authored/` and is the source of truth
  along with the DB — **do not hand-edit `docs/data/*.json`**; regenerate them:
  `python content/build_db.py && python content/export_json.py`.
- Question schema: `mcq | bilde_symbol | numeric | scenario | flashcard`;
  `importance` ∈ normal/high/critical; `exam_area` ∈ sjomannskap/lover/navigasjon/
  **spesielt_viktige** (the 4th "area" is a weighting flag, not a concept group).
- Every question needs ≥1 deep `source_ref` (url with #anchor / paragraf).
- The maritime SVG/illustration style must stay consistent across modules.

## Running

```bash
# rebuild content DB + export frontend bundles
python content/validate.py
python content/build_db.py && python content/export_json.py

# preview the site (fetch needs http, not file://)
cd docs && python -m http.server 8000   # → http://localhost:8000

# re-scrape (rarely; polite, weekly/monthly cadence)
python scraper/fetch_sources.py --depth 2 --max-pages 60
python scraper/rebuild_index.py && python scraper/enrich_anchors.py
```

## Git workflow

- Commit and push after each substantive content/code change (HTTPS remote).
- `.gitignore` excludes `__pycache__`, `.claude/`, and `data/**/*.pdf` (large,
  mostly off-topic PDFs are kept local; relevant ones are force-added).

## Key correctness & licensing concerns

- **Rules change** — double-check boating regulations against official sources
  before trusting older pensum text. Known recent changes baked into `CRIB.md`:
  the under-16 **10-knot limit was removed 1 July 2021** (only hk now governs the
  age limit); **høyhastighetsbevis** required since 2023 (≥50 kn, 18 yr); promille
  0.8 ‰ for boats <15 m. When in doubt, verify and update `CRIB.md` first.
- **Copyright**: scraped images may be proprietary. `images_analysis.json` marks
  each with `reusable`. `export_json.py` **only publishes `reusable:true` images**;
  copyright ones are analyzed only (to author our own art), never displayed.
- Do **not** copy private quiz questions/text verbatim — rewrite in own words and
  cite the authoritative rule.
- Numeric questions (fart/tid/distanse) must be arithmetically correct
  (1 nm = 1852 m = 1 breddeminutt; fart[knop] = nm/time). Re-verify on change.
- Respect `robots.txt` (e.g. lovdata is link-only); keep crawl frequency low.
