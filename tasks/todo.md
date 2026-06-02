# Båtførerprøven treningsside — byggeplan

Avledet fra `plan_batforerprove_treningsside.md`. Avkrysningsliste for hele produktet.

## Fase 0 — Datainnsamling (scraping) ← PÅGÅR

- [x] Sett opp `scraper/` med dependencies (httpx, bs4, lxml, trafilatura, pypdf)
- [x] Lag kilderegister `scraper/sources.yaml` (14 kilder, offisielle + private)
- [x] Bygg crawler `scraper/fetch_sources.py` (robots.txt, høflig delay, depth-begrenset)
- [x] Bilde-nedlasting med alt/caption/checksum → `data/{site}/images/`
- [x] Seksjons-ankere per side (`anchors` i meta) + `enrich_anchors.py`-backfill
- [~] Skrap alle kilder → rå HTML, tekst, PDF, bilder *(kjører — sdir ferdig/pågår)*
- [ ] Lagre per kilde i `data/{source_site}/` (pages/, pdf/, images/, index.json)
- [ ] Lag global manifest `data/manifest.json` (checksum, etag, last-modified)
- [ ] Backfill ankere (`enrich_anchors.py`) etter crawl
- [ ] Bygg bildekatalog (`analyze_images.py`) — relevans-rangering
- [ ] Vision-analyse av fagbilder (sjømerker, lanterner, fyr, kart)

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

- [ ] Sett opp SvelteKit/React + Vite + TypeScript
- [ ] Implementer det maritime designsystemet (se Designprinsipp over)
- [ ] Datalag: last `sources/syllabus/concepts/questions.json`
- [ ] Quizmotor (Question/UserAnswer-modeller)
- [ ] Eksamensmodus (50 spørsmål / 60 min / 80 %)
- [ ] Lokal progresjonslagring (IndexedDB via Dexie)
- [ ] Klarhetsindeks-forside (maritimt dashbord)

## Fase 4 — Adaptiv og simulatorer

- [ ] Adaptiv spørsmålsutvelgelse (weakness/importance/due-score)
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
