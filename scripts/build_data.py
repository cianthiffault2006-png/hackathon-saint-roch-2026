"""Builds public/data/*.json for Maillage. Fictional profiles/events on real address points
(Ville de Québec open data, CC BY 4.0) inside the Saint-Roch outline.
Usage: py -3.12 scripts/build_data.py <addresses.csv>   (vdq-adressesducdq.csv, not committed)
"""
import csv, json, math, random, sys
from pathlib import Path
from shapely.geometry import shape, Point

ROOT = Path(__file__).resolve().parent.parent
OPEN = ROOT / "data" / "open"
OUT = ROOT / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)
random.seed(14)

q = json.load(open(OPEN / "saint_roch_quartier.geojson", encoding="utf-8"))["features"][0]
poly = shape(q["geometry"])
inner = poly.buffer(-0.0004)
json.dump({"type": "Feature", "properties": {"nom": "Saint-Roch", "source": "Ville de Québec, Quartiers (CC BY 4.0)"},
           "geometry": q["geometry"]}, open(OUT / "quartier.geojson", "w", encoding="utf-8"), ensure_ascii=False)

# real address points = positions on streets
pts = []
for r in csv.DictReader(open(sys.argv[1], encoding="utf-8-sig")):
    try:
        p = Point(float(r["LONGITUDE"]), float(r["LATITUDE"]))
    except ValueError:
        continue
    if inner.contains(p):
        pts.append((p.x, p.y))
pts = sorted(set(pts))
print("address points in outline:", len(pts))


def wd(a, b):  # metres
    return math.hypot((a[0] - b[0]) * math.cos(math.radians(46.81)) * 111320, (a[1] - b[1]) * 110540)


c = poly.centroid
centre = min(pts, key=lambda p: wd(p, (c.x, c.y)))


def near(ref, lo, hi):
    return random.choice([p for p in pts if lo <= wd(p, ref) <= hi])


cafe_pt = centre
art_pt = near(cafe_pt, 180, 260)
org_pt = near(cafe_pt, 180, 260)
while wd(org_pt, art_pt) > 400:
    org_pt = near(cafe_pt, 180, 260)

# spread the rest with farthest-point sampling
chosen = [cafe_pt, art_pt, org_pt]
rest = []
while len(rest) < 60:
    best = max(pts, key=lambda p: min(wd(p, k) for k in chosen + rest))
    rest.append(best)
random.shuffle(rest)

EI, EE, V, A, B, P, CA, AN, M, EX, F, N = ("espace_interieur", "espace_exterieur", "visibilite", "affichage", "benevoles",
    "public", "contenu_artistique", "animation", "materiel", "expertise", "financement", "nourriture")
J, S, W = "semaine_jour", "semaine_soir", "fin_de_semaine"
LSVC, ORG, ENT, SDC, ART, ETU, ETE = ("Liste organismes reconnus LSVC", "Liste organismes LSVC", "Entreprises St-Roch",
    "Membres SDC Centre-Ville", "Collection Art Public", "Nombre_étudiants_Québec", "Projets ÉTÉ 2026")

