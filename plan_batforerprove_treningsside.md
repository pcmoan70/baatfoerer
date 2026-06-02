# Plan for scraping og interaktiv treningsside til båtførerprøven

## Formål

Målet er å bygge en god, interaktiv webside for trening til båtførerprøven basert på gratis og offentlige ressurser.

Siden bør ikke være en kopi av eksisterende gratisquizer eller offentlige PDF-er. Den bør i stedet være en egen treningsmotor med:

- autoritative kildehenvisninger
- egenproduserte forklaringer
- egne quizspørsmål
- adaptiv trening
- eksamensmodus
- progresjonsmåling
- interaktive oppgaver for sjømerker, lanterner, vikeplikt og navigasjon

---

## 1. Avgrensning og kildepolitikk

Bruk kildene slik:

| Kilde | Bruk i systemet | Ikke gjør |
|---|---|---|
| Sjøfartsdirektoratets pensum | Autoritativ pensumstruktur, emner, læringsmål, lenker | Ikke republiser hele PDF-er eller hele tekstsider ukritisk |
| Sjøfartsdirektoratets skolekart | Lenke til nedlasting, kartoppgaver basert på egne formuleringer | Ikke redistribuer kartfiler uten å avklare lisens |
| Båtførerregisteret / Norsk Test | Eksamenformat, tid, hjelpemidler, beståttkrav | Ikke forsøk å hente ekte spørsmålsbank |
| Lovdata | Lenker og korte regelreferanser | Ikke massehent juridisk tekst hvis robots/lisens er uklar |
| Kystverket | Sjømerker, fyr, lykter, IALA, farvannsskilt | Ikke kopier hele illustrasjonsmateriell uten lisenssjekk |
| Private gratisquizer | Bruk kun som inspirasjon/test av dekning | Ikke skrap spørsmål/svar; det er trolig opphavsrettsbeskyttet |

### Grunnregel

Trygg modell:

```text
Skrap:
- URL
- tittel
- metadata
- kort sammendrag
- kildehenvisning
- sist endret / checksum
- struktur og emneliste

Lag selv:
- forklaringer
- spørsmål
- fasiter
- illustrasjoner
- simulatorer
- progresjonslogikk
```

Unngå:

```text
- kopiering av private quizspørsmål
- kopiering av hele PDF-er inn i appen
- skraping bak innlogging
- høyfrekvent crawling
- å fremstille siden som offisiell
```

---

## 2. Viktige kilder

### Offisielle / offentlige kilder

| Ressurs | URL | Bruk |
|---|---|---|
| Sjøfartsdirektoratet: pensum til båtførerprøven | https://www.sdir.no/fritidsbat/sertifikater/batforerbevis/pensum-til-batforerproven/ | Hovedstruktur for pensum |
| Sjøfartsdirektoratet: båtførerbevis | https://www.sdir.no/fritidsbat/sertifikater/batforerbevis/batforerbevis/ | Formell info om prøve og krav |
| Sjøfartsdirektoratet: skolekart | https://www.sdir.no/fritidsbat/sertifikater/batforerbevis/skolekart-til-batforerproven/ | Kart til prøveøving |
| Båtførerregisteret | https://xn--btfrerregisteret-dob85a.no/ | Prøveformat, kandidatinformasjon |
| Lovdata: forskrift | https://lovdata.no/dokument/SF/forskrift/2009-03-03-259 | Regler, alder, krav |
| Kystverket: fyr, lykter og sjømerker | https://www.kystverket.no/sjovegen/fyr-lykter-og-sjomerker/ | Sjømerker, fyr, lykter |
| Kystverket: BåtFart | https://www.kystverket.no/sjotransport-og-havn/fritidsbat2/batfart/ | Fartsgrenser |
| Kartverket: skolekart | https://www.kartverket.no/til-sjos/kart/skolekart | Ekstra karttrening |
| Redningsselskapet: sjøvettreglene | https://rs.no/sikker-til-sjos/sjovettreglene/ | Praktisk sjøvett og sikkerhet |

