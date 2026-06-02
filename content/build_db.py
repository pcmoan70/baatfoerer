"""
build_db.py — bygg SQLite kilde-databasen fra seed + forfattet innhold.

Kilder:  scraper/sources.yaml + lovdata-lover (kanoniske)
Pensum:  content/syllabus_seed.json
Bilder:  data/images_analysis.json
Innhold: content/authored/*.json

Kjør:  python content/build_db.py   ->  content/batforer.db
"""
from __future__ import annotations
import json, sqlite3, sys
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
DB = CONTENT / "batforer.db"

# Kanoniske lov-/forskriftskilder (utover sources.yaml) — brukt i source_refs.
LAW_SOURCES = [
    ("lovdata_forskrift", "Forskrift om minstealder og båtførerbevis (FOR-2009-03-03-259)", "https://lovdata.no/dokument/SF/forskrift/2009-03-03-259", "official_law"),
    ("lovdata_smabatloven", "Lov om fritids- og småbåter (småbåtloven)", "https://lovdata.no/dokument/NL/lov/1998-06-26-47", "official_law"),
    ("lovdata_sjoveisreglene", "Sjøveisreglene (FOR-1975-12-01-5)", "https://lovdata.no/dokument/SF/forskrift/1975-12-01-5", "official_law"),
    ("lovdata_fartsforskrift", "Forskrift om fartsbegrensninger (FOR-2009-12-15-1546)", "https://lovdata.no/dokument/SF/forskrift/2009-12-15-1546", "official_law"),
    ("lovdata_flyteutstyr", "Forskrift om flyteutstyr om bord på fritidsfartøy (FOR-1995-05-08-409)", "https://lovdata.no/dokument/SF/forskrift/1995-05-08-409", "official_law"),
]


