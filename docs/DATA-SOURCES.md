# DATA-SOURCES (open data only; owner: data)

All files below are public open data, pulled on 2026-10-15 from donneesquebec.ca (CKAN API). None comes from the organizers' confidential pack. Licence for all: Creative Commons Attribution 4.0 (CC BY 4.0), https://www.donneesquebec.ca/licence/#cc-by. The portal prescribes no attribution sentence; the licence requires crediting the producer. Proposed wording (confirm against the organizers' pack): « Source : Ville de Québec, données ouvertes, licence CC BY 4.0 » and « Source : ministère du Tourisme du Québec (SIT Québec), licence CC BY 4.0 ». Files edited by us (clipped to Saint-Roch, columns dropped) must say "adapté de".

| File in `data/open/` | Source dataset | URL | Producer | Licence | Pulled | Notes |
|---|---|---|---|---|---|---|
| `vque_14_lieux_publics.geojson` | Lieux publics | https://www.donneesquebec.ca/recherche/dataset/vque_14 | Ville de Québec, Service de l'aménagement du territoire | CC BY 4.0 | 2026-10-15 | 1409 points, whole city. Fields ID, NO_CIVIQUE, NOM_TOPOGRAPHIE, SUPERFICIE, PERIMETRE, RUE, DESCRIPTION (type: Stationnements, Bibliothèques, Centres communautaires...). Dataset modified 2026-10-15. |
| `lieux_publics_saint_roch.geojson` | derived from vque_14 | same | same | CC BY 4.0 | 2026-10-15 | 31 points inside the Saint-Roch polygon (12 Stationnements, 5 Écoles spécialisées, 1 Bibliothèque, 1 Centre communautaire, 1 Université...). Adapted by us. |
| `vque_9_quartiers.geojson` | Quartiers | https://www.donneesquebec.ca/recherche/dataset/vque_9 | Ville de Québec, Service de l'ingénierie | CC BY 4.0 | 2026-10-15 | 35 polygons, fields ID, NOM, SUPERFICIE, PERIMETRE. |
| `saint_roch_quartier.geojson` | derived from vque_9 | same | same | CC BY 4.0 | 2026-10-15 | The Saint-Roch polygon only (WGS84). |
| `vque_24_reseau_cyclable.geojson` | Réseau cyclable | https://www.donneesquebec.ca/recherche/dataset/vque_24 | Ville de Québec, Division transport | CC BY 4.0 | 2026-10-15 | Whole city, 3.9 MB. Not in the provided pack; optional context layer. |
| `sit_quebec_hotels_saint_roch.geojson` | Hôtels, SIT Québec | https://www.donneesquebec.ca/recherche/dataset/sit-quebec-hotels | Ministère du Tourisme | CC BY 4.0 | 2026-10-15 | 31 rows within about 650 m of the Saint-Roch polygon. Some establishments appear in several rows (one row per unit type). Contact columns (phone, email) dropped. |
| `sit_quebec_restauration_saint_roch.geojson` | Restauration, SIT Québec | https://www.donneesquebec.ca/recherche/dataset/sit-quebec-restauration | Ministère du Tourisme | CC BY 4.0 | 2026-10-16 | 12 of 1924 rows inside the polygon (11 restaurants, 1 café). Columns kept: id, name, type, street address, capacities, installations, services; phone, email and website dropped. Script `scripts/build_open_rows.py`. |
| `sit_quebec_divertissements_saint_roch.geojson` | Divertissements et loisirs, SIT Québec | https://www.donneesquebec.ca/recherche/dataset/sit-quebec-divertissements-et-loisirs | Ministère du Tourisme | CC BY 4.0 | 2026-10-16 | 3 of 739 rows inside (1 bar, 2 centres récréatifs). Same columns. |
| `sit_quebec_organismes_saint_roch.geojson` | Organismes touristiques, SIT Québec | https://www.donneesquebec.ca/recherche/dataset/sit-quebec-organismes | Ministère du Tourisme | CC BY 4.0 | 2026-10-16 | 1 of 224 rows inside. Same columns. |
| `vque_45_lieux_culte_saint_roch.geojson` | Lieux de culte | https://www.donneesquebec.ca/recherche/dataset/vque_45 | Ville de Québec | CC BY 4.0 | 2026-10-16 | 2 of 92 polygons intersect the quartier (Église de Saint-Roch, Église de Notre-Dame-de-Jacques-Cartier); fields ID, NOM, TYPE, VALEUR_PATRIMONIALE, ARRONDISSEMENT, QUARTIER. Published as is. |
| `sit_quebec_culture_saint_roch.geojson` | Culture, arts et patrimoine, SIT Québec | https://www.donneesquebec.ca/recherche/dataset/sit-quebec-culture-art-et-patrimoine | Ministère du Tourisme | CC BY 4.0 | 2026-10-15 | 24 rows within about 650 m of the polygon. Contact columns dropped. |

