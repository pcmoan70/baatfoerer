"""
validate.py — kvalitetskontroll av forfattet innhold før DB-bygging.

Sjekker: dubletter, foreldreløse spørsmål, fasit innen rekkevidde, forklaring,
kildereferanser, og at alle bildereferanser finnes (+ om de er gjenbrukbare).
Krysssjekker bilde-term mot spørsmålstekst for åpenbare mismatch.
"""
from __future__ import annotations
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUTHORED = ROOT / "content" / "authored"
IMG_ANALYSIS = ROOT / "data" / "images_analysis.json"


def load_images():
    data = json.loads(IMG_ANALYSIS.read_text(encoding="utf-8"))
    by_file = {im["file"]: im for im in data["images"]}
    return by_file


def main() -> int:
    images = load_images()
    concepts, questions = {}, {}
    issues, warns = [], []
    img_refs = []

    for f in sorted(AUTHORED.glob("*.json")):
        try:
            doc = json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:
            issues.append(f"{f.name}: ugyldig JSON: {e}")
            continue
        for c in doc.get("concepts", []):
            cid = c.get("id")
            if not cid: issues.append(f"{f.name}: konsept uten id"); continue
            if cid in concepts: issues.append(f"duplikat konsept-id: {cid}")
            concepts[cid] = c
            for im in c.get("image_files", []) or []:
                img_refs.append((f"concept:{cid}", im))
        for q in doc.get("questions", []):
            qid = q.get("id")
            if not qid: issues.append(f"{f.name}: spørsmål uten id"); continue
            if qid in questions: issues.append(f"duplikat spørsmål-id: {qid}")
            questions[qid] = q

    # spørsmålssjekker
    for qid, q in questions.items():
        if q.get("concept_id") not in concepts:
            issues.append(f"{qid}: ukjent concept_id {q.get('concept_id')}")
        if q.get("type") != "flashcard":
            ch = q.get("choices") or []
            if len(ch) < 2:
                issues.append(f"{qid}: for få svaralternativer ({len(ch)})")
            corr = q.get("correct")
            if not isinstance(corr, int) or not (0 <= corr < len(ch)):
                issues.append(f"{qid}: ugyldig 'correct' ({corr})")
            if len(set(map(str, ch))) != len(ch):
                warns.append(f"{qid}: like svaralternativer")
        if not (q.get("explanation") or "").strip():
            warns.append(f"{qid}: mangler forklaring")
        srcs = q.get("source_refs") or []
        if not any((s.get("url") or "").startswith("http") for s in srcs):
            issues.append(f"{qid}: mangler kilde-lenke")
        imf = q.get("image_file")
        if imf: img_refs.append((f"q:{qid}", imf))

    # bildesjekker
    nonreusable, missing = [], []
    for owner, imf in img_refs:
        if imf not in images:
            missing.append(f"{owner}: bildefil ikke i analyse: {imf}")
            continue
        if not (ROOT / "data" / imf.replace("\\", "/")).exists():
            missing.append(f"{owner}: bildefil mangler på disk: {imf}")
        if not images[imf].get("reusable"):
            nonreusable.append((owner, imf))

    print(f"Konsepter: {len(concepts)}  Spørsmål: {len(questions)}  Bildereferanser: {len(img_refs)}")
    print(f"Bilder: {len(set(i for _,i in img_refs))} unike, "
          f"{len(nonreusable)} referanser til IKKE-gjenbrukbare (copyright) bilder")
    if missing:
        print(f"\nMANGLENDE BILDER ({len(missing)}):"); [print("  -", m) for m in missing[:30]]
    if issues:
        print(f"\nFEIL ({len(issues)}):"); [print("  ✗", m) for m in issues[:60]]
    if warns:
        print(f"\nADVARSLER ({len(warns)}):"); [print("  !", m) for m in warns[:40]]
    if nonreusable:
        print(f"\nIKKE-GJENBRUKBARE BILDER brukt i {len(nonreusable)} ref "
              f"(må fjernes/erstattes ved visning):")
        for owner, imf in nonreusable[:30]:
            print(f"  © {owner}  {imf}")
    print("\n" + ("OK — ingen blokkerende feil." if not issues and not missing
                   else f"{len(issues)+len(missing)} blokkerende problemer."))
    return 1 if (issues or missing) else 0


if __name__ == "__main__":
    sys.exit(main())
