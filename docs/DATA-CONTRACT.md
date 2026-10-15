# DATA CONTRACT (frozen at gate 1, 10:50; shapes in src/types.ts)

| File (public/data/) | Shape | Owner | Content |
|---|---|---|---|
| profils.json | Profil[] | data | ~45 fictional profiles with the columns of the City files: organisms (Liste organismes reconnus LSVC, Liste organismes), merchants (Entreprises St-Roch, Membres SDC), citizens (artists after Collection Art Public, students after Nombre_étudiants, new residents after Projets été 2026). Includes the 3 story profiles with ids `story-cafe`, `story-artiste`, `story-organisme`. |
| lieux.json | Lieu[] | data | Real open data: Lieux publics (vque_14), parks, SIT culture, in Saint-Roch; plus fictional Morris columns (type colonne_morris, source fictif). |
| evenements.json | Evenement[] | data | ~15 fictional events with the columns of Événements à venir, Oct to Dec 2026, in Saint-Roch. |
| quartier.geojson | GeoJSON Feature (Polygon) | data | Saint-Roch outline, open data. |

Engine (src/engine/, owner: engine helper): `lireBesoin` (French keyword dictionary to tags, slots, themes) and `proposer` (complementarity, reverse complementarity, distance under a 10-minute walk, shared slot, shared theme, 3-partner assembly, a Lieu when no partner offers space, nearby events), both pure functions with tests.

Rules: fictional names only, never a name or value from the provided pack; coordinates inside the Saint-Roch outline; every French string is Québec French; `source` and `attribution` always filled.
