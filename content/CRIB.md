# Innholds-crib for båtførerprøve-innhold (LES NØYE)

Du skriver innhold til en treningsside for den norske båtførerprøven. Alt skal være
**på norsk (bokmål)**, **faglig korrekt** og i **egne formuleringer** (aldri kopier
setninger fra private kilder — skriv om). Når du er usikker på et juridisk faktum:
vær konservativ, henvis til kilden, og IKKE dikt opp paragraf-tekst.

## Utdataformat (JSON)

Skriv én JSON-fil med to lister: `concepts` og `questions`.

```json
{
  "concepts": [
    {
      "id": "kebab_unik_id",
      "area": "sjomannskap | lover | navigasjon",
      "topic": "menneskelesbar emnetittel",
      "title": "Konsepttittel",
      "importance": "normal | high | critical",
      "exam_area": "sjomannskap | lover | navigasjon | spesielt_viktige",
      "summary": "1–2 setninger.",
      "body": "Grundig forklaring i egne ord (markdown ok). Vær informativ — sikt mot mye, korrekt informasjon.",
      "learning_goals": ["...", "..."],
      "image_files": ["kystverket/images/...png"],
      "source_refs": [
        {"source_id": "kystverket_sjomerker", "url": "https://...#anker", "section": "Lateralmerker", "quote": "kort sitat/regelreferanse"}
      ]
    }
  ],
  "questions": [
    {
      "id": "q_unik_001",
      "concept_id": "kebab_unik_id",
      "type": "mcq | bilde_symbol | numeric | scenario | flashcard",
      "difficulty": 1,
      "importance": "normal | high | critical",
      "exam_area": "spesielt_viktige | ...",
      "prompt": "Spørsmålstekst.",
      "choices": ["alt A", "alt B", "alt C", "alt D"],
      "correct": 0,
      "explanation": "Hvorfor riktig, kort og korrekt.",
      "image_file": "kystverket/images/...png",
      "source_refs": [{"source_id": "...", "url": "https://...", "section": "...", "quote": "..."}]
    }
  ]
}
```