Coordinates are WGS84 lon/lat (checked on the Saint-Roch polygon). Scripts: filtering was done with ad hoc Python (shapely); the pack inventory script is `scripts/schema.py`.

## Open equivalents checked on 2026-10-16 (day 2), per provided file
Checked on donneesquebec.ca (CKAN API: all 35 Ville de Québec datasets listed, plus the 16 SIT Québec datasets) and ville.quebec.qc.ca. "No" means no open dataset with the same content was found; the app then keeps fictional rows.

| Fichier fourni | Équivalent ouvert | Licence | Statut dans la démo |
|---|---|---|---|
| CP-LSVC-Collection Art Public | No (the City's art public pages are a website, no open licence; Données Québec has art public only for Rimouski, Montréal, Îles-de-la-Madeleine) | n/a | fictional artists |
| CP-LSVC-Liste organismes reconnus LSVC / Liste organismes | No (the City's « Répertoire des organismes » is a web page, no open licence). Partial: Organismes touristiques, SIT Québec (1 in Saint-Roch) | CC BY 4.0 | 1 real organism added, pre-filled |
| CP-LSVC-Liste installations | Partial: Lieux publics vque_14 (bibliothèques, centres communautaires, pavillons, parcs) already used; Lieux de culte vque_45 added; ZAP Wi-Fi vque_29 (13 points in Saint-Roch) not used | CC BY 4.0 | used |
| CP-LSVC-Événements à venir | Partial: Événements, SIT Québec (festivals; 3 in Saint-Roch, all with past dates on 2026-10-16: Mois Multi, Foodcamp, RiAP) | CC BY 4.0 | not added (nothing upcoming) |
| DEGP - Entreprises St-Roch / Membres SDC | Partial: Restauration + Divertissements et loisirs, SIT Québec (15 establishments in Saint-Roch). Registre des entreprises is CC BY-SA-NC (not reusable here); OpenStreetMap shops are ODbL (share-alike, not used) | CC BY 4.0 | 15 real commerces added, pre-filled |
| DEGP-Projets_ETE2026 | No | n/a | fictional new residents |
| DQC-isq hébergement | Partial: Hôtels, SIT Québec (offer only, no monthly demand) | CC BY 4.0 | file in `data/open/`, not shown |
| GI - ColonnesMorris / Équipements urbains | No (no urban furniture dataset for Québec city) | n/a | 6 fictional columns |
| GI - LU quartier St-Roch (éclairage) | No | n/a | not in demo |
| TMI - Stationnements hors rue municipaux | Partial: Lieux publics vque_14 type Stationnements (12 in Saint-Roch), no capacity | CC BY 4.0 | used |
| RCC-Saint-Roch (incidents) | No (Québec city publishes no incident data; only Montréal's « Actes criminels ») | n/a | not in demo |
| PAE geodatabase (parcs, lieux d'emploi, intensité, mobilité, socio-démo) | Partial: Lieux publics vque_14 parcs, Quartiers vque_9, Utilisation du sol vque_54 (not pulled), Canopée | CC BY 4.0 | parcs and outline used |
| Nombre_étudiants_Québec | No open file of the same scope found | n/a | fictional students |
| PlanActionSaint-Roch_Brochure | Public page: https://www.ville.quebec.qc.ca/apropos/planification-orientations/plan-saint-roch/index.aspx (Plan d'action 2026-2029) | web page | pitch only |
| Hackathon-Liste_JeuxDonnees, Analyse de la couverture médiatique (UQ), Présentation Quartier universitaire | n/a (documents) | n/a | pitch only |

Real rows in the app: 16 profiles `source: ouvert` (never claimed in the demo, `contactPublic: false`, no person, licence line in `origine`, needs are the generic ones of the establishment type) and 2 places `vque45-*`. The two tour stories give the same propositions with or without them (`src/engine/donnees-ouvertes.test.ts`).

## Not downloaded
- `vque_54` Utilisation du sol (https://www.donneesquebec.ca/recherche/dataset/vque_54): 167 MB GeoJSON, whole city, no datastore filter. The pack file named "LU quartier St-Roch" is a street-lighting inventory by its columns, so this is not its open twin. Pull only if a land-use layer is wanted, clipped locally.

## Comment Maillage utilise chaque fichier de la Ville

Les 19 fichiers fournis sont confidentiels : aucune valeur n'est dans le dépôt ni dans la démo. La démo utilise des lignes fictives qui reprennent leurs colonnes (`source: fictif`) et des données ouvertes (`source: ouvert`).

| Fichier fourni | Usage en production | Ce qui le remplace dans la démo |
|---|---|---|
| 1. Hackathon-Liste_JeuxDonnees_VF.xlsx | Catalogue des jeux de données, lu par l'équipe seulement. | Rien (document de référence, non utilisé par l'app). |
| Analyse de la couverture médiatique du quartier Saint-Roch_UQ.pdf | Cadrage du problème (perception du quartier, besoin de lien), lu par des humains. | Cité dans le pitch, pas dans l'app. |
| Hackathon 2026 - Présentation Quartier universitaire.pdf | Contexte du Quartier universitaire et de ses acteurs, lu par des humains. | Pitch seulement. |
| PlanActionSaint-Roch_Brochure-k.pdf | Cadrage : priorités du Plan d'action, pour justifier le type de projets proposés. | Pitch seulement. |
| CP-LSVC-Liste organismes reconnus LSVC-k.xlsx | Profils d'organismes (nom, domaine d'intervention, territoire, statut) réclamables par leur responsable. | Profils d'organismes fictifs (`origine` : Liste organismes reconnus LSVC). |
| CP-LSVC-Liste organismes-k.xlsx | Organismes soutenus (discipline, type de soutien, arrondissement) : thèmes et besoins des organismes culturels. | Profils fictifs (`origine` : Liste organismes LSVC). |
| DEGP - Entreprises St-Roch-Rev.xlsx | Commerces de la rue, à placer sur la carte et à inviter à réclamer leur profil. | Commerces fictifs (`origine` : Entreprises St-Roch), placés sur de vraies rues, plus 15 établissements réels du SIT Québec (`source: ouvert`). |
| DEGP - Membres - SDC Centre-Ville-Rev.xlsx | Commerçants membres de la SDC et leur activité commerciale : offres (salle, vitrine) et canal pour les joindre. | Commerces fictifs (`origine` : Membres SDC Centre-Ville). |
| CP-LSVC-Collection Art Public-k.xlsx | Artistes et œuvres du quartier : repérer les artistes à relier à des lieux, circuits d'art. | Artistes citoyens fictifs (`origine` : Collection Art Public). |
| Nombre_étudiants_Québec.xlsx | Ampleur de la clientèle étudiante, donc de bénévoles et de public pour les projets. | Étudiants fictifs bénévoles (`origine` : Nombre_étudiants_Québec). |
| DEGP-Projets_ETE2026_SaintRoch-Rev.xlsx | Semble lister des projets de logements : nouveaux résidents à accueillir et à relier aux voisins. | Nouveaux résidents fictifs (`origine` : Projets ÉTÉ 2026). |
| CP-LSVC-Événements à venir-k.xlsx | Éviter les conflits d'horaire, se greffer à un événement existant, trouver des promoteurs déjà actifs. | `evenements.json` : 18 événements fictifs (octobre à décembre 2026), certains promus par des profils. |
| CP-LSVC-Liste installations-k.xlsx | Espaces disponibles (salles, centres, équipements) à proposer comme lieu d'un projet. | Lieux ouverts de la Ville (Lieux publics, vque_14) dans `lieux.json`. |
| GI - ColonnesMorris_Equip_Urbains-k.zip | Points d'affichage pour annoncer un projet (`offres` : affichage, visibilité). | 6 colonnes Morris fictives dans `lieux.json` (`Données fictives`). |
| TMI - StationnementsHorsRueMunicipaux-k.geojson | Accès au projet : stationnements à proximité d'un lieu. | Stationnements ouverts (vque_14), sans nombre de cases. |
| DQC-isq_herbergement-DonneesHotelieres-k.xlsx | Visiteurs comme public potentiel (offre d'hébergement, demande mensuelle), pour les projets touristiques. | Hôtels du SIT Québec (offre seulement), fichier `data/open/`, non affiché dans l'app. |
| RCC-Saint-Roch-k.xlsx | Incidents signalés : repérer des endroits en soirée à animer pour renforcer le sentiment de sécurité. Production seulement, jamais affiché tel quel. | Rien dans la démo. |
| GI - LU quartier St-Roch 2026-08-06-Rev.xlsx | Inventaire d'éclairage public : repérer les rues peu éclairées à animer en soirée. Production seulement. | Rien dans la démo. |
| PAE-Hackathon_StRoch.gdb.zip | Parcs et espaces verts (lieux extérieurs), lieux d'emploi (public du midi), intensité urbaine, score de mobilité, portrait socio-démographique (cibler les quartiers). | Parcs et lieux publics ouverts (vque_14); contour du quartier ouvert (vque_9). |

Position des profils et des événements fictifs : points d'adresse de la Ville de Québec (Adresses de la Ville de Québec, https://www.donneesquebec.ca/recherche/dataset/adresses-de-la-ville-de-quebec, CC BY 4.0) à l'intérieur du contour de Saint-Roch, pour qu'ils tombent sur de vraies rues; seules les coordonnées sont conservées. Script : `scripts/build_data.py`; lignes réelles : `scripts/build_open_rows.py` (relance idempotente); validation : `scripts/check_data.py`.

## Fichiers servis par l'app (`public/data/`)

| Fichier | Source | Licence | Ligne d'attribution exacte |
|---|---|---|---|
| `profils.json` (16 fiches réelles, `source: ouvert`) | Ouvert : Restauration, Divertissements et loisirs, Organismes touristiques (SIT Québec, ministère du Tourisme), dans Saint-Roch; profils pré-remplis, jamais réclamés dans la démo | CC BY 4.0 | « Source : ministère du Tourisme du Québec (SIT Québec), Restauration, licence CC BY 4.0 » (champ `origine`, affiché sur le profil, la proposition, l'explorateur et l'écran Sources) |
| `lieux.json` (2 lieux de culte) | Ouvert : Lieux de culte (vque_45, Ville de Québec), polygones intersectant Saint-Roch, point représentatif | CC BY 4.0 | « Source : Ville de Québec, Lieux de culte, licence CC BY 4.0 » (champ `attribution`) |
| `profils.json` | Fictif : lignes inventées qui reprennent les colonnes des fichiers de la Ville (aucune valeur des fichiers fournis); positions sur des points d'adresse de la Ville de Québec (Adresses, vque, données ouvertes) | CC BY 4.0 pour les points d'adresse; profils fictifs sans licence tierce | « Données fictives » (positions : Source : Ville de Québec, données ouvertes, licence CC BY 4.0) |
| `lieux.json` (32 lieux ouverts) | Ouvert : Lieux publics (vque_14, Ville de Québec, via Données Québec) et Culture, arts et patrimoine (SIT Québec, ministère du Tourisme), filtrés dans Saint-Roch | CC BY 4.0 | Lieux publics : « Source : Ville de Québec, Lieux publics, licence CC BY 4.0 »; sites culturels : « Source : ministère du Tourisme du Québec (SIT Québec), licence CC BY 4.0 » (champ `attribution` de chaque lieu) |
| `lieux.json` (6 colonnes Morris) | Fictif | Sans objet | « Données fictives » |
| `evenements.json` | Fictif : 18 événements inventés (colonnes de Événements à venir), certains promus par des profils fictifs | Sans objet | `source: fictif` |
| `quartier.geojson` | Ouvert : Quartiers (vque_9, Ville de Québec, via Données Québec), polygone Saint-Roch | CC BY 4.0 | « Ville de Québec, Quartiers (CC BY 4.0) » (champ `properties.source`, tel que dans le fichier) |

Les lignes d'attribution sont notre formulation : le portail n'impose pas de phrase, seulement de créditer le producteur. Le polygone est publié tel quel; les lieux et points sont des extraits filtrés (« adapté de »).