### Private gratisressurser

Disse kan brukes til inspirasjon og som sammenligningsgrunnlag, men ikke som råmateriale for kopiering.

| Ressurs | URL | Bruk |
|---|---|---|
| bUkt.no | https://bukt.no/ | Gratis øvingsoppgaver, inspirasjon |
| Gøy på sjøen | https://xn--gypsjen-gxa2of.no/batforerproven | Prøvesimulator, inspirasjon |
| BliSkipper gratis test | https://bliskipper.no/gratis-test-batforerproven | Kort gratis test |
| Lanternen quiz | https://www.lanternenkurs.no/quiz/ | Gratis quiz |
| Båtførerprøven.no gratistest | https://www.xn--btfrerprven-x8a3wf.no/emner/gratistest/ | Kort test |

---

## 3. Datainnsamling

Skrap primært:

- tittel
- URL
- kilde-ID
- type kilde
- offisiell/privat status
- emner
- metadata
- lenker til PDF-er
- sist endret, ETag eller checksum
- korte sammendrag
- kildehenvisninger

Ikke skrap private quizspørsmål og fasiter.

---

## 4. Kilderegister

Lag en `sources.yaml`:

```yaml
- id: sdir_pensum
  name: Sjøfartsdirektoratet pensum
  url: https://www.sdir.no/fritidsbat/sertifikater/batforerbevis/pensum-til-batforerproven/
  type: html_pdf
  authority: official
  crawl_frequency: weekly
  allowed_use: metadata_summary_links

- id: sdir_skolekart
  name: Sjøfartsdirektoratet skolekart
  url: https://www.sdir.no/fritidsbat/sertifikater/batforerbevis/skolekart-til-batforerproven/
  type: html_pdf
  authority: official
  crawl_frequency: monthly
  allowed_use: links_metadata

- id: kystverket_sjomerker
  name: Kystverket fyr, lykter og sjømerker
  url: https://www.kystverket.no/sjovegen/fyr-lykter-og-sjomerker/
  type: html
  authority: official
  crawl_frequency: monthly
  allowed_use: summary_links

- id: lovdata_batforer
  name: Forskrift om minstealder og båtførerbevis
  url: https://lovdata.no/dokument/SF/forskrift/2009-03-03-259
  type: html
  authority: official_law
  crawl_frequency: monthly
  allowed_use: citations_links
```

---

## 5. Scraper-arkitektur

Foreslått struktur:

```text
scrapers/
  fetch_sources.py
  parse_sdir.py
  parse_kystverket.py
  parse_lovdata.py
  parse_pdf.py
  normalize.py
  diff_sources.py

data_raw/
  html/
  pdf/
  screenshots_optional/

data_processed/
  sources.json
  syllabus.json
  concepts.json
  rules.json
  map_tasks.json
  generated_questions.json
```

### Python-pakker

```bash
pip install httpx beautifulsoup4 lxml pydantic pypdf python-frontmatter trafilatura
```

Hvis sider krever JavaScript:

```bash
pip install playwright
playwright install chromium
```

### Enkel fetch-funksjon

```python
import httpx
from pathlib import Path
from datetime import datetime

HEADERS = {
    "User-Agent": "BatforerTrainerBot/0.1 contact: your-email@example.com"
}

def fetch(url: str, out_path: Path) -> dict:
    with httpx.Client(headers=HEADERS, follow_redirects=True, timeout=20) as client:
        r = client.get(url)
        r.raise_for_status()
        out_path.write_bytes(r.content)

        return {
            "url": url,
            "status_code": r.status_code,
            "content_type": r.headers.get("content-type"),
            "etag": r.headers.get("etag"),
            "last_modified": r.headers.get("last-modified"),
            "fetched_at": datetime.utcnow().isoformat()
        }
```

### Viktige hensyn

- Bruk lav frekvens: ukentlig eller månedlig er nok.
- Respekter `robots.txt`.
- Bruk caching.
- Bruk `If-None-Match` og `If-Modified-Since`.
- Lag diff-varsling ved endringer.
- Ikke belast offentlige sider unødvendig.