# id, role, sousType, nom, description, offres, besoins, creneaux, themes, origine
D = [
 ("story-cafe", "commerce", "café", "Café Le Parvis", "Café de quartier avec une grande salle et une clientèle fidèle, qui cherche à faire vivre ses soirées.", [EI, N, P], [AN, CA, V], [S], ["culture", "commerce_local"], ENT),
 ("story-artiste", "citoyen", "artiste", "Camille P., peintre", "Peintre du quartier qui cherche un mur et un public pour montrer ses toiles.", [CA, AN], [EI, V, P], [S, W], ["art", "culture", "commerce_local"], ART),
 ("story-organisme", "organisme", "organisme culturel", "Collectif Les Fenêtres Ouvertes", "Collectif culturel qui mobilise des bénévoles et diffuse la création locale, mais sans salle.", [B, V, A, AN], [EI, CA], [S], ["culture", "communautaire"], LSVC),
 ("p-resto", "commerce", "restaurant", "Resto La Tablée du Coin", "Bistro de cuisine du marché, ouvert le soir et la fin de semaine.", [EI, N, P], [V, AN], [S, W], ["alimentation", "commerce_local"], SDC),
 ("p-librairie", "commerce", "librairie", "Librairie La Marge Douce", "Librairie indépendante avec un coin lecture et des vitrines à partager.", [EI, V, A, P], [AN, CA], [S], ["culture", "commerce_local"], ENT),
 ("p-brasserie", "commerce", "microbrasserie", "Microbrasserie Le Houblon Voisin", "Microbrasserie avec une terrasse et une salle de dégustation.", [EI, EE, N, P], [AN, V, CA], [S, W], ["commerce_local", "alimentation"], SDC),
 ("p-salle", "commerce", "salle de spectacle privée", "Salle Le Bémol", "Petite salle de spectacle privée de cent places, libre certains soirs.", [EI, P, A], [CA, V, M], [S, W], ["culture", "art"], SDC),
 ("p-boutique", "commerce", "boutique", "Boutique Fil & Aiguille", "Boutique de vêtements de designers locaux, vitrine sur rue passante.", [V, A, P], [AN, CA, P], [J, W], ["commerce_local", "art"], ENT),
 ("p-boulangerie", "commerce", "boulangerie", "Boulangerie Pain de Ville", "Boulangerie de quartier avec une petite terrasse, tôt le matin.", [N, P, EE], [B, V], [J], ["alimentation", "commerce_local"], ENT),
 ("p-disquaire", "commerce", "disquaire", "Disques Vinyle Nord", "Disquaire avec un espace libre au fond de la boutique.", [EI, P, V], [AN, CA], [S], ["culture", "commerce_local"], ENT),
 ("p-epicerie", "commerce", "épicerie fine", "Épicerie Le Marché du Coin", "Épicerie de produits locaux avec un grand trottoir devant la porte.", [N, V, A, EE], [AN, B], [J, W], ["alimentation", "environnement"], SDC),
 ("p-plantes", "commerce", "boutique de plantes", "Les Mains Vertes", "Atelier-boutique de plantes et de matériel de jardinage urbain.", [M, EX, EE], [V, P], [W], ["environnement", "commerce_local"], ENT),
 ("p-galerie", "commerce", "galerie-boutique", "Galerie L'Éclat", "Galerie-boutique d'artisans qui renouvelle ses murs chaque mois.", [EI, V, A, P], [CA, AN], [S, W], ["art", "culture"], SDC),
 ("p-jeux", "commerce", "café-jeux", "Café-jeux Le Dé Pipé", "Café de jeux de société très fréquenté par les étudiants.", [EI, P, N], [AN, B, V], [S, W], ["jeunesse", "etudiants", "commerce_local"], ENT),
 ("p-friperie", "commerce", "friperie", "Friperie solidaire Deuxième Vie", "Friperie à vocation sociale avec un grand local au rez-de-chaussée.", [EI, M, V], [B, P], [J], ["environnement", "communautaire", "commerce_local"], SDC),
 ("p-yoga", "commerce", "studio de yoga", "Studio Souffle", "Studio de yoga et de mouvement avec une salle lumineuse.", [EI, EX], [P, V], [J, S], ["sport", "commerce_local"], ENT),
 ("p-mdj", "organisme", "organisme jeunesse", "Maison des jeunes du Faubourg", "Maison des jeunes de douze à dix-sept ans, avec un local d'activités.", [EI, AN, P], [F, EX, M], [S, W], ["jeunesse", "communautaire"], LSVC),
 ("p-jardins", "organisme", "organisme environnemental", "Jardins collectifs du Faubourg", "Jardins communautaires en bacs avec des jardiniers bénévoles.", [EE, B, M, EX], [F, V, A], [J, W], ["environnement", "communautaire", "alimentation"], LSVC),
 ("p-table", "organisme", "organisme communautaire", "Table de concertation Saint-Roch Solidaire", "Table de concertation des groupes communautaires, avec un babillard et des communications.", [A, V, P, B], [EI, N, AN], [J, S], ["communautaire"], LSVC),
 ("p-theatre", "organisme", "organisme culturel", "Troupe Les Intempestifs", "Troupe de théâtre amateur qui cherche des lieux de répétition et de représentation.", [CA, AN], [EI, M, V], [S, W], ["culture", "art"], ORG),
 ("p-aeav", "organisme", "association étudiante", "Association étudiante des arts visuels", "Association étudiante qui fournit des œuvres et des bénévoles pour des expositions.", [CA, B, P], [EI, V, M], [S, W], ["etudiants", "art"], ETU),
 ("p-mediation", "organisme", "médiation urbaine", "Équipe Médiation Urbaine Basse-Ville", "Équipe de médiation qui accompagne les passants en soirée.", [EX, B, P], [V, F], [S], ["securite", "communautaire"], LSVC),
 ("p-comitevert", "organisme", "organisme environnemental", "Comité vert de la Basse-Ville", "Comité de citoyens qui organise des corvées de verdissement.", [B, EX, M], [EE, V, F], [W], ["environnement", "communautaire"], ORG),
 ("p-cirque", "organisme", "organisme culturel", "Atelier de cirque Les Saltimbanques", "Atelier de cirque social pour jeunes, démonstrations de rue.", [AN, EX, CA, M], [EI, P, V], [S, W], ["jeunesse", "culture", "sport"], ORG),
 ("p-chorale", "organisme", "organisme culturel", "Chorale Voix du Faubourg", "Chorale communautaire de quarante membres, concerts sans scène fixe.", [CA, P, B], [EI, V], [S], ["culture", "communautaire"], LSVC),
 ("p-marmite", "organisme", "organisme communautaire", "Cuisine collective La Marmite", "Cuisine collective qui prépare des repas et les partage.", [N, B, EX, EI], [F, P, V, M], [J], ["alimentation", "communautaire"], LSVC),
 ("p-foulees", "organisme", "organisme sportif", "Club Les Foulées du Faubourg", "Club de course à pied du quartier, sorties en soirée.", [P, B, EX], [A, EE, V], [S, W], ["sport", "jeunesse"], ORG),
 ("p-obscura", "organisme", "organisme culturel", "Centre de photographie Obscura", "Centre d'artistes en photographie avec une salle d'exposition.", [EI, CA, EX, V], [F, P, A], [J, S], ["art", "culture"], LSVC),
 ("p-radio", "organisme", "organisme culturel", "Radio communautaire Ondes Libres", "Radio communautaire qui relaie les activités locales.", [V, A, EX], [B, EI, CA], [S], ["culture", "communautaire"], ORG),
 ("p-aines", "organisme", "organisme communautaire", "Association Mémoire Vive", "Association d'aînés qui partage l'histoire du quartier.", [EX, P], [AN, EI, B], [J], ["communautaire"], LSVC),
 ("p-sculptrice", "citoyen", "artiste", "Alix R., sculptrice", "Sculptrice qui expose des petites pièces et anime des ateliers.", [CA, EX], [EI, V, P], [W], ["art", "culture"], ART),
 ("p-photographe", "citoyen", "artiste", "Noé B., photographe", "Photographe de rue qui documente le quartier.", [CA, V], [EI, A, P], [S, W], ["art", "culture"], ART),
 ("p-illustratrice", "citoyen", "artiste", "Zoé L., illustratrice", "Illustratrice qui crée des affiches et des fresques à petite échelle.", [CA, M], [V, EI, F], [J, W], ["art", "commerce_local"], ART),
 ("p-musicien", "citoyen", "artiste", "Félix M., musicien", "Guitariste-chanteur qui cherche des scènes intimes.", [CA, AN], [EI, P, V], [S, W], ["culture", "art"], ART),
 ("p-danseuse", "citoyen", "artiste", "Sofia D., danseuse", "Danseuse contemporaine qui propose des performances de rue.", [CA, AN], [EE, P, V], [W], ["art", "culture"], ART),
 ("p-etu-design", "citoyen", "étudiant", "Hugo T., étudiant en design", "Étudiant en design graphique prêt à créer des affiches.", [B, CA, EX], [V, P], [S, W], ["etudiants", "art"], ETU),
 ("p-etu-social", "citoyen", "étudiant", "Inès K., étudiante en travail social", "Étudiante bénévole qui cherche une cause dans le quartier.", [B, EX], [P, AN], [S, W], ["etudiants", "communautaire"], ETU),
 ("p-etu-genie", "citoyen", "étudiant", "Malik A., étudiant en génie", "Étudiant qui peut monter des installations et du matériel.", [B, M, EX], [V, P], [W], ["etudiants", "environnement"], ETU),
 ("p-benevoles-cegep", "citoyen", "étudiant", "Équipe bénévole étudiante du Faubourg", "Petit groupe d'étudiants bénévoles disponibles les fins de semaine.", [B, P], [AN, N], [W], ["etudiants", "jeunesse"], ETU),
 ("p-resident-1", "citoyen", "nouveau résident", "Nouveaux résidents du Quai des Lofts", "Nouveaux résidents d'un immeuble de logements qui veulent rencontrer le quartier.", [P, B], [AN, N], [S, W], ["communautaire", "commerce_local"], ETE),
 ("p-resident-2", "citoyen", "nouveau résident", "Résidents de la Coopérative des Arts", "Résidents d'une coopérative d'habitation, disposés à accueillir le public dans la cour.", [EE, P, B], [AN, CA], [W], ["communautaire", "art"], ETE),
 ("p-resident-3", "citoyen", "nouveau résident", "Jade et Samuel, nouveaux voisins", "Couple installé depuis l'été, curieux et disponibles les soirs.", [B, P], [AN, N, P], [S], ["communautaire", "alimentation"], ETE),
 ("p-retraite", "citoyen", "citoyen engagé", "Gaston V., retraité", "Retraité du quartier qui connaît l'histoire locale et aime guider des visites.", [EX, B, P], [V, AN], [J, W], ["communautaire", "culture"], ETE),
 ("p-cuisinier", "citoyen", "citoyen engagé", "Rémi C., cuisinier amateur", "Cuisinier amateur qui prépare des repas pour des activités de rue.", [N, B], [EE, M, V], [W], ["alimentation", "communautaire"], ETE),
 ("p-peintre-2", "citoyen", "artiste", "Lou G., muraliste", "Muraliste qui cherche des murs aveugles à embellir avec la permission des propriétaires.", [CA, EX], [EE, A, V], [W], ["art", "commerce_local"], ART),
 ("p-etu-musique", "citoyen", "étudiant", "Thomas E., étudiant en musique", "Étudiant en musique qui anime des soirées de poésie et de jazz.", [CA, AN, B], [EI, P], [W], ["etudiants", "culture"], ETU),
 ("p-resident-4", "citoyen", "nouveau résident", "Famille Beaulieu-Diop, nouveaux résidents", "Famille arrivée dans un nouveau logement, curieuse des activités jeunesse.", [B, P], [AN, EI], [W], ["jeunesse", "communautaire"], ETE),
 ("p-proprete", "organisme", "entreprise d'économie sociale", "Équipe Propreté du Faubourg", "Entreprise d'économie sociale qui nettoie et verdit les rues et les ruelles avec des équipes d'insertion.", [M, EX, B], [V, F, P], [J, W], ["environnement", "securite", "commerce_local"], LSVC),
 ("p-sofia", "citoyen", "citoyen engagé", "Sofia, résidente de la rue Saint-Joseph", "Résidente qui voit les déchets s'accumuler dans sa rue et veut agir avec ses voisins.", [B, V], [B, M, EX], [S, W], ["environnement", "securite"], ETE),
]
assert len(D) >= 45
story_pts = {"story-cafe": cafe_pt, "story-artiste": art_pt, "story-organisme": org_pt}
profils, used, n_claimed = [], 0, 0
for i, d in enumerate(D):
    id_, role, st, nom, desc, of, be, cr, th, org = d
    pt = story_pts.get(id_)
    if pt is None:
        pt = rest[used]
        used += 1
    reclame = True if (id_.startswith("story") or id_ in ("p-proprete", "p-sofia")) else (i % 3 != 0)
    if role == "commerce":
        verifie = "non" if (org == ENT and i % 4 == 0) else "sdc"
    elif role == "organisme":
        verifie = "ville" if org == LSVC else "non"
    else:
        verifie = "non"
    contact = False
    if reclame:
        n_claimed += 1
        contact = n_claimed % 2 == 1
    profils.append(dict(id=id_, role=role, sousType=st, nom=nom, description=desc, lat=round(pt[1], 6), lng=round(pt[0], 6),
                        offres=of, besoins=be, creneaux=cr, themes=th, source="fictif", origine=org, reclame=reclame,
                        verifie=verifie, contactPublic=contact))
