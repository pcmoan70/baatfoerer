"""
rebuild_index.py — gjenoppbygg komplette per-site index.json fra det som ligger
på disk (pages/*.meta.json + pdf/ + images/).

Trengs fordi flere seed-kilder kan dele samme `site`-mappe (f.eks. tre sdir-sider),
og da overskrev den siste crawl-runden de andres index.json. Filene ligger trygt
på disk; dette skriptet aggregerer dem til ett fullstendig index per site.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def rebuild_site(site_dir: Path) -> dict:
    site = site_dir.name
    pages_dir = site_dir / "pages"
    pdf_dir = site_dir / "pdf"
    img_dir = site_dir / "images"

    # behold metadata fra eksisterende index hvis det finnes (navn/authority/seed)
    existing = {}
    idx_path = site_dir / "index.json"
    if idx_path.exists():
        existing = json.loads(idx_path.read_text(encoding="utf-8"))
    # ekstra bilde-metadata (url/caption) fra evt. eksisterende index
    img_meta = {i.get("file"): i for i in existing.get("images", []) if i.get("file")}

    pages: list[dict] = []
    images: dict[str, dict] = {}
    for meta_path in sorted(pages_dir.glob("*.meta.json")) if pages_dir.exists() else []:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        pages.append(meta)
        for im in meta.get("images", []):
            f = im.get("file")
            if not f or f in images:
                continue
            base = img_meta.get(f, {})
            images[f] = {
                "file": f,
                "alt": im.get("alt") or base.get("alt", ""),
                "caption": base.get("caption", ""),
                "url": base.get("url"),
                "page_url": meta.get("url"),
            }

    pdfs: list[dict] = []
    if pdf_dir.exists():
        known = {p.get("file"): p for p in existing.get("pdfs", [])}
        for pdf in sorted(pdf_dir.glob("*.pdf")):
            rel = str(pdf.relative_to(DATA))
            pdfs.append(known.get(rel, {"file": rel, "bytes": pdf.stat().st_size}))

    index = {
        "site": site,
        "name": existing.get("name", site),
        "seed_url": existing.get("seed_url"),
        "authority": existing.get("authority"),
        "rebuilt": True,
        "n_pages": len(pages),
        "n_pdfs": len(pdfs),
        "n_images": len(images),
        "pages": pages,
        "pdfs": pdfs,
        "images": list(images.values()),
    }
    idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    return index


def main() -> int:
    if not DATA.exists():
        print("Ingen data/.")
        return 1
    total = {"pages": 0, "pdfs": 0, "images": 0}
    for site_dir in sorted(p for p in DATA.iterdir() if p.is_dir()):
        idx = rebuild_site(site_dir)
        total["pages"] += idx["n_pages"]
        total["pdfs"] += idx["n_pdfs"]
        total["images"] += idx["n_images"]
        print(f"  {idx['site']:<18} pages={idx['n_pages']:<4} "
              f"pdf={idx['n_pdfs']:<3} img={idx['n_images']:<4}")
    print(f"Totalt: {total['pages']} sider, {total['pdfs']} PDF, {total['images']} bilder.")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