---

## 6. Normalisering til pensummodell

Ikke bygg systemet rundt nettsider. Bygg det rundt konsepter.

Eksempel på `concepts.json`:

```json
{
  "id": "lanterner_side_lys",
  "title": "Sidelanterner",
  "module": "navigasjon",
  "submodule": "lanterner_og_signaler",
  "importance": "high",
  "exam_area": "spesielt_viktige_emner",
  "source_refs": ["sdir_pensum", "kystverket_sjomerker"],
  "learning_goals": [
    "Forstå forskjell på styrbord- og babordlanterne",
    "Kjenne fargene og når lanternene brukes",
    "Kunne tolke fartøyretning i mørke"
  ]
}
```

---

## 7. Spørsmålsmodell

Lag egne spørsmål.

Eksempel:

```json
{
  "id": "q_lanterner_001",
  "concept_id": "lanterner_side_lys",
  "type": "multiple_choice",
  "difficulty": 2,
  "question": "Du ser en grønn lanterne alene i mørket. Hva betyr det mest sannsynlig?",
  "choices": [
    "Du ser styrbord side av et fartøy",
    "Du ser babord side av et fartøy",
    "Fartøyet ligger for anker",
    "Fartøyet har motorstopp"
  ],
  "correct": 0,
  "explanation": "Grønn lanterne markerer styrbord side.",
  "tags": ["lanterner", "nattseilas", "spesielt_viktige_emner"],
  "source_refs": ["sdir_pensum"]
}
```

### Spørsmålstyper

| Type | Eksempel |
|---|---|
| Multiple choice | Hva betyr rødt lateralmerke? |
| Bilde-/symbolspørsmål | Hvilket kardinalmerke er dette? |
| Kartoppgave | Finn kurs fra A til B |
| Regneoppgave | Hvor langt går båten på 30 min ved 12 knop? |
| Scenario | Du møter seilbåt fra styrbord. Hva gjør du? |
| Feilfinningsoppgave | Hva er galt med denne seilasen? |
| Hurtigkort | Lanterner, sjømerker, knop, distanse, promille |

---

## 8. Interaktiv webside

Bygg siden som en PWA:

- fungerer på mobil
- fungerer offline
- krever ikke login
- lagrer progresjon lokalt
- kan hostes som statisk webside

### Forside

Eksempel:

```text
Dagens status:
- 63 % pensum dekket
- 78 % riktig siste 7 dager
- Svakeste emne: navigasjon/kart
- Klar for prøve? Nei, emne 4 er for svakt
```

### Hovedmoduler

1. **Diagnosetest**  
   20 spørsmål som estimerer nivå.

2. **Pensumkart**  
   Fire hovedområder:
   - Sjømannskap
   - Lover og regler
   - Navigasjon og kartlesing
   - Spesielt viktige emner

3. **Adaptiv quiz**  
   Spørsmål velges etter svakhet, glemsel og viktighet.

4. **Eksamensmodus**  
   50 spørsmål, 60 minutter, minst 80 % riktig, og separat kontroll av spesielt viktige emner.

5. **Karttreningsmodus**  
   Egne oppgaver knyttet til offisielle skolekartområder:
   - Tjøme
   - Flåvær
   - Nærøysundet
   - Tjeldsundet

6. **Sjømerke-simulator**
   - lateralmerker
   - kardinalmerker
   - spesialmerker
   - frittliggende grunner/farer
   - senterledsmerker

7. **Lanterne-simulator**
   - roter båt i mørke
   - identifiser fartøyretning
   - tren på hvilke lys som sees fra ulike vinkler

8. **Vikepliktsimulator**
   - to båter på kryssende kurs
   - bruker velger handling
   - systemet forklarer regel og trygg respons

9. **Spaced repetition**
   - flashcards
   - repetisjon etter glemselskurve
   - ekstra vekt på svake og viktige emner

10. **Feillogg**
    - feil konsept
    - feiltype
    - anbefalt repetisjon
    - kildehenvisning

---

