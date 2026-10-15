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
| `sit_quebec_culture_saint_roch.geojson` | Culture, arts et patrimoine, SIT Québec | https://www.donneesquebec.ca/recherche/dataset/sit-quebec-culture-art-et-patrimoine | Ministère du Tourisme | CC BY 4.0 | 2026-10-15 | 24 rows within about 650 m of the polygon. Contact columns dropped. |

Coordinates are WGS84 lon/lat (checked on the Saint-Roch polygon). Scripts: filtering was done with ad hoc Python (shapely); the pack inventory script is `scripts/schema.py`.

## Not downloaded
- `vque_54` Utilisation du sol (https://www.donneesquebec.ca/recherche/dataset/vque_54): 167 MB GeoJSON, whole city, no datastore filter. The pack file named "LU quartier St-Roch" is a street-lighting inventory by its columns, so this is not its open twin. Pull only if a land-use layer is wanted, clipped locally.
