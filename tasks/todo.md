# Båtførerprøven treningsside — byggeplan

Avledet fra `plan_batforerprove_treningsside.md`. Avkrysningsliste for hele produktet.

## Fase 0 — Datainnsamling (scraping) ← FERDIG ✅

- [x] Sett opp `scraper/` med dependencies (httpx, bs4, lxml, trafilatura, pypdf)
- [x] Lag kilderegister `scraper/sources.yaml` (14 kilder, offisielle + private)
- [x] Bygg crawler `scraper/fetch_sources.py` (robots.txt, høflig delay, depth-begrenset)
- [x] Bilde-nedlasting med alt/caption/checksum → `data/{site}/images/`
- [x] Seksjons-ankere per side (`anchors` i meta) + `enrich_anchors.py`-backfill
- [x] Skrap alle 14 kilder → 343 sider, 596 bilder, 17 relevante PDF-er
- [x] Lagre per kilde i `data/{source_site}/` (pages/, pdf/, images/, index.json)
- [x] Global manifest `data/manifest.json` + `rebuild_index.py` (multi-seed merge)
- [x] Backfill ankere (`enrich_anchors.py`) — 343 meta-filer
- [x] Bildekatalog (`analyze_images.py`) — 596 rangert, 304 prioritert
- [x] Vision-analyse av 48 fagbilder → `data/images_analysis.json` (+ per-site)
      med kategori, norsk term, konsept, gjenbruk/copyright-flagg
- [x] Respektert robots.txt (lovdata link-only); committed/pushed til GitHub
- Note: lovdata blokkert av robots (lenke-only per plan); goypasjoen/bliskipper
  er JS-tunge private sider (1 side hver) — lav prioritet, inspirasjon-only

## Fase 1 — Normalisering og innholdsmodell

- [ ] `scraper/parse_sources.py` — strukturer rådata
- [ ] `scraper/normalize.py` — bygg `data_processed/sources.json`
- [ ] Definer pensumstruktur `syllabus.json` (4 hovedområder)
- [ ] Definer konseptmodell `concepts.json`
- [ ] `scraper/diff.py` — kildeendringsvarsling (checksum-diff)

## Kildelenking-prinsipp (gjelder alt innhold) 🔗

**Hvert quizspørsmål, konsept og forklaring skal ha dyp lenke direkte til den
relevante offentlige nettsiden — ned til avsnitt/linje, ikke bare forsiden.**

- [ ] Scraper fanger overskrifts-`id`/ankere per side → `anchors` i meta-json
- [ ] `source_refs` som objekter (`{source_id, url#anker, section, quote}`)
- [ ] PDF-lenker med `#page=N`
- [ ] Validator krever minst én oppløsbar dyp lenke per spørsmål
- [ ] Frontend viser «Kilde»-lenke ved hver forklaring (åpner riktig seksjon)

## Fase 2 — Innhold (egne spørsmål)

- [ ] Lag 50–100 første spørsmål manuelt (`content/questions/`)
- [ ] Skriv egne forklaringer (`content/explanations/`)
- [ ] `scraper/validate_content.py` — JSON schema, dubletter, source_refs
- [ ] Utvid til 300 spørsmål (MVP 1-mål)

## Designprinsipp (gjelder hele frontend) ⚓

**Gjennomført maritim design og konsekvent stil på alle grafiske fremstillinger.**

- [ ] Etabler et maritimt designsystem tidlig (design tokens, brukes overalt):
  - Fargepalett: dyp marineblå, sjøgrønn, messing/tau-aksent, hvit/off-white
  - Typografi: ren, lesbar; tydelig nautisk/klassisk overskriftsfont
  - Ikonografi: konsistent strektykkelse og hjørneradius
- [ ] Felles SVG-stil for ALLE grafiske fremstillinger (sjømerker, lanterner,
      kompass, kart, vikeplikt-diagrammer) — samme strektykkelse, fargebruk,
      perspektiv og merkelapper på tvers av moduler
- [ ] Egenproduserte vektorgrafikker (ikke kopierte bilder) bygget i samme stil,
      basert på analyse av de skrapte fagbildene
- [ ] Subtile maritime detaljer (tau-/kompassmotiv) uten å gå på bekostning av
      lesbarhet eller mobilytelse
- [ ] Mørk «nattmodus» for lanterne-simulator (realistisk mørkeseilas)

## Fase 3 — Frontend (statisk webapp)

- [x] Statisk prototype `app/` (zero-build HTML/CSS/JS) — modern maritim layout
- [x] Maritimt designsystem (design tokens, palett, typografi) i `styles.css`
- [x] Felles SVG-illustrasjonsstil (boat / lantern / sjømerke-scener)
- [x] Quizmotor-prototype: spørsmål, svar, feedback, dyp kildelenke, klarhetsindeks
- [x] Responsiv (sidebar → hamburger på mobil)
- [ ] Koble til ekte data: `data/questions.json` (i stedet for SAMPLE)
- [ ] Eksamensmodus (50 spørsmål / 60 min / 80 %)
- [ ] Lokal progresjonslagring (IndexedDB via Dexie)
- [ ] Vurder migrering til SvelteKit/Vite når omfanget vokser

## Fase 4 — Adaptiv og simulatorer

- [ ] **Mestringsscore per emne** (0–1), oppdatert etter hvert svar
- [ ] **Adaptiv frekvens**: flere spørsmål på svake emner, færre på sterke
- [ ] Minimumsfrekvens-gulv for «spesielt viktige emner»
- [ ] Adaptiv spørsmålsutvelgelse (weakness/importance/due-score)
- [ ] Mestring + anbefaling vist i klarhetsindeks
- [ ] Spaced repetition / flashcards
- [ ] Sjømerke-simulator (lateral/kardinal/spesial)
- [ ] Lanterne-simulator
- [ ] Vikepliktsimulator
- [ ] Feillogg

## Fase 5 — Kart, PWA, polish

- [ ] Kartoppgaver (knop/fart/tid, kurs, peiling)
- [ ] Offline PWA (Service Worker)
- [ ] Eksport/import av progresjon
- [ ] Brukertesting (5–10 personer) og forbedring

## Fase 6 — Drift

- [ ] GitHub Actions: ukentlig kildekontroll (diff)
- [ ] Deploy (GitHub Pages / Cloudflare Pages)

---

## Review

(fylles ut etter hvert som faser fullføres)

### Fase 0 — status
- Pågår.