def main() -> int:
    con = sqlite3.connect(DB)
    con.executescript((CONTENT / "schema.sql").read_text(encoding="utf-8"))
    cur = con.cursor()

    # --- sources ---
    src_ids = set()
    cfg = yaml.safe_load((ROOT / "scraper" / "sources.yaml").read_text(encoding="utf-8"))
    for s in cfg["sources"]:
        cur.execute("INSERT OR IGNORE INTO sources(id,name,url,authority,allowed_use) VALUES(?,?,?,?,?)",
                    (s["id"], s["name"], s["url"], s.get("authority"), s.get("allowed_use")))
        src_ids.add(s["id"])
    for sid, name, url, auth in LAW_SOURCES:
        cur.execute("INSERT OR IGNORE INTO sources(id,name,url,authority,allowed_use) VALUES(?,?,?,?,?)",
                    (sid, name, url, auth, "citations_links"))
        src_ids.add(sid)

    # --- syllabus ---
    seed = json.loads((CONTENT / "syllabus_seed.json").read_text(encoding="utf-8"))
    for a in seed["areas"]:
        cur.execute("INSERT INTO syllabus_areas(id,title,ord,note) VALUES(?,?,?,?)",
                    (a["id"], a["title"], a["ord"], a.get("note")))
    for t in seed["topics"]:
        cur.execute("INSERT INTO topics(id,area_id,title,pensum_ref,ord) VALUES(?,?,?,?,?)",
                    (t["id"], t["area_id"], t["title"], t.get("pensum_ref"), t.get("ord")))

    # --- images ---
    img_id = {}
    ana = json.loads((ROOT / "data" / "images_analysis.json").read_text(encoding="utf-8"))
    for im in ana["images"]:
        cur.execute("""INSERT OR IGNORE INTO images(file,site,category,norwegian_term,what_it_shows,reusable,page_url,license,attribution)
                       VALUES(?,?,?,?,?,?,?,?,?)""",
                    (im["file"], im["file"].split("/")[0], im.get("category"),
                     im.get("norwegian_term"), im.get("what_it_shows"),
                     1 if im.get("reusable") else 0,
                     im.get("page_url") or im.get("source_page"),
                     im.get("license"), im.get("attribution")))
        img_id[im["file"]] = cur.execute("SELECT id FROM images WHERE file=?", (im["file"],)).fetchone()[0]

    def ensure_source(ref):
        sid = ref.get("source_id")
        if sid and sid not in src_ids:
            cur.execute("INSERT OR IGNORE INTO sources(id,name,url,authority,allowed_use) VALUES(?,?,?,?,?)",
                        (sid, sid, ref.get("url", ""), "unknown", "links_only"))
            src_ids.add(sid)
        return sid

    valid_areas = {a["id"] for a in seed["areas"]}
    n_c = n_q = 0
    # --- authored content ---
    for f in sorted((CONTENT / "authored").glob("*.json")):
        doc = json.loads(f.read_text(encoding="utf-8"))
        for c in doc.get("concepts", []):
            area = c.get("area") if c.get("area") in valid_areas else "navigasjon"
            cur.execute("""INSERT OR IGNORE INTO concepts(id,area_id,topic,title,importance,exam_area,summary,body)
                           VALUES(?,?,?,?,?,?,?,?)""",
                        (c["id"], area, c.get("topic"), c["title"], c.get("importance", "normal"),
                         c.get("exam_area"), c.get("summary"), c.get("body")))
            n_c += 1
            for g in c.get("learning_goals", []) or []:
                cur.execute("INSERT INTO learning_goals(concept_id,goal) VALUES(?,?)", (c["id"], g))
            for ref in c.get("source_refs", []) or []:
                cur.execute("INSERT INTO concept_sources(concept_id,source_id,url,section,quote) VALUES(?,?,?,?,?)",
                            (c["id"], ensure_source(ref), ref.get("url"), ref.get("section"), ref.get("quote")))
            for imf in c.get("image_files", []) or []:
                if imf in img_id:
                    cur.execute("INSERT OR IGNORE INTO concept_images(concept_id,image_id,role) VALUES(?,?,?)",
                                (c["id"], img_id[imf], "illustrasjon"))
        for q in doc.get("questions", []):
            iid = img_id.get(q.get("image_file")) if q.get("image_file") else None
            cur.execute("""INSERT OR IGNORE INTO questions(id,concept_id,type,difficulty,importance,exam_area,prompt,explanation,image_id)
                           VALUES(?,?,?,?,?,?,?,?,?)""",
                        (q["id"], q["concept_id"], q.get("type", "mcq"), q.get("difficulty", 1),
                         q.get("importance", "normal"), q.get("exam_area"), q["prompt"],
                         q.get("explanation"), iid))
            n_q += 1
            for i, ch in enumerate(q.get("choices", []) or []):
                cur.execute("INSERT INTO choices(question_id,ord,text,is_correct) VALUES(?,?,?,?)",
                            (q["id"], i, ch, 1 if i == q.get("correct") else 0))
            for ref in q.get("source_refs", []) or []:
                cur.execute("INSERT INTO question_sources(question_id,source_id,url,section,quote) VALUES(?,?,?,?,?)",
                            (q["id"], ensure_source(ref), ref.get("url"), ref.get("section"), ref.get("quote")))

    con.commit()
    print(f"DB bygget: {DB.relative_to(ROOT)}")
    print(f"  sources={len(src_ids)} areas={len(seed['areas'])} topics={len(seed['topics'])} "
          f"images={len(img_id)} concepts={n_c} questions={n_q}")
    # liten dekningssjekk
    for area, in cur.execute("SELECT id FROM syllabus_areas ORDER BY ord"):
        nc = cur.execute("SELECT COUNT(*) FROM concepts WHERE area_id=?", (area,)).fetchone()[0]
        nq = cur.execute("""SELECT COUNT(*) FROM questions q JOIN concepts c ON q.concept_id=c.id
                            WHERE c.area_id=?""", (area,)).fetchone()[0]
        print(f"  {area:<12} concepts={nc:<3} questions={nq}")
    sp = cur.execute("SELECT COUNT(*) FROM questions WHERE exam_area='spesielt_viktige'").fetchone()[0]
    print(f"  spesielt_viktige questions = {sp}")
    con.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
