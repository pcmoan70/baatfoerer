# Båtføreprøven — treningssimulator ⚓

En interaktiv, gratis treningsside for den norske **båtførerprøven**: adaptive
oppgaver, eksamensmodus, flashcards, sjømerker, lanterner og navigasjon — med
egne forklaringer og dype henvisninger til offentlige regler.

## 🌐 Åpne siden

**👉 https://pcmoan70.github.io/baatfoerer/**

Ingen innlogging. Fremgangen lagres lokalt i nettleseren din.

## Funksjoner

- **Adaptiv øving** — flere spørsmål på det du strever med, færre på det du kan
- **Eksamensmodus** — 50 spørsmål / 60 min / ≥ 80 % + eget krav på spesielt viktige emner
- **Flashcards** med spaced repetition (sjømerker, lanterner, fyr + konsepter)
- **Feillogg** — øv på oppgavene du svarte feil på; meld feil med ett klikk
- **Klarhetsindeks** og mestring per pensumområde
- **Flere elever** på samme enhet + sammenligning av prestasjoner
- 350 egne spørsmål som dekker hele pensum, med kildehenvisninger
- Verifiserte fagillustrasjoner (sjømerker/lanterner/fyr) med kreditering

## Innhold og kilder

Innholdet er bygget på offentlige, autoritative kilder (Sjøfartsdirektoratets
pensum, Kystverket, Lovdata/sjøveisreglene, Redningsselskapet) og fritt
lisensierte illustrasjoner fra Wikimedia Commons. Spørsmål og forklaringer er
skrevet med egne ord; reglene er dobbeltsjekket mot gjeldende regelverk.

> Siden er et privat treningsverktøy og ikke en offisiell tjeneste.

## For utviklere

Statisk nettside (ingen server) i `docs/`, bygget fra en SQLite-innholdsdatabase.

```bash
# bygg innholdsdatabasen og eksporter frontend-data
python content/validate.py
python content/build_db.py && python content/export_json.py

# forhåndsvis lokalt (fetch krever http, ikke file://)
cd docs && python -m http.server 8000   # → http://localhost:8000
```

Publisering: GitHub Pages, **Branch: `main`, mappe: `/docs`**.

Se `CLAUDE.md` for arkitektur (skrap → analyse → database → eksport → frontend)
og `tasks/todo.md` for byggeplan/status.