# story profiles: names, descriptions and pins from public/seed/story.json (main), tags from the gate 1 brief
seed = {x["id"]: x for x in json.load(open(ROOT / "public" / "seed" / "story.json", encoding="utf-8"))}
for p in profils:
    if p["id"] in seed:
        for k in ("nom", "description", "lat", "lng"):
            p[k] = seed[p["id"]][k]
byid = {p["id"]: p for p in profils}

# lieux: real open data inside the outline
LV = "Source : Ville de Québec, Lieux publics, licence CC BY 4.0"
LT = "Source : ministère du Tourisme du Québec (SIT Québec), licence CC BY 4.0"
lieux = []
kind = {"Stationnements": ("stationnement", []), "Jardins municipaux": ("parc", [EE, P]), "Parc canin": ("parc", [EE, P]),
        "Parcs écoles": ("parc", [EE, P]), "Terrains de tennis": ("parc", [EE, P]), "Bibliothèques": ("salle", [EI, P]),
        "Centres communautaires": ("salle", [EI, P]), "Pavillons de services": ("salle", [EI]), "Pavillon": ("salle", [EI]),
        "Universités": ("salle", [EI, V])}
for f in json.load(open(OPEN / "lieux_publics_saint_roch.geojson", encoding="utf-8"))["features"]:
    pr = f["properties"]
    k = kind.get(pr["DESCRIPTION"])
    if k and "Marina" in (pr["NOM_TOPOGRAPHIE"] or ""):
        k = ("place_publique", [EE, P])
    if not k:
        continue
    x, y = f["geometry"]["coordinates"][:2]
    if not poly.contains(Point(x, y)):
        continue
    lieux.append(dict(id=f"vque14-{pr['ID']}", nom=pr["NOM_TOPOGRAPHIE"] or pr["DESCRIPTION"], type=k[0], lat=round(y, 6), lng=round(x, 6),
                      offres=k[1], source="ouvert", attribution=LV))
