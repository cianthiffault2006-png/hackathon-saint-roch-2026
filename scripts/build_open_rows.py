"""Real open-data rows for Maillage (day 2): SIT Québec establishments and Ville de Québec places of worship
inside the Saint-Roch outline, as pre-filled profiles (reclame=False) and public places. All CC BY 4.0.
Usage: py -3.12 scripts/build_open_rows.py [<raw dir>]
  <raw dir> holds the national files downloaded from donneesquebec.ca (not committed):
  sit_restauration.csv, sit_divertissements.csv, sit_organismes.csv (';' CSV), vque_45_lieux_culte.geojson.
  Without it, the script rebuilds public/data from the extracts already in data/open/.
Never reads data-private/.
"""
import csv, json, sys
from pathlib import Path
from shapely.geometry import shape, Point

ROOT = Path(__file__).resolve().parent.parent
OPEN = ROOT / "data" / "open"
OUT = ROOT / "public" / "data"
poly = shape(json.load(open(OPEN / "saint_roch_quartier.geojson", encoding="utf-8"))["features"][0]["geometry"])

# Columns kept from SIT Québec (contact columns dropped: phone, email, website).
SIT_KEEP = ("IdentifiantUnique", "NomEtablissement", "TypeEtablissement", "NumeroVoie", "Municipalite",
            "CapaciteEnSallePersonnes", "CapaciteEnTerrassePersonnes", "InstallationsDisponibles", "ServicesDisponibles")
SIT = {  # raw file -> (extract, dataset title on donneesquebec.ca)
    "sit_restauration.csv": ("sit_quebec_restauration_saint_roch.geojson", "Restauration"),
    "sit_divertissements.csv": ("sit_quebec_divertissements_saint_roch.geojson", "Divertissements et loisirs"),
    "sit_organismes.csv": ("sit_quebec_organismes_saint_roch.geojson", "Organismes touristiques"),
}
CULTE_RAW, CULTE_OUT = "vque_45_lieux_culte.geojson", "vque_45_lieux_culte_saint_roch.geojson"


def extraire(raw: Path) -> None:
    for f, (out, _) in SIT.items():
        feats = []
        for r in csv.DictReader(open(raw / f, encoding="utf-8-sig"), delimiter=";"):
            try:
                x, y = float(r["Longitude"].replace(",", ".")), float(r["Latitude"].replace(",", "."))
            except ValueError:
                continue
            if poly.contains(Point(x, y)):
                feats.append({"type": "Feature", "properties": {k: r.get(k, "") for k in SIT_KEEP},
                              "geometry": {"type": "Point", "coordinates": [round(x, 6), round(y, 6)]}})
        json.dump({"type": "FeatureCollection", "features": feats}, open(OPEN / out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(out, len(feats))
    d = json.load(open(raw / CULTE_RAW, encoding="utf-8"))
    feats = [x for x in d["features"] if poly.intersects(shape(x["geometry"]))]
    json.dump({"type": "FeatureCollection", "features": feats}, open(OPEN / CULTE_OUT, "w", encoding="utf-8"), ensure_ascii=False)
    print(CULTE_OUT, len(feats))


EI, EE, V, A, P, CA, AN, EX, N = ("espace_interieur", "espace_exterieur", "visibilite", "affichage", "public",
                                  "contenu_artistique", "animation", "expertise", "nourriture")
S, W, J = "semaine_soir", "fin_de_semaine", "semaine_jour"
# TypeEtablissement -> (role, sousType, offres, besoins, creneaux, themes). Needs are the generic ones of the type
# (what brings people in), refined by the establishment when it activates its profile; no single generic need such as
# 'visibilite', which any profile satisfies and let a real row outrank the story partners on reciprocity.
TYPES = {
    "Restaurant": ("commerce", "restaurant", [N, P], [AN, CA], [S, W], ["alimentation", "commerce_local"]),
    "Café / salon de thé": ("commerce", "café", [N, P], [AN, CA], [J, S], ["alimentation", "commerce_local"]),
    "Bar, boîte de nuit": ("commerce", "bar", [P, N], [AN, CA], [S, W], ["culture", "commerce_local"]),
    "Centre récréatif / sportif": ("commerce", "centre récréatif", [AN, P], [P, CA], [S, W], ["jeunesse", "commerce_local"]),
    "Organisme touristique": ("organisme", "organisme touristique", [V, EX, A], [CA, AN], [J], ["culture", "commerce_local"]),
}
LICENCE = "licence CC BY 4.0"


def profil_sit(pr: dict, dataset: str, geom: dict):
    t = TYPES.get(pr["TypeEtablissement"])
    if not t:
        return None
    role, st, of, be, cr, th = t
    of = list(of)
    details = []
    # Space offers come from the data only: a hall capacity gives espace_interieur, a terrace espace_exterieur.
    if pr.get("CapaciteEnSallePersonnes"):
        details.append(f"salle de {pr['CapaciteEnSallePersonnes']} personnes")
        of.insert(0, EI)
    if "Terrasse" in (pr.get("InstallationsDisponibles") or "") or pr.get("CapaciteEnTerrassePersonnes"):
        details.append("terrasse")
        of.append(EE)
    desc = f"{st[0].upper()}{st[1:]} de Saint-Roch" + (f" ({', '.join(details)})" if details else "") + \
        ". Fiche réelle du SIT Québec, à activer par l’établissement; les besoins indiqués sont ceux de son type."
    x, y = geom["coordinates"]
    return dict(id=f"sit-{pr['IdentifiantUnique']}", role=role, sousType=st, nom=pr["NomEtablissement"], description=desc,
                lat=round(y, 6), lng=round(x, 6), offres=of, besoins=list(be), creneaux=list(cr), themes=list(th), source="ouvert",
                origine=f"Source : ministère du Tourisme du Québec (SIT Québec), {dataset}, {LICENCE}", reclame=False, verifie="non", contactPublic=False)


def construire() -> None:
    profils = [p for p in json.load(open(OUT / "profils.json", encoding="utf-8")) if p.get("source") != "ouvert"]
    lieux = [l for l in json.load(open(OUT / "lieux.json", encoding="utf-8")) if not l["id"].startswith("vque45-")]
    n0, m0 = len(profils), len(lieux)
    for out, dataset in SIT.values():
        for f in json.load(open(OPEN / out, encoding="utf-8"))["features"]:
            p = profil_sit(f["properties"], dataset, f["geometry"])
            if p and p["id"] not in {q["id"] for q in profils}:
                profils.append(p)
    for f in json.load(open(OPEN / CULTE_OUT, encoding="utf-8"))["features"]:
        pr, c = f["properties"], shape(f["geometry"]).representative_point()
        lieux.append(dict(id=f"vque45-{pr['ID']}", nom=pr["NOM"], type="salle", lat=round(c.y, 6), lng=round(c.x, 6), offres=[EI, P],
                          source="ouvert", attribution=f"Source : Ville de Québec, Lieux de culte, {LICENCE}"))
    json.dump(profils, open(OUT / "profils.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(lieux, open(OUT / "lieux.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"profils: {n0} + {len(profils) - n0} ouverts; lieux: {m0} + {len(lieux) - m0} ouverts")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        extraire(Path(sys.argv[1]))
    construire()
