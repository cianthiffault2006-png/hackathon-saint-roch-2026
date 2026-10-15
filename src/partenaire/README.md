Mount `<InvitationPartenaire proposition partenaire demandeur onAccepter onDecliner />` (default export of `src/partenaire/InvitationPartenaire.tsx`) as a full-screen view; it imports its own CSS and keeps the accepted state itself.
Mount `<TableauSdc profils={profils} propositions={propositions} />` (default export of `src/sdc/TableauSdc.tsx`) as a page; `propositions` is optional and unused for the fictional pilot numbers.
Both are self-contained (no dependency, classes prefixed `p2-`), French text inline, and show « Démo simulée » or « Données fictives de pilote ».