seen = set()
for f in json.load(open(OPEN / "sit_quebec_culture_saint_roch.geojson", encoding="utf-8"))["features"]:
    pr = f["properties"]
    x, y = f["geometry"]["coordinates"]
    if not poly.contains(Point(x, y)) or pr["NomEtablissement"] in seen:
        continue
    seen.add(pr["NomEtablissement"])
    lieux.append(dict(id=f"sit-{pr['IdentifiantUnique']}", nom=pr["NomEtablissement"], type="lieu_culturel", lat=round(y, 6), lng=round(x, 6),
                      offres=[EI, V], source="ouvert", attribution=LT))
for i in range(6):
    pt = rest[used]
    used += 1
    lieux.append(dict(id=f"morris-{i + 1}", nom=f"Colonne Morris fictive {i + 1}", type="colonne_morris", lat=round(pt[1], 6), lng=round(pt[0], 6),
                      offres=[A, V], source="fictif", attribution="Données fictives"))


# evenements (fictional)
def ev(i, titre, promo, lieu, d, h1, h2, cat, th, pt=None, at=None, insc=None):
    p = byid.get(at or promo) if (at or promo) else None
    lat, lng = (p["lat"], p["lng"]) if p else (round(pt[1], 6), round(pt[0], 6))
    e = dict(id=f"ev-{i:02d}", titre=titre)
    if promo:
        e["promoteurId"] = promo
    e.update(lieuNom=lieu, lat=lat, lng=lng, debut=f"2026-{d}T{h1}:00", fin=f"2026-{d}T{h2}:00", categorie=cat, themes=th, source="fictif", ouvertAuPublic=insc is not None)
    if insc is not None:
        e["inscrits"] = insc
    return e


