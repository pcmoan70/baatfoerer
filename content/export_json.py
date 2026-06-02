"""
export_json.py — eksporter SQLite-databasen til statiske JSON-bundles for frontend.

Skriver docs/data/{sources,syllabus,concepts,questions,images,meta}.json og
kopierer KUN gjenbrukbare (reusable=1) bilder til docs/data/img/ slik at den
statiske siden (GitHub Pages-rot = docs/) kan laste dem. Opphavsrettsbeskyttede
bilder ekskluderes fra visning (de ble bare analysert for å lage egen grafikk).
"""
from __future__ import annotations
import json, shutil, sqlite3, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "content" / "batforer.db"
OUT = ROOT / "docs" / "data"
IMG_OUT = OUT / "img"
DATA = ROOT / "data"


def main() -> int:
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    OUT.mkdir(parents=True, exist_ok=True)
    IMG_OUT.mkdir(parents=True, exist_ok=True)

    # --- bilder: kun gjenbrukbare, kopier til docs/data/img/ ---
    web_img = {}   # image_id -> {file, alt, term, category}
    for r in con.execute("SELECT * FROM images WHERE reusable=1"):
        src = DATA / r["file"].replace("\\", "/")
        if not src.exists():
            continue
        web_name = r["file"].replace("\\", "/").replace("/", "__")
        shutil.copyfile(src, IMG_OUT / web_name)
        web_img[r["id"]] = {
            "src": f"data/img/{web_name}",
            "alt": r["norwegian_term"] or r["what_it_shows"] or "",
            "term": r["norwegian_term"], "category": r["category"],
        }

    # --- sources ---
    sources = [dict(r) for r in con.execute("SELECT id,name,url,authority,allowed_use FROM sources ORDER BY id")]
    (OUT / "sources.json").write_text(json.dumps(sources, ensure_ascii=False, indent=2), encoding="utf-8")

    # --- syllabus (areas + topics) ---
    areas = []
    for a in con.execute("SELECT * FROM syllabus_areas ORDER BY ord"):
        topics = [dict(t) for t in con.execute("SELECT id,title,pensum_ref FROM topics WHERE area_id=? ORDER BY ord", (a["id"],))]
        areas.append({"id": a["id"], "title": a["title"], "note": a["note"], "topics": topics})
    (OUT / "syllabus.json").write_text(json.dumps(areas, ensure_ascii=False, indent=2), encoding="utf-8")

    # --- concepts ---
    concepts = []
    for c in con.execute("SELECT * FROM concepts ORDER BY area_id"):
        goals = [g["goal"] for g in con.execute("SELECT goal FROM learning_goals WHERE concept_id=?", (c["id"],))]
        srcs = [dict(s) for s in con.execute("SELECT source_id,url,section,quote FROM concept_sources WHERE concept_id=?", (c["id"],))]
        imgs = [web_img[i["image_id"]] for i in con.execute("SELECT image_id FROM concept_images WHERE concept_id=?", (c["id"],)) if i["image_id"] in web_img]
        concepts.append({
            "id": c["id"], "area": c["area_id"], "topic": c["topic"], "title": c["title"],
            "importance": c["importance"], "exam_area": c["exam_area"],
            "summary": c["summary"], "body": c["body"],
            "learning_goals": goals, "sources": srcs, "images": imgs,
        })
    (OUT / "concepts.json").write_text(json.dumps(concepts, ensure_ascii=False, indent=2), encoding="utf-8")

    # --- questions (med choices) ---
    questions = []
    for q in con.execute("SELECT * FROM questions"):
        choices = [r["text"] for r in con.execute("SELECT text FROM choices WHERE question_id=? ORDER BY ord", (q["id"],))]
        correct = con.execute("SELECT ord FROM choices WHERE question_id=? AND is_correct=1", (q["id"],)).fetchone()
        srcs = [dict(s) for s in con.execute("SELECT source_id,url,section,quote FROM question_sources WHERE question_id=?", (q["id"],))]
        questions.append({
            "id": q["id"], "concept_id": q["concept_id"], "type": q["type"],
            "difficulty": q["difficulty"], "importance": q["importance"], "exam_area": q["exam_area"],
            "prompt": q["prompt"], "choices": choices,
            "correct": correct["ord"] if correct else None,
            "explanation": q["explanation"],
            "image": web_img.get(q["image_id"]),   # None hvis ikke-gjenbrukbart/utelatt
            "sources": srcs,
        })
    (OUT / "questions.json").write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")

    (OUT / "images.json").write_text(json.dumps(list(web_img.values()), ensure_ascii=False, indent=2), encoding="utf-8")

    meta = {
        "n_sources": len(sources), "n_areas": len(areas),
        "n_concepts": len(concepts), "n_questions": len(questions),
        "n_images_web": len(web_img),
        "n_spesielt": sum(1 for q in questions if q["exam_area"] == "spesielt_viktige"),
    }
    (OUT / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Eksportert til docs/data/:", json.dumps(meta, ensure_ascii=False))
    con.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
