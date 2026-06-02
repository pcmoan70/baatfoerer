"""
analyze_images.py — bygg en prioritert katalog over skrapte bilder.

Leser data/{site}/index.json, scorer hvert bilde etter hvor faglig relevant det
er for båtførerprøven (sjømerker, lanterner, fyr, kart, kompass, vikeplikt), og
skriver:
  data/images_catalog.json         alle bilder, sortert etter relevansscore
  data/{site}/images_catalog.json  per kilde

Vision-analysen (hva bildet faktisk viser) gjøres etterpå av Claude/subagenter
på de høyest scorede bildene, og lagres i data/{site}/images_analysis.json.
Dette skriptet velger HVILKE bilder som er verdt vision-analyse.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

# Vekt per emne — høyere = viktigere fagbilde å analysere.
TOPIC_WEIGHTS = [
    (re.compile(r"sj\xf8merke|sjomerke|sea ?mark", re.I), 5),
    (re.compile(r"lanterne|navigasjonslys|lantern", re.I), 5),
    (re.compile(r"kardinal|lateral|spesialmerke|frittliggende|senterleds", re.I), 5),
    (re.compile(r"\bfyr\b|lykt|sektor", re.I), 4),
    (re.compile(r"vikeplikt|kryssende|forbikj", re.I), 4),
    (re.compile(r"kompass|peiling|kurs\b", re.I), 3),
    (re.compile(r"sjokart|sj\xf8kart|kartsymbol|skolekart|kart\b", re.I), 3),
    (re.compile(r"iala", re.I), 3),
    (re.compile(r"fart|knop|sjovett|sj\xf8vett|sikkerhet|redningsvest", re.I), 2),
    (re.compile(r"b\xe5t|baat|fart\xf8y|seil", re.I), 1),
]


def score_image(rec: dict) -> tuple[int, list[str]]:
    haystack = " ".join(
        str(rec.get(k, "")) for k in ("alt", "title", "caption", "url", "file", "page_url")
    )
    score = 0
    hits: list[str] = []
    for pat, w in TOPIC_WEIGHTS:
        if pat.search(haystack):
            score += w
            hits.append(pat.pattern)
    # bonus for beskrivende alt-tekst (gir bedre kontekst for analyse)
    if len(rec.get("alt", "")) > 15:
        score += 1
    return score, hits


def main() -> int:
    if not DATA.exists():
        print("Ingen data/ enda — kjør fetch_sources.py først.")
        return 1

    all_images: list[dict] = []
    for index_path in sorted(DATA.glob("*/index.json")):
        idx = json.loads(index_path.read_text(encoding="utf-8"))
        site = idx["site"]
        site_imgs: list[dict] = []
        for rec in idx.get("images", []):
            score, hits = score_image(rec)
            entry = {
                "site": site,
                "source_id": idx["source_id"],
                "authority": idx.get("authority"),
                "file": rec.get("file"),
                "url": rec.get("url"),
                "alt": rec.get("alt", ""),
                "caption": rec.get("caption", ""),
                "page_url": rec.get("page_url"),
                "relevance_score": score,
                "topic_hits": hits,
                "analyze": score >= 3,  # kandidat for vision-analyse
            }
            site_imgs.append(entry)
            all_images.append(entry)
        site_imgs.sort(key=lambda e: e["relevance_score"], reverse=True)
        (index_path.parent / "images_catalog.json").write_text(
            json.dumps({"site": site, "n_images": len(site_imgs), "images": site_imgs},
                       ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    all_images.sort(key=lambda e: e["relevance_score"], reverse=True)
    priority = [e for e in all_images if e["analyze"]]
    catalog = {
        "n_images_total": len(all_images),
        "n_priority": len(priority),
        "priority_for_vision_analysis": priority,
        "all_images": all_images,
    }
    (DATA / "images_catalog.json").write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Katalog: {len(all_images)} bilder totalt, "
          f"{len(priority)} prioritert for vision-analyse.")
    print("Topp 15:")
    for e in all_images[:15]:
        print(f"  {e['relevance_score']:>2}  {e['site']:<18} {e['alt'][:50]!r}  {e['file']}")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