## 9. Frontend-arkitektur

Foreslått stack:

```text
Frontend:
  Vite + React eller SvelteKit
  TypeScript
  IndexedDB for lokal progresjon
  Service Worker for offline
  SVG/Canvas for sjømerker, lanterner og kartoppgaver

Data:
  Static JSON bundles
  /data/syllabus.json
  /data/concepts.json
  /data/questions.json
  /data/sources.json

Hosting:
  GitHub Pages
  Cloudflare Pages
  Netlify
  Vercel static
```

Ingen server er nødvendig for førsteversjonen.

---

## 10. Quizmotor

TypeScript-modell:

```ts
type Question = {
  id: string;
  conceptId: string;
  type: "mcq" | "map" | "numeric" | "scenario" | "flashcard";
  difficulty: number;
  importance: "normal" | "high" | "critical";
  examArea: "sjomannskap" | "lover" | "navigasjon" | "spesielt_viktige";
  prompt: string;
  choices?: string[];
  correctAnswer: string | number;
  explanation: string;
  sourceRefs: string[];
};

type UserAnswer = {
  questionId: string;
  correct: boolean;
  latencyMs: number;
  timestamp: string;
  confidence?: 1 | 2 | 3 | 4 | 5;
};
```

### Spørsmålsutvalg for adaptiv trening

```text
score =
  2.0 * weaknessScore +
  1.5 * importanceScore +
  1.2 * dueForReviewScore +
  0.8 * difficultyMatch -
  0.5 * recentSeenPenalty
```

### Eksamensmodus

For eksamensmodus bør du ikke bruke adaptiv utvelgelse. Bruk heller fast fordeling etter pensumområder og egen beståttlogikk for spesielt viktige emner.

---

## 11. Kart- og navigasjonsoppgaver

Start enkelt.

### Oppgavetyper

1. **Knop, fart, tid, distanse**

```text
En båt går 18 knop. Hvor langt går den på 40 minutter?
```

2. **Kurs og kompass**

```text
Hva er motsatt kurs av 037°?
```

3. **Karttegn**

```text
Hva betyr dette symbolet?
```

4. **Posisjon og peiling**

```text
Du peiler fyr A til 045° og fyr B til 310°. Hvor er du?
```

5. **Sikker led**

```text
Velg trygg passering av kardinalmerket.
```

For en avansert versjon kan man bruke et bilde/SVG-lag over kartet og plassere interaktive punkter. Førsteversjonen bør heller lenke til offisielle kart og lage egne tekstlige kartoppgaver.

---

## 12. Innholdsgenerering

Lag et internt admin-script:

```text
1. Les concepts.json
2. For hvert konsept:
   - generer 5–20 spørsmål
   - varier vanskelighetsgrad
   - legg til forklaring
   - legg til kildehenvisning
3. Kjør validator
4. Eksporter til questions.json
```

### Validator

Validator bør sjekke:

```text
- Har alle spørsmål riktig svar?
- Har alle spørsmål forklaring?
- Har alle spørsmål source_refs?
- Finnes concept_id?
- Er emnefordelingen rimelig?
- Har kritiske emner nok spørsmål?
- Finnes dubletter?
- Er alternativene for like?
```

---

## 13. Kvalitetskontroll

### Automatisk

- JSON schema validation
- stavekontroll
- dublettdeteksjon
- test at alle quizer kan fullføres
- test at bestått/ikke bestått beregnes korrekt

### Faglig

- manuell sjekk av alle spesielt viktige emner
- manuell sjekk av alle vikepliktspørsmål
- manuell sjekk av kartoppgaver
- sjekk mot Sjøfartsdirektoratets pensum

### Brukertesting

- 5–10 personer som faktisk skal ta prøven
- logg hvilke spørsmål som misforstås
- marker uklare formuleringer
- forbedre forklaringer

---

## 14. Minimal førsteversjon

### MVP 1

```text
- Statisk webapp
- Pensumoversikt
- 300 egne spørsmål
- Eksamensmodus: 50 spørsmål / 60 min
- Feillogg
- Lokal progresjon
```

