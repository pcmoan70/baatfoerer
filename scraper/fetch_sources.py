"""
fetch_sources.py — politt, dybde-begrenset crawler for baatfoererproeve-kilder.

Leser scraper/sources.yaml og skraper hver kilde til data/{site}/:
  data/{site}/pages/<slug>.html        rå HTML
  data/{site}/pages/<slug>.txt         ekstrahert hovedtekst (trafilatura)
  data/{site}/pages/<slug>.meta.json   metadata (url, status, etag, checksum, lenker)
  data/{site}/pdf/<navn>.pdf           nedlastede PDF-er
  data/{site}/index.json               manifest for kilden
data/manifest.json                     global manifest

Designprinsipper fra planen: respekter robots.txt, lav frekvens (delay),
caching-headere lagres slik at vi senere kan bruke If-None-Match / If-Modified-Since.
Råinnhold lagres for senere reformulering — ingenting republiseres her.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urldefrag, urljoin, urlparse
from urllib.robotparser import RobotFileParser

import httpx
import yaml
from bs4 import BeautifulSoup

try:
    import trafilatura
except Exception:  # pragma: no cover
    trafilatura = None

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
SOURCES_FILE = Path(__file__).resolve().parent / "sources.yaml"

USER_AGENT = "BatforerTrainerBot/0.1 (+educational; contact: pcmoan@gmail.com)"
HEADERS = {"User-Agent": USER_AGENT, "Accept-Language": "nb-NO,no,en;q=0.8"}

# Crawl-grenser
DEFAULT_DEPTH = 2
DEFAULT_MAX_PAGES = 80
DELAY_SECONDS = 1.0          # høflig pause mellom forespørsler per host
TIMEOUT = 30.0

SKIP_EXT = re.compile(
    r"\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|mp4|webm|mp3|woff2?|ttf|eot|zip|xml|rss)(\?|$)",
    re.I,
)
PDF_EXT = re.compile(r"\.pdf(\?|$)", re.I)
IMG_EXT = re.compile(r"\.(jpg|jpeg|png|gif|webp|svg)(\?|$)", re.I)
# Hopp over tydelig pynt/ikoner som ikke er fagbilder.
IMG_SKIP = re.compile(r"(sprite|icon|logo|favicon|avatar|placeholder|pixel|spinner|loader)", re.I)

# Emneord som holder crawlen på tema når vi forlater seed-stien.
TOPIC_WORDS = re.compile(
    r"(batforer|b\xe5tf\xf8rer|batforar|sjomerke|sj\xf8merke|fyr|lykt|lanterne|"
    r"pensum|skolekart|kart|fart|knop|sjovett|sj\xf8vett|navigasjon|vikeplikt|"
    r"iala|kardinal|lateral|sertifikat|fritidsbat|fritidsb\xe5t|quiz|test|"
    r"emne|kurs|regel|forskrift|kompass|peiling|sikker)",
    re.I,
)

_robots_cache: dict[str, RobotFileParser] = {}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def registrable_domain(host: str) -> str:
    """Enkel registrable-domain: siste to labels (holder for .no-domenene her)."""
    parts = host.split(".")
    return ".".join(parts[-2:]) if len(parts) >= 2 else host


def same_site(seed_host: str, link_host: str) -> bool:
    return registrable_domain(seed_host) == registrable_domain(link_host)


def relevant_link(link: str, seed_host: str, scope_prefix: str) -> bool:
    """Følg interne lenker som enten ligger under seed-stien eller nevner et emneord.

    Holder crawlen på tema og unngår å belaste urelaterte deler (butikk,
    donasjon, innloggings-subdomener) av store nettsteder.
    """
    p = urlparse(link)
    if p.netloc != seed_host:  # ikke vandre til subdomener (minside., minbedrift. …)
        return False
    if p.path.startswith(scope_prefix):
        return True
    return bool(TOPIC_WORDS.search(p.path) or TOPIC_WORDS.search(p.query))


def robots_ok(url: str, client: httpx.Client) -> bool:
    parsed = urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    rp = _robots_cache.get(base)
    if rp is None:
        rp = RobotFileParser()
        try:
            r = client.get(f"{base}/robots.txt", timeout=15)
            if r.status_code == 200:
                rp.parse(r.text.splitlines())
            else:
                rp.parse([])  # ingen robots -> alt tillatt
        except Exception:
            rp.parse([])
        _robots_cache[base] = rp
    try:
        return rp.can_fetch(USER_AGENT, url)
    except Exception:
        return True


def slugify(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path.strip("/") or "index"
    slug = re.sub(r"[^a-zA-Z0-9._-]+", "-", path).strip("-").lower() or "index"
    if parsed.query:
        slug += "-" + hashlib.sha1(parsed.query.encode()).hexdigest()[:8]
    if len(slug) > 80:
        slug = slug[:60] + "-" + hashlib.sha1(slug.encode()).hexdigest()[:8]
    return slug


def extract_text(html: str, url: str) -> str:
    if trafilatura is not None:
        try:
            txt = trafilatura.extract(
                html, url=url, include_links=True, include_tables=True,
                favor_recall=True,
            )
            if txt:
                return txt
        except Exception:
            pass
    # fallback: rå tekst fra bs4
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    return re.sub(r"\n{3,}", "\n\n", soup.get_text("\n")).strip()


def fetch(client: httpx.Client, url: str) -> httpx.Response | None:
    try:
        r = client.get(url, timeout=TIMEOUT, follow_redirects=True)
        return r
    except Exception as exc:
        print(f"    ! feil ved henting {url}: {exc}")
        return None


def save_pdf(client: httpx.Client, url: str, pdf_dir: Path) -> dict | None:
    r = fetch(client, url)
    if r is None or r.status_code != 200:
        return None
    name = slugify(url)
    if not name.lower().endswith(".pdf"):
        name += ".pdf"
    out = pdf_dir / name
    out.write_bytes(r.content)
    return {
        "url": url,
        "file": str(out.relative_to(DATA)),
        "bytes": len(r.content),
        "checksum_sha256": hashlib.sha256(r.content).hexdigest(),
        "etag": r.headers.get("etag"),
        "last_modified": r.headers.get("last-modified"),
        "fetched_at": now_iso(),
    }


def collect_images(soup: BeautifulSoup, page_url: str) -> list[dict]:
    """Hent ut <img>-kandidater med alt-tekst og evt. figcaption."""
    out: list[dict] = []
    seen: set[str] = set()
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-lazy-src")
        if not src:
            # srcset: ta første url
            srcset = img.get("srcset") or img.get("data-srcset")
            if srcset:
                src = srcset.split(",")[0].strip().split(" ")[0]
        if not src:
            continue
        url = urldefrag(urljoin(page_url, src))[0]
        if not url.lower().startswith(("http://", "https://")):
            continue
        if url in seen or IMG_SKIP.search(url):
            continue
        seen.add(url)
        caption = ""
        fig = img.find_parent("figure")
        if fig:
            cap = fig.find("figcaption")
            if cap:
                caption = cap.get_text(" ", strip=True)
        out.append({
            "url": url,
            "alt": (img.get("alt") or "").strip(),
            "title": (img.get("title") or "").strip(),
            "caption": caption,
            "page_url": page_url,
        })
    return out


def download_image(client: httpx.Client, info: dict, img_dir: Path) -> dict | None:
    r = fetch(client, info["url"])
    if r is None or r.status_code != 200:
        return None
    ctype = r.headers.get("content-type", "")
    if not ("image" in ctype or IMG_EXT.search(info["url"])):
        return None
    if len(r.content) < 1500 and "svg" not in ctype:  # dropp bittesmå sporings-/ikonbilder
        return None
    name = slugify(info["url"])
    if not IMG_EXT.search(name):
        ext = ".svg" if "svg" in ctype else (".png" if "png" in ctype else ".jpg")
        name += ext
    out = img_dir / name
    out.write_bytes(r.content)
    return {
        **info,
        "file": str(out.relative_to(DATA)),
        "bytes": len(r.content),
        "content_type": ctype,
        "checksum_sha256": hashlib.sha256(r.content).hexdigest(),
        "fetched_at": now_iso(),
    }


def crawl_source(src: dict, client: httpx.Client, depth: int, max_pages: int,
                 want_images: bool = True, max_images: int = 150) -> dict:
    site = src["site"]
    seed = src["url"]
    seed_host = urlparse(seed).netloc
    allow_subpages = bool(src.get("allow_subpages", False))
    want_pdf = bool(src.get("pdf", False))

    site_dir = DATA / site
    pages_dir = site_dir / "pages"
    pdf_dir = site_dir / "pdf"
    img_dir = site_dir / "images"
    scope_prefix = urlparse(seed).path.rsplit("/", 1)[0] or "/"
    pages_dir.mkdir(parents=True, exist_ok=True)
    if want_pdf:
        pdf_dir.mkdir(parents=True, exist_ok=True)
    if want_images:
        img_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n=== {src['id']} ({site}) ===")
    print(f"    seed: {seed}  depth={depth if allow_subpages else 0} max={max_pages}")

    visited: set[str] = set()
    pdfs_seen: set[str] = set()
    imgs_seen: set[str] = set()
    queue: deque[tuple[str, int]] = deque([(urldefrag(seed)[0], 0)])
    page_records: list[dict] = []
    pdf_records: list[dict] = []
    img_records: list[dict] = []

    while queue and len(visited) < max_pages:
        url, d = queue.popleft()
        url = urldefrag(url)[0]
        if url in visited:
            continue
        if not robots_ok(url, client):
            print(f"    - robots blokkerer: {url}")
            continue
        visited.add(url)

        r = fetch(client, url)
        time.sleep(DELAY_SECONDS)
        if r is None:
            continue
        ctype = r.headers.get("content-type", "")
        status = r.status_code
        if status != 200:
            print(f"    - {status} {url}")
            continue

        # PDF som lander direkte
        if "application/pdf" in ctype or PDF_EXT.search(url):
            if want_pdf and url not in pdfs_seen:
                pdfs_seen.add(url)
                name = slugify(url) + ("" if url.lower().endswith(".pdf") else ".pdf")
                out = pdf_dir / name
                out.write_bytes(r.content)
                pdf_records.append({
                    "url": url, "file": str(out.relative_to(DATA)),
                    "bytes": len(r.content),
                    "checksum_sha256": hashlib.sha256(r.content).hexdigest(),
                    "etag": r.headers.get("etag"),
                    "last_modified": r.headers.get("last-modified"),
                    "fetched_at": now_iso(),
                })
                print(f"    + PDF {url}")
            continue

        if "text/html" not in ctype and "<html" not in r.text[:2000].lower():
            continue

        html = r.text
        slug = slugify(url)
        soup = BeautifulSoup(html, "lxml")
        title = (soup.title.string.strip() if soup.title and soup.title.string else "")

        (pages_dir / f"{slug}.html").write_text(html, encoding="utf-8")
        text = extract_text(html, url)
        (pages_dir / f"{slug}.txt").write_text(text or "", encoding="utf-8")

        # samle lenker
        links: list[str] = []
        pdf_links: list[str] = []
        for a in soup.find_all("a", href=True):
            href = urldefrag(urljoin(url, a["href"]))[0]
            p = urlparse(href)
            if p.scheme not in ("http", "https"):
                continue
            if PDF_EXT.search(href):
                pdf_links.append(href)
            else:
                links.append(href)

        # last ned bilder fra siden (fagbilder: sjømerker, lanterner, kartsymboler …)
        page_imgs: list[dict] = []
        if want_images and len(img_records) < max_images:
            for info in collect_images(soup, url):
                if info["url"] in imgs_seen or len(img_records) >= max_images:
                    continue
                if not robots_ok(info["url"], client):
                    continue
                imgs_seen.add(info["url"])
                rec = download_image(client, info, img_dir)
                time.sleep(DELAY_SECONDS)
                if rec:
                    img_records.append(rec)
                    page_imgs.append({"file": rec["file"], "alt": rec["alt"]})

        meta = {
            "url": url,
            "site": site,
            "source_id": src["id"],
            "title": title,
            "status_code": status,
            "content_type": ctype,
            "etag": r.headers.get("etag"),
            "last_modified": r.headers.get("last-modified"),
            "checksum_sha256": hashlib.sha256(html.encode("utf-8", "ignore")).hexdigest(),
            "fetched_at": now_iso(),
            "depth": d,
            "text_chars": len(text or ""),
            "n_links": len(links),
            "n_pdf_links": len(pdf_links),
            "n_images": len(page_imgs),
            "images": page_imgs,
            "files": {"html": f"pages/{slug}.html", "text": f"pages/{slug}.txt"},
        }
        (pages_dir / f"{slug}.meta.json").write_text(
            json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        page_records.append(meta)
        print(f"    + [{d}] {url}  ({len(text or '')} tegn, {len(links)} lenker)")

        # last ned PDF-er lenket fra siden
        if want_pdf:
            for pl in pdf_links:
                if pl in pdfs_seen or not same_site(seed_host, urlparse(pl).netloc):
                    continue
                if not robots_ok(pl, client):
                    continue
                pdfs_seen.add(pl)
                rec = save_pdf(client, pl, pdf_dir)
                time.sleep(DELAY_SECONDS)
                if rec:
                    pdf_records.append(rec)
                    print(f"    + PDF {pl}")

        # køe interne, tema-relevante lenker
        if allow_subpages and d < depth:
            for link in links:
                if SKIP_EXT.search(link) or link in visited:
                    continue
                if relevant_link(link, seed_host, scope_prefix):
                    queue.append((link, d + 1))

    index = {
        "source_id": src["id"],
        "site": site,
        "name": src["name"],
        "seed_url": seed,
        "authority": src.get("authority"),
        "crawled_at": now_iso(),
        "n_pages": len(page_records),
        "n_pdfs": len(pdf_records),
        "n_images": len(img_records),
        "pages": page_records,
        "pdfs": pdf_records,
        "images": img_records,
    }
    (site_dir / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"    => {len(page_records)} sider, {len(pdf_records)} PDF-er, "
          f"{len(img_records)} bilder lagret i data/{site}/")
    return index


def main() -> int:
    ap = argparse.ArgumentParser(description="Skrap baatfoererproeve-kilder.")
    ap.add_argument("--only", help="kommaseparert liste av source-id-er", default="")
    ap.add_argument("--depth", type=int, default=DEFAULT_DEPTH)
    ap.add_argument("--max-pages", type=int, default=DEFAULT_MAX_PAGES)
    args = ap.parse_args()

    cfg = yaml.safe_load(SOURCES_FILE.read_text(encoding="utf-8"))
    sources = cfg["sources"]
    if args.only:
        wanted = {s.strip() for s in args.only.split(",")}
        sources = [s for s in sources if s["id"] in wanted]

    DATA.mkdir(exist_ok=True)
    manifest = {"generated_at": now_iso(), "user_agent": USER_AGENT, "sources": []}

    with httpx.Client(headers=HEADERS, http2=False) as client:
        for src in sources:
            try:
                idx = crawl_source(src, client, args.depth, args.max_pages)
                manifest["sources"].append({
                    "source_id": idx["source_id"], "site": idx["site"],
                    "name": idx["name"], "authority": idx["authority"],
                    "n_pages": idx["n_pages"], "n_pdfs": idx["n_pdfs"],
                    "n_images": idx["n_images"],
                    "index": f"data/{idx['site']}/index.json",
                })
            except Exception as exc:
                print(f"!! kilde {src['id']} feilet: {exc}")
                manifest["sources"].append({"source_id": src["id"], "error": str(exc)})

    (DATA / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"\nFerdig. Global manifest: data/manifest.json "
          f"({len(manifest['sources'])} kilder)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
