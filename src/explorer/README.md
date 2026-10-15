# Explorateur, profil public, « Plus d'options »

Chaînes dans `src/explorer/textes.ts` (à déplacer dans `fr.ts`). Styles `ex-`, `pp-`, `po-` en CSS co-localisé.

```tsx
import Explorer from './explorer/Explorer'
import PlusOptions from './explorer/PlusOptions'
import ProfilPublic from './profil/ProfilPublic'

<Explorer profils={d.profils} lieux={d.lieux} evenements={d.evenements}
  onRetour={() => setEcran('accueil')} onOuvrirProfil={(id) => setProfilId(id)} />

<ProfilPublic profil={p} profils={d.profils} evenements={d.evenements}
  onRetour={...} onProposer={(profilId) => ...} />

<PlusOptions besoin={besoin} profils={d.profils} lieux={d.lieux} evenements={d.evenements}
  onChoisir={(prop) => ...} />
```

- `Explorer` est plein écran (`position: fixed`), sa propre carte MapLibre. Citoyens masqués par défaut; quand activés: seulement les profils réclamés, nommés « Citoyen·ne », position floutée de 30 à 100 m (stable par id).
- `ProfilPublic` : coordonnées fictives (`contact@exemple.ca`) seulement si `contactPublic`. Les profils semblables excluent les profils non réclamés.
- `PlusOptions` : l'engin ne rend que 3 projets; on le relance en retirant les partenaires déjà proposés (jusqu'à 8 tours) puis on filtre par minutes à pied (80 m/min) du plus éloigné partenaire. Origine: `besoin.lat/lng`, sinon le profil `auteurId`, sinon le centre de Saint-Roch. Sous la liste: partenaires compatibles un à un.
