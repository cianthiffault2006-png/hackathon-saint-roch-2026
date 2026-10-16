"""Fake provided files (same file names, sheet names and columns as the organizers' pack, invented rows) to develop
and test build_presentation.py without touching data-private/. Usage: py -3.12 scripts/make_presentation_sample.py <dir>
"""
import datetime as dt, random, sys
from pathlib import Path
from openpyxl import Workbook

random.seed(3)
out = Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
RUES = [("Rue", "Saint-Joseph Est"), ("Rue", "Saint-Vallier Est"), ("Boulevard", "Charest Est"), ("Rue", "de la Couronne"),
        ("Rue", "du Pont"), ("Rue", "Dorchester"), ("Rue", "Saint-Paul")]


def xlsx(nom, feuille, cols, rows):
    wb = Workbook()
    ws = wb.active
    ws.title = feuille
    ws.append(cols)
    for r in rows:
        ws.append(r)
    wb.save(out / nom)


xlsx("DEGP - Entreprises St-Roch-Rev.xlsx", "Entreprises - St-Roch", ["Type rue", "Nom rue", "Marque de Commerce"],
     [(*random.choice(RUES), f"Commerce fictif {i}") for i in range(1, 41)] + [("Rue", "Saint-Paul", 12345), ("Avenue", "Inconnue", "Commerce ailleurs")])
xlsx("DEGP - Membres - SDC Centre-Ville-Rev.xlsx", "Membres - SDC Centre-Ville", ["Type rue", "Nom rue", "OBNL", "Marque de Commerce", "Activité commerciale"],
     [(*random.choice(RUES), "Non", f"Membre fictif {i}", random.choice(["Restaurant", "Boutique de vêtements", "Café", "Salon de coiffure"])) for i in range(1, 31)])
xlsx("CP-LSVC-Liste organismes reconnus LSVC-k.xlsx", "query (35)", ["Nom", "Domaine d'intervention", "Territoire(s)", "Statut", "Catégorie"],
     [(f"Organisme fictif {i}", random.choice(["Loisir", "Culture", "Communautaire"]), random.choice(["Saint-Roch", "Limoilou", "Ville de Québec; Saint-Roch"]), "Reconnu", "OBNL") for i in range(1, 21)])
xlsx("CP-LSVC-Liste installations-k.xlsx", "query (34)", ["Arrondissement_0", "Nom_Type_No_Installation_calculé", "Adresse", "Type d'équipement texte"],
     [("La Cité-Limoilou", "Installation fictive A", "350, rue Saint-Joseph Est", "Salle communautaire"),
      ("La Cité-Limoilou", "Installation fictive B", "160, rue Saint-Joseph Est", "Parc"),
      ("Beauport", "Installation fictive C", "40, boulevard Henri-Bourassa", "Aréna")])
xlsx("CP-LSVC-Collection Art Public-k.xlsx", "query", ["Collection", "Statut objet", "Artiste/artisan", "Titre œuvre", "Année", "Arrondissement", "Quartier ", "Adresse civique", "Géocode", "Type emplacement"],
     [("Ville", "Actif", "Personne Fictive", "Œuvre fictive 1", "2001", "La Cité-Limoilou", "Saint-Roch", "400, boulevard Charest Est", "46.8135, -71.2240", "Parc"),
      ("Ville", "Actif", "Personne Fictive", "Œuvre fictive 2", "2010", "La Cité-Limoilou", "Saint-Roch", "500, rue Saint-Joseph Est", "", "Rue"),
      ("Ville", "Actif", "Personne Fictive", "Œuvre ailleurs", "2010", "Beauport", "Vieux-Beauport", "1, chemin X", "", "Rue")])
d = dt.datetime.now() + dt.timedelta(days=5)
xlsx("CP-LSVC-Événements à venir-k.xlsx", "query (33)", ["Titre PROJET", "Promoteur", "Description (courte)", "Catégorie", "Site(s) de l'activité", "Quartier", "Date et heure de début", "Date et heure de fin"],
     [("Événement fictif 1", "Promoteur fictif", "desc", "Culture", "350, rue Saint-Joseph Est", "Saint-Roch", d, d + dt.timedelta(hours=3)),
      ("Événement fictif 2", "Promoteur fictif", "desc", "Sport", "Parc fictif", "Saint-Roch", d + dt.timedelta(days=2), None),
      ("Événement passé", "Promoteur fictif", "desc", "Culture", "Place", "Saint-Roch", d - dt.timedelta(days=30), None),
      ("Événement ailleurs", "Promoteur fictif", "desc", "Culture", "Place", "Montcalm", d, None)])
print("sample written to", out)
