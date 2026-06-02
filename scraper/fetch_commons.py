"""
fetch_commons.py — hent fritt lisensierte lanterne-/fyr-illustrasjoner fra
Wikimedia Commons (offentlig, frie lisenser) til data/wikimedia/.

Bruker Commons-API-et: søker filer, henter imageinfo + lisens/forfatter
(extmetadata), filtrerer til frie lisenser (CC0/PD/CC BY/CC BY-SA), og laster ned
en nedskalert utgave. Lagrer attribusjon slik at vi kan kreditere korrekt.
"""
from __future__ import annotations
import json, re, time
from pathlib import Path
import httpx

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "wikimedia"
IMG = OUT / "images"
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "BatforerTrainerBot/0.1 (educational; contact: pcmoan@gmail.com)"}

# Kategorier på Commons med diagrammer (ikke foto) for lanterner og fyr/sektorlys.
CATEGORIES = [
    "Category:Navigation lights",
    "Category:Diagrams of navigation lights",
    "Category:Sector lights",
    "Category:Light characteristics",
    "Category:Schematics of lighthouses",
]
# Suppler med målrettede søk, men vi beholder kun SVG/PNG-skjematikk.
QUERIES = [
    "ColRegs lights diagram", "navigation lights schematic", "Lichterführung",
    "light characteristic diagram", "sector light diagram",
]
FREE = re.compile(r"(CC0|public domain|CC BY|CC-BY|Creative Commons)", re.I)
IMGEXT = re.compile(r"\.(svg|png)$", re.I)          # kun diagram-formater (dropp foto-JPG)
SKIP = re.compile(r"(logo|icon|\.tif|stub|placeholder)", re.I)


def strip_html(s: str) -> str:
    return re.sub(r"<[^>]+>", "", s or "").strip()


def search_titles(client: httpx.Client) -> set[str]:
    titles: set[str] = set()
    # 1) kategorimedlemmer (filer)
    for cat in CATEGORIES:
        try:
            r = client.get(API, params={"action": "query", "format": "json",
                                        "list": "categorymembers", "cmtitle": cat,
                                        "cmtype": "file", "cmlimit": 60})
            members = r.json().get("query", {}).get("categorymembers", [])
            for m in members:
                titles.add(m["title"])
            print(f"  · {cat}: {len(members)} filer")
        except Exception as e:
            print("  ! kategori feilet:", cat, e)
        time.sleep(0.4)
    # 2) målrettede søk
    for q in QUERIES:
        try:
            r = client.get(API, params={"action": "query", "format": "json", "list": "search",
                                        "srsearch": q, "srnamespace": 6, "srlimit": 20})
            for it in r.json().get("query", {}).get("search", []):
                titles.add(it["title"])
        except Exception as e:
            print("  ! søk feilet:", q, e)
        time.sleep(0.4)
    return titles


def fetch_imageinfo(client: httpx.Client, titles: list[str]) -> list[dict]:
    out = []
    for i in range(0, len(titles), 40):
        batch = titles[i:i + 40]
        r = client.get(API, params={
            "action": "query", "format": "json", "titles": "|".join(batch),
            "prop": "imageinfo", "iiprop": "url|extmetadata|mime", "iiurlwidth": 1000,
        })
        pages = r.json().get("query", {}).get("pages", {})
        for p in pages.values():
            ii = (p.get("imageinfo") or [None])[0]
            if not ii:
                continue
            ext = ii.get("extmetadata", {})
            lic = strip_html(ext.get("LicenseShortName", {}).get("value", ""))
            artist = strip_html(ext.get("Artist", {}).get("value", ""))
            out.append({
                "title": p.get("title"), "mime": ii.get("mime", ""),
                "url": ii.get("url"), "thumb": ii.get("thumburl") or ii.get("url"),
                "descurl": ii.get("descriptionurl"),
                "license": lic, "artist": artist,
                "usage": strip_html(ext.get("UsageTerms", {}).get("value", "")),
            })
        time.sleep(0.4)
    return out


def main() -> int:
    IMG.mkdir(parents=True, exist_ok=True)
    records = []
    with httpx.Client(headers=UA, follow_redirects=True, timeout=40) as client:
        titles = sorted(search_titles(client))
        print(f"Fant {len(titles)} filtitler. Henter imageinfo …")
        infos = fetch_imageinfo(client, titles)
        for it in infos:
            title = it["title"] or ""
            if not IMGEXT.search(title) or SKIP.search(title):
                continue
            if not FREE.search(it["license"]):
                continue
            dl = it["thumb"] or it["url"]
            if not dl:
                continue
            name = re.sub(r"[^a-zA-Z0-9._-]+", "-", title.replace("File:", "")).strip("-").lower()
            if not IMGEXT.search(name):
                name += ".png"
            try:
                r = client.get(dl)
                if r.status_code != 200 or len(r.content) < 1500:
                    continue
                (IMG / name).write_bytes(r.content)
            except Exception as e:
                print("  ! nedlasting feilet:", title, e)
                continue
            records.append({
                "file": f"wikimedia/images/{name}",
                "title": title, "license": it["license"], "artist": it["artist"],
                "usage": it["usage"], "source_page": it["descurl"],
            })
            print(f"  + {it['license']:<14} {title}")
            time.sleep(0.3)

    (OUT / "commons_meta.json").write_text(
        json.dumps({"source": "Wikimedia Commons", "n": len(records), "images": records},
                   ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nLastet ned {len(records)} fritt lisensierte bilder til data/wikimedia/")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