Regler:
- `choices`/`correct` kreves for mcq, bilde_symbol, scenario, numeric. `flashcard` kan ha tomt `choices` og bruke `explanation` som svar.
- `image_file` er valgfritt; bruk KUN filer som finnes i `data/images_analysis.json`. Foretrekk bilder med `"reusable": true`. Bruk `bilde_symbol`-type når et bilde er sentralt.
- Gi HVERT spørsmål minst én `source_ref` med dyp lenke (helst med #anker eller paragraf).
- Lag MANGE spørsmål per konsept (sikt mot 6–12), variert vanskelighet (1–3), uten dubletter og uten for like svaralternativer.
- Marker «spesielt viktige emner» (se pensum 1.4) med `exam_area: "spesielt_viktige"` og `importance: "critical"`.

## Kilder (bruk som source_id + url)

- `sdir_pensum` — https://www.sdir.no/fritidsbat/sertifikater/batforerbevis/pensum-til-batforerproven/
- `lovdata_forskrift` (båtførerbevis/minstealder, FOR-2009-03-03-259) — https://lovdata.no/dokument/SF/forskrift/2009-03-03-259
- `lovdata_smabatloven` (LOV-1998-06-26-47) — https://lovdata.no/dokument/NL/lov/1998-06-26-47
- `lovdata_sjoveisreglene` (FOR-1975-12-01-5) — https://lovdata.no/dokument/SF/forskrift/1975-12-01-5
- `lovdata_fartsforskrift` (FOR-2009-12-15-1546) — https://lovdata.no/dokument/SF/forskrift/2009-12-15-1546
- `lovdata_flyteutstyr` (FOR-1995-05-08-409) — https://lovdata.no/dokument/SF/forskrift/1995-05-08-409
- `kystverket_sjomerker` — https://www.kystverket.no/sjovegen/fyr-lykter-og-sjomerker/
- `redningsselskapet_sjovett` — https://rs.no/sikker-til-sjos/sjovettreglene/

## Juridiske/faglige fakta som MÅ være korrekte

### Promille (Småbåtloven §33)
- Fritidsbåt **under 15 m**: promillegrense **0,8 ‰**.
- Båt **15 m eller lengre**: **0,2 ‰**.
- Forbud mot å føre båt påvirket av andre berusende/bedøvende midler.

### Flyteutstyr (Småbåtloven §23a + FOR-1995-05-08-409)
- Det skal være **egnet flyteutstyr til alle om bord**.
- I båt **under 8 m** skal **alle om bord ha PÅ SEG** flyteutstyr **når båten er i fart** (unntak når man er helt/delvis under dekk eller i lukket styrehus).

### Båtførerbevis og minstealder (FOR-2009-03-03-259, Småbåtloven) — OPPDATERT 2026
- Båtførerbevis kreves for personer **født 1.1.1980 eller senere** som skal føre fritidsbåt **over 8 m** eller med motor **over 25 hk**. Med båtførerbevis kan man føre fritidsbåt opp til **15 m** innenfor Norge.
- **Minstealder 16 år** for å føre fritidsbåt med motor **over 10 hk**. ⚠️ VIKTIG ENDRING: **10-knopsgrensen for førere under 16 år ble FJERNET 1. juli 2021** — det er nå **kun motorstyrke (hk), ikke fart**, som bestemmer aldersgrensen. Personer under 16 kan føre båt med motor **opp til 10 hk**.
- **Høyhastighetsbevis** (nytt fra **våren 2023**): kreves **i tillegg til** båtførerbevis for å føre fritidsbåt under 24 m som kan gå **50 knop eller mer**. **Minstealder 18 år**.
- Vannscooter: samme regler som båt (egne vannscooterregler opphevet 2017), 16-årsgrense.
- Obligatorisk **registrering** av fritidsbåt er **foreslått/under utredning** (ikke trådt i kraft ennå) — omtal som kommende, ikke gjeldende.

### Fart (FOR-2009-12-15-1546, FOR-1983-02-24-624, havne- og farvannsloven, lokale forskrifter)
- Forbudt å passere **badende nærmere enn 50 m**.
- Mange steder **maks 5 knop** nærmere enn 50/100 m fra land, holmer, fortøyde båter og i havner — **sjekk lokale fartsforskrifter**.
- **Kommunene** kan fastsette lokale **fartsgrenser for fritidsfartøy** (maks 24 m) etter havne- og farvannsloven, hele eller deler av året (ordningen endret fra 2022). Sjekk alltid lokal forskrift for området du ferdes i.
- Sjøveisregel 6: alltid **sikker/avpasset fart**.

### Sjøveisreglene (FOR-1975-12-01-5) — vikeplikt
- Regel 5 utkikk; Regel 6 sikker fart; Regel 7 fare for sammenstøt; Regel 8 unnamanøver (tydelig, i god tid).
- **Regel 9** trangt farvann/løp: hold deg så nær **styrbord** yttergrense som trygt; fartøy under 20 m og seilfartøy skal **ikke hindre** fartøy som bare kan navigere trygt i løpet.
- **Regel 12** seilfartøy: babord halse viker for styrbord halse; på samme halse viker fartøyet i **lo** for det i **le**.
- **Regel 13** innhenting: **innhentende fartøy viker** (uansett type).
- **Regel 14** motgående (rett forfra): **begge dreier til styrbord**, passerer babord mot babord.
- **Regel 15** kryssende kurser (to maskindrevne): fartøyet som har det andre på sin **styrbord side viker**, og skal om mulig **unngå å gå foran** (passere akten om).
- **Regel 16/17**: vikepliktig viker tidlig og tydelig; det andre holder kurs og fart.
- **Regel 18** ansvar mellom fartøy: **maskindrevet fartøy viker for seilfartøy**, fiskefartøy, manøvreringshemmet og fartøy ikke under kommando. MEN i trange løp/leder går regel 9 foran.
- Regel 19 nedsatt sikt.
- **Norske tilleggsregler 43, 44, 45 og 54** (fart/forsvarlig oppførsel i norske farvann, forbud mot å volde fare/skade ved bølgeslag, vikeplikt i visse sund, særskilte signaler). Henvis generelt til lovdata; ikke gjengi eksakt paragraftekst hvis du er usikker.

### Lanterner (Sjøveisreglene del C)
- Maskindrevet fartøy **under 50 m** i fart: **topplys (hvitt) forut, sidelys (grønn styrbord / rød babord), akterlys (hvitt)**. ≥ 50 m: to topplys.
- Maskindrevet **under 12 m**: kan vise **ett rundtlysende hvitt lys + sidelys**.
- **Seilfartøy** i fart: **sidelys + akterlys** (IKKE topplys). Seilfartøy < 20 m kan ha trefarget lanterne i masten. Kan i tillegg vise rødt-over-grønt rundtlys i masten.
- **Robåt / fartøy under årer**: kan vise sidelys+akterlys, eller ha en **elektrisk lykt klar til å vise i tide** for å unngå sammenstøt.
- **Ankerligger under 50 m**: ett **rundtlysende hvitt lys** forut. Dagsignal: **én sort kule**.
- Sektorer: sidelys 112,5° (rett forut → 22,5° aktenfor tvers), akterlys 135°, topplys 225°.
- **Signalflagg A** (hvit/blå): «jeg har **dykker** nede — hold klar, sakte fart».

### Lydsignaler (regel 32–35)
- Manøversignaler (regel 34): **1 kort = dreier styrbord**, **2 korte = dreier babord**, **3 korte = maskin akterover**, **5 (eller flere) korte = varsel/tvil** («jeg forstår ikke dine hensikter» / fare).
- Regel 33: fartøy ≥ 12 m skal ha fløyte; ≥ 100 m også klokke.
- Nedsatt sikt (regel 35): maskindrevet i fart **1 lang** hvert ≤2 min; stoppet **2 lange**; seil/manøvreringshemmet **1 lang + 2 korte**.

### Nødsignaler (vedlegg IV) og nød-kommunikasjon
- **VHF kanal 16** er nød-/anropskanal; DSC. **Kystradio nås på telefon 120**.
- Nødsignaler: Mayday × 3 på VHF 16, **rødt fallskjerm-/håndbluss**, **oransje røyk**, langsom heving/senking av utstrakte armer, kontinuerlig tåkesignal, flammer om bord, oransje duk, firkantflagg + kule.

### Sjømerker (IALA region A — Norge)
- **Lateralmerker** ved innseiling (leias hovedretning): **røde på babord**, **grønne på styrbord** — «**rødt om babord inn**». Rød kan-/sylinder-topptegn; grønn kjegle (spiss opp).
- **Kardinalmerker** (sort/gul) — passer på den navngitte siden, topptegn to kjegler:
  - **Nord**: kjegler peker **opp**; **sort over gul (BY)**; lys VQ/Q hvitt (kontinuerlig).
  - **Øst**: kjegler **base mot base** (egg); **sort-gul-sort (BYB)**; lys VQ(3)/Q(3).
  - **Sør**: kjegler peker **ned**; **gul over sort (YB)**; lys VQ(6)+langt blink / Q(6)+LFl.
  - **Vest**: kjegler **spiss mot spiss** (timeglass); **gul-sort-gul (YBY)**; lys VQ(9)/Q(9).
- **Spesialmerke**: **helgult**, gult **X-topptegn**, gult lys (kabel, badeområde, oppdrett m.m.).
- **Frittliggende fare (isolert fare)**: **sort med røde belter**, topptegn **to sorte kuler (BRB)**; lys Fl(2) hvitt.
- **Senterleds/trygt-vann-merke**: **røde og hvite vertikale striper**, topptegn **én rød kule**; lys isofase/Oc/ett langt blink/Morse «A». Markerer midtleia/trygt vann.
- **Stake/båke med peker (visarm)**: armen peker mot **trygt farvann**.

### Fyr, lykter og sektorer
- Sektorlykt: **hvit sektor = farbart/trygt løp**; **rød og grønn sektor = mot fare/grunne** (grønn = styrbord side, rød = babord side av leia).
- Lyskarakteristikker: **Fast (F)** konstant; **Formørkende (Oc)** lys lengre enn mørke; **Isofase (Iso)** like lange; **Blink/glimt (Fl)** mørke lengre enn lys; **Hurtigblink (Q)**. Tall i parentes = antall i gruppe (Fl(2) = to glimt). Tall + «s» = periode i sekunder. Bokstaver W/R/G = hvit/rød/grønn.

### Kart, kompass, beregninger
- Sjøkart: **dybder i meter** ned til **sjøkartnull (LAT)**; symboler for grunner, **skvalpeskjær** (tørrfaller), kabel, rørledning, **luftspenn** (med høyde), bru (med klaring), fyr og merker. Moderne kartdatum **WGS84**.
- **Misvisning (deklinasjon)**: vinkel mellom rettvisende (geografisk) nord og **magnetisk** nord; oppgis i kartet og endrer seg over tid.
- **Deviasjon**: kompassfeil pga. magnetiske felt **i egen båt**; varierer med båtens kurs; føres i **deviasjonstabell**.
- **1 nautisk mil = 1852 m = 1 breddeminutt**. **Fart i knop = nautiske mil per time.** Distanse = fart × tid; tid = distanse ÷ fart.

### Øvrig
- **CE-konstruksjonskategorier**: **A** havgående, **B** utenskjærs/åpent hav, **C** kystfarvann/fjord, **D** beskyttet farvann. **CIN** = skrognummer (14 tegn). Produsentskilt, samsvarserklæring, brukerhåndbok.
- **Brann**: **bensindamp og propan er tyngre enn luft** og samler seg lavt → **luft/vifte motorrommet før start**. Pulverapparat (ABC). Aldri vann på bensin-/elektrisk brann.
- **Førstehjelp**: **BLÅS** = Bevissthet, Luftveier, Åndedrett, Sirkulasjon. HLR 30:2. **Hypotermi**: håndter varsomt, isoler mot kulde, varm gradvis.
- **Høy fart**: forsinket reaksjon ved bruk av elektronikk, **tunnelsyn/innsnevret syn**, kortere tid til å oppdage farer, hold **forsvarlig avstand til land**.