evs = [
 ev(1, "Soirée de lancement de saison", "story-cafe", "Café Le Petit Détour", "10-29", "19:00", "21:30", "soirée", ["culture", "commerce_local"]),
 ev(2, "Lecture publique d'automne", "p-librairie", "Librairie La Marge Douce", "10-22", "19:00", "20:30", "lecture", ["culture"], insc=35),
 ev(3, "Dégustation de bières d'automne", "p-brasserie", "Microbrasserie Le Houblon Voisin", "10-24", "16:00", "19:00", "dégustation", ["alimentation", "commerce_local"], insc=60),
 ev(4, "Spectacle de quartier", "p-salle", "Salle Le Bémol", "11-06", "20:00", "22:30", "spectacle", ["culture", "art"]),
 ev(5, "Corvée de verdissement d'automne", "p-comitevert", "Local du Comité vert", "10-25", "10:00", "13:00", "corvée", ["environnement", "communautaire"], insc=45),
 ev(6, "Vernissage collectif", "p-obscura", "Centre de photographie Obscura", "11-12", "18:00", "20:30", "exposition", ["art", "culture"]),
 ev(7, "Soupe populaire de novembre", "p-marmite", "Cuisine collective La Marmite", "11-14", "11:30", "13:30", "repas communautaire", ["alimentation", "communautaire"], insc=80),
 ev(8, "Soirée de jeux étudiante", "p-jeux", "Café-jeux Le Dé Pipé", "11-18", "18:30", "22:00", "soirée étudiante", ["etudiants", "jeunesse"]),
 ev(9, "Concert de la chorale", "p-chorale", "Local de la chorale", "11-20", "19:30", "21:00", "concert", ["culture", "communautaire"], insc=70),
 ev(10, "Marché de Noël des artisans", "p-galerie", "Galerie L'Éclat", "12-05", "10:00", "17:00", "marché", ["art", "commerce_local"], insc=140),
 ev(11, "Démonstration de cirque de rue", "p-cirque", "Atelier de cirque", "11-28", "14:00", "16:00", "animation de rue", ["jeunesse", "culture"], insc=25),
 ev(12, "Course nocturne des lumières", "p-foulees", "Départ du local du club", "12-03", "18:30", "20:30", "sport", ["sport", "jeunesse"], insc=95),
 ev(13, "Café-causerie sur l'histoire du quartier", "p-aines", "Local de l'association", "10-30", "14:00", "15:30", "conférence", ["communautaire"]),
 ev(14, "Soirée d'accueil des nouveaux résidents", None, "Salle communautaire", "11-05", "18:00", "20:00", "accueil", ["communautaire"], pt=rest[used]),
 ev(15, "Soirée d'improvisation du jeudi", "p-theatre", "Salle Le Bémol", "12-10", "20:00", "22:00", "spectacle", ["culture", "art"], at="p-salle"),
 ev(17, "Corvée de propreté de la rue Saint-Joseph", "p-proprete", "Départ du local de l'Équipe Propreté", "11-01", "10:00", "12:30", "corvée", ["environnement", "securite"], insc=38),
 ev(18, "Plantation de bulbes et ruelle verte", "p-comitevert", "Local du Comité vert", "11-08", "10:00", "13:00", "verdissement", ["environnement", "communautaire"], insc=12),
 ev(16, "Atelier de peinture ouvert", "story-artiste", "Atelier de Camille", "12-12", "13:00", "16:00", "atelier", ["art", "culture"]),
]
# events held at a place other than the promoter's address use the promoter's point (kept simple)
json.dump(profils, open(OUT / "profils.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(lieux, open(OUT / "lieux.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(evs, open(OUT / "evenements.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(profils), "profils", len(lieux), "lieux", len(evs), "evenements")
