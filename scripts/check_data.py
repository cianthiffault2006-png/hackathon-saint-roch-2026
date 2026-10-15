"""Asserts public/data/*.json match src/types.ts (the frozen contract). Usage: py -3.12 scripts/check_data.py"""
import json
from datetime import datetime
from pathlib import Path
from shapely.geometry import shape, Point

D = Path(__file__).resolve().parent.parent / "public" / "data"
ld = lambda n: json.load(open(D / n, encoding="utf-8"))
ROLE = {"commerce", "organisme", "citoyen"}
TAG = {"espace_interieur", "espace_exterieur", "visibilite", "affichage", "benevoles", "public", "contenu_artistique",
       "animation", "materiel", "expertise", "financement", "nourriture"}
CRE = {"semaine_jour", "semaine_soir", "fin_de_semaine"}
THEME = {"culture", "art", "communautaire", "jeunesse", "etudiants", "environnement", "commerce_local", "securite", "sport", "alimentation"}
SRC = {"fictif", "ouvert", "utilisateur"}
LTYPE = {"parc", "salle", "lieu_culturel", "place_publique", "stationnement", "colonne_morris"}


def keys(o, expected, optional=()):
    k = set(o)
    assert set(expected) <= k <= set(expected) | set(optional), f"{o.get('id')}: keys {sorted(k ^ set(expected))}"


def sub(vals, allowed, what, nonempty=False):
    assert isinstance(vals, list), what
    assert set(vals) <= allowed, f"{what}: {set(vals) - allowed}"
    assert len(vals) == len(set(vals)), f"{what}: duplicates"
    if nonempty:
        assert vals, f"{what}: empty"


q = ld("quartier.geojson")
assert q["type"] == "Feature" and q["geometry"]["type"] in ("Polygon", "MultiPolygon")
poly = shape(q["geometry"])
inside = lambda o: poly.contains(Point(o["lng"], o["lat"]))

profils, lieux, evs = ld("profils.json"), ld("lieux.json"), ld("evenements.json")
for name, rows in (("profils", profils), ("lieux", lieux), ("evenements", evs)):
    ids = [r["id"] for r in rows]
    assert len(ids) == len(set(ids)), f"{name}: duplicate ids"

for p in profils:
    keys(p, ["id", "role", "sousType", "nom", "description", "lat", "lng", "offres", "besoins", "creneaux", "themes", "source", "origine", "reclame"], ["verifie", "contactPublic"])
    assert p["role"] in ROLE and p["source"] in SRC
    for f in ("sousType", "nom", "description", "origine"):
        assert isinstance(p[f], str) and p[f].strip(), (p["id"], f)
    assert isinstance(p["reclame"], bool)
    assert p.get("verifie") in ("sdc", "ville", "non"), p["id"] + " verifie"
    assert isinstance(p.get("contactPublic"), bool), p["id"] + " contactPublic"
    assert not (p["contactPublic"] and not p["reclame"]), p["id"] + " contactPublic on unclaimed"
    sub(p["offres"], TAG, p["id"] + " offres", True)
    sub(p["besoins"], TAG, p["id"] + " besoins", True)
    sub(p["creneaux"], CRE, p["id"] + " creneaux", True)
    sub(p["themes"], THEME, p["id"] + " themes", True)
    assert inside(p), p["id"] + " outside outline"
assert 40 <= len(profils) <= 55
for r in ROLE:
    assert sum(p["role"] == r for p in profils) >= 12, r
assert {"story-cafe", "story-artiste", "story-organisme", "p-proprete", "p-sofia"} <= {p["id"] for p in profils}
claimed = [p for p in profils if p["reclame"]]
assert 0.35 <= sum(p["contactPublic"] for p in claimed) / len(claimed) <= 0.65
assert sum(p["verifie"] == "sdc" for p in profils if p["role"] == "commerce") >= 10
frac = sum(not p["reclame"] for p in profils) / len(profils)
# Citizens are never pre-filled: they only exist if they signed up, so only businesses and organisms count here.
assert 0.15 <= frac <= 0.45, frac
by = {p["id"]: p for p in profils}
import math
def wd(a, b):
    return math.hypot((a["lng"] - b["lng"]) * math.cos(math.radians(46.81)) * 111320, (a["lat"] - b["lat"]) * 110540)
trio = [by["story-cafe"], by["story-artiste"], by["story-organisme"]]
assert max(wd(a, b) for a in trio for b in trio) <= 420, "story trio more than 5 minutes apart"

for l in lieux:
    keys(l, ["id", "nom", "type", "lat", "lng", "offres", "source", "attribution"])
    assert l["type"] in LTYPE and l["source"] in SRC and l["nom"].strip() and l["attribution"].strip()
    sub(l["offres"], TAG, l["id"] + " offres")
    assert inside(l), l["id"] + " outside outline"
assert sum(l["type"] == "colonne_morris" for l in lieux) == 6
assert all(l["source"] == "fictif" for l in lieux if l["type"] == "colonne_morris")

for e in evs:
    keys(e, ["id", "titre", "lieuNom", "lat", "lng", "debut", "fin", "categorie", "themes", "source"], ["promoteurId", "ouvertAuPublic", "inscrits"])
    assert e["source"] in SRC
    sub(e["themes"], THEME, e["id"] + " themes", True)
    assert isinstance(e.get("ouvertAuPublic"), bool), e["id"] + " ouvertAuPublic"
    if e["ouvertAuPublic"]:
        assert isinstance(e.get("inscrits"), int) and 12 <= e["inscrits"] <= 140, e["id"] + " inscrits"
    else:
        assert "inscrits" not in e, e["id"]
    if "promoteurId" in e:
        assert e["promoteurId"] in by, e["id"]
    d0, d1 = datetime.fromisoformat(e["debut"]), datetime.fromisoformat(e["fin"])
    assert d0 < d1 and datetime(2026, 10, 1) <= d0 <= datetime(2026, 12, 31), e["id"]
    assert inside(e), e["id"] + " outside outline"
assert sum(e['ouvertAuPublic'] for e in evs) >= 8
assert 14 <= len(evs) <= 20 and any("promoteurId" in e for e in evs)
print(f"OK: {len(profils)} profils, {len(lieux)} lieux, {len(evs)} evenements, outline valid, ids unique, story trio present")
