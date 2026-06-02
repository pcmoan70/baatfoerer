"""
enrich_anchors.py — etterfyll seksjons-ankere i allerede skrapte sider.

Leser hver data/{site}/pages/<slug>.html, henter overskrifts-ankere og oppdaterer
tilhørende <slug>.meta.json med feltet "anchors". Gjør at dype kildelenker
(url#anker) kan bygges uten å skrape sidene på nytt.
"""

from __future__ import annotations

import json
from pathlib import Path

from bs4 import BeautifulSoup

from fetch_sources import collect_anchors  # gjenbruk samme logikk

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def main() -> int:
    if not DATA.exists():
        print("Ingen data/ enda.")
        return 1
    updated = 0
    for html_path in DATA.glob("*/pages/*.html"):
        meta_path = html_path.with_suffix("").with_suffix(".meta.json")
        # <slug>.html -> <slug>.meta.json
        meta_path = html_path.parent / (html_path.stem + ".meta.json")
        if not meta_path.exists():
            continue
        soup = BeautifulSoup(html_path.read_text(encoding="utf-8", errors="ignore"), "lxml")
        anchors = collect_anchors(soup)
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        meta["anchors"] = anchors
        meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        updated += 1
    print(f"Oppdaterte {updated} meta-filer med seksjons-ankere.")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