### MVP 2

```text
- Adaptiv øving
- Flashcards
- Sjømerke- og lanterne-modul
- Kildeendringsvarsling
```

### MVP 3

```text
- Kartoppgaver
- Offline PWA
- Eksport/import av progresjon
- QR-synk mellom enheter
```

---

## 15. Mappestruktur

```text
batforer-trener/
  app/
    src/
      components/
      quiz/
      progress/
      simulations/
      pages/
    public/
      data/
        sources.json
        syllabus.json
        concepts.json
        questions.json

  content/
    concepts/
    questions/
    explanations/
    source_notes/

  scraper/
    sources.yaml
    fetch_sources.py
    parse_sources.py
    normalize.py
    diff.py
    validate_content.py

  tests/
    quiz_engine.test.ts
    exam_logic.test.ts
    content_schema.test.ts
```

---

## 16. Anbefalt teknologistack

```text
Frontend:
- SvelteKit eller React + Vite
- TypeScript
- IndexedDB via Dexie.js
- SVG/Canvas for interaktive oppgaver

Scraping/content:
- Python
- httpx
- BeautifulSoup
- pypdf
- pydantic
- jsonschema

Deploy:
- GitHub Pages eller Cloudflare Pages
- GitHub Actions for ukentlig kildekontroll
```

---

## 17. Forslag til datamodeller

### Source

```ts
type Source = {
  id: string;
  name: string;
  url: string;
  authority: "official" | "official_law" | "ngo" | "private";
  allowedUse: "metadata" | "summary_links" | "links_only";
  lastChecked?: string;
  checksum?: string;
};
```

### Concept

```ts
type Concept = {
  id: string;
  title: string;
  module: string;
  submodule?: string;
  importance: "normal" | "high" | "critical";
  examArea: string;
  learningGoals: string[];
  sourceRefs: string[];
};
```

### Progress

```ts
type ConceptProgress = {
  conceptId: string;
  attempts: number;
  correct: number;
  lastSeen: string;
  mastery: number;
  dueAt?: string;
};
```

---

## 18. Beste produktidé

Lag siden som en treningssimulator, ikke bare som et nettkurs.

Den bør svare på tre spørsmål for brukeren:

```text
1. Hva må jeg kunne?
2. Hva kan jeg allerede?
3. Er jeg klar for prøven?
```

Kjernefunksjonen bør være en tydelig status:

```text
Klarhetsindeks: 84 %

Sjømannskap:             91 %
Lover og regler:          78 %
Navigasjon og kart:       72 %
Spesielt viktige emner:   86 %

Anbefaling:
Tren 25 minutter på navigasjon og vikeplikt før du tar ny prøve.
```

Dette gir mer verdi enn bare enda en samling flervalgsspørsmål.

---

## 19. Prioritert implementeringsrekkefølge

1. Lag kilderegister (`sources.yaml`)
2. Lag scraper for metadata og kildeendringer
3. Definer pensumstruktur (`syllabus.json`)
4. Definer konseptmodell (`concepts.json`)
5. Lag 50–100 første spørsmål manuelt
6. Bygg enkel quizmotor
7. Bygg eksamensmodus
8. Lag lokal progresjonslagring
9. Legg til adaptiv spørsmålsutvelgelse
10. Legg til sjømerke- og lanterne-simulator
11. Legg til kartoppgaver
12. Legg til offline PWA
13. Legg til eksport/import av progresjon
14. Brukertest og forbedre forklaringer

---

## 20. Kort konklusjon

Den beste løsningen er:

- statisk webapp uten server i førsteversjon
- offentlige kilder som autoritativt rammeverk
- egne spørsmål og forklaringer
- adaptiv trening
- klarhetsindeks før prøve
- sterk vekt på navigasjon, sjømerker, lanterner og vikeplikt
- ryddig kildehåndtering og lavfrekvent scraping

Dette er både teknisk enkelt, juridisk tryggere og pedagogisk bedre enn å kopiere eksisterende gratisquizer.
