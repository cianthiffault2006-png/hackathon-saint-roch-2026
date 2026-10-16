import { useEffect, useMemo, useRef, useState } from 'react'
import { Map, Marker, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Evenement, Lieu, Profil } from '../types'
import { fr } from '../i18n/fr'
import { svgPin, PinForme, type NomIcone } from '../components/Icones'
import { CENTRE_SAINT_ROCH, distanceM, flou } from './geo'
import { t } from './textes'
import './Explorer.css'

setWorkerUrl(new URL(workerUrl, window.location.href).href)
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

type Genre = NomIcone
interface Entree {
  id: string
  genre: Genre
  nom: string
  detail: string
  lat: number
  lng: number
  recherche: string
  profil?: Profil
  evenement?: Evenement
}

interface Props {
  profils: Profil[]
  lieux: Lieu[]
  evenements: Evenement[]
  onRetour(): void
  onOuvrirProfil(id: string): void
  /** Guided tour: filters, search and list view come from the tour clock. */
  visite?: { actifs: Record<NomIcone, boolean>; requete: string; liste: boolean }
  /** Hidden behind a public profile: stays mounted so search, filters, list mode and map position survive « ← Retour ». */
  masque?: boolean
}

const sans = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const LIEU_TYPES: Record<Lieu['type'], string> = {
  parc: 'Parc', salle: 'Salle', lieu_culturel: 'Lieu culturel', place_publique: 'Place publique',
  stationnement: 'Stationnement', colonne_morris: 'Colonne Morris',
}
const themesTxt = (th: string[]) => th.map((x) => fr.besoin.themes[x as keyof typeof fr.besoin.themes] ?? x)

export function badgeVerif(p: Profil): string | null {
  // The badge comes with activation (« Réclamer ce profil »); a pre-filled profile shows « Profil pré-rempli » only.
  if (!p.reclame) return null
  return p.verifie === 'sdc' ? t.membreSdc : p.verifie === 'ville' ? t.reconnuVille : null
}

function construire(profils: Profil[], lieux: Lieu[], evenements: Evenement[]): Entree[] {
  const out: Entree[] = []
  for (const p of profils) {
    if (p.role === 'citoyen') {
      // Loi 25: seulement les citoyens qui ont réclamé leur profil, nom générique, position floutée.
      if (!p.reclame) continue
      const pos = flou(p.id, p.lat, p.lng)
      out.push({ id: p.id, genre: 'citoyen', nom: t.citoyen, detail: p.sousType, ...pos, profil: p, recherche: sans([p.sousType, ...themesTxt(p.themes)].join(' ')) })
    } else {
      out.push({ id: p.id, genre: p.role, nom: p.nom, detail: p.sousType, lat: p.lat, lng: p.lng, profil: p, recherche: sans([p.nom, p.sousType, ...themesTxt(p.themes)].join(' ')) })
    }
  }
  for (const l of lieux) {
    // Places of worship arrive typed « salle » (vque_45); their licence line says what they are.
    const type = l.attribution.includes('Lieux de culte') ? 'Lieu de culte' : LIEU_TYPES[l.type]
    out.push({ id: l.id, genre: 'lieu', nom: l.nom, detail: type, lat: l.lat, lng: l.lng, recherche: sans(`${l.nom} ${type}`) })
  }
  for (const e of evenements) out.push({ id: e.id, genre: 'evenement', nom: e.titre, detail: e.categorie, lat: e.lat, lng: e.lng, evenement: e, recherche: sans([e.titre, e.categorie, e.lieuNom, ...themesTxt(e.themes)].join(' ')) })
  return out
}

/** `court`: the list rows are narrow, so the pre-filled badge takes its short label there. */
function Etiquettes({ el, court }: { el: Entree; court?: boolean }) {
  const p = el.profil
  const verif = p ? badgeVerif(p) : null
  if (!verif && !(p && !p.reclame) && !el.evenement?.ouvertAuPublic) return null
  return (
    <div className="ex-badges">
      {verif && <span className="ex-badge ex-badge-ok">{verif}</span>}
      {p && !p.reclame && <span className="ex-badge">{court ? t.preRempliCourt : t.preRempli}</span>}
      {el.evenement?.ouvertAuPublic && <span className="ex-badge ex-badge-ok">{t.ouvertPublic}</span>}
    </div>
  )
}

const GENRES: Genre[] = ['commerce', 'organisme', 'citoyen', 'lieu', 'evenement']

export default function Explorer({ profils, lieux, evenements, onRetour, onOuvrirProfil, visite, masque = false }: Props) {
  const conteneur = useRef<HTMLDivElement>(null)
  const carte = useRef<Map | null>(null)
  const marqueurs = useRef<Marker[]>([])
  const [actifsMoi, setActifs] = useState<Record<Genre, boolean>>({ commerce: true, organisme: true, citoyen: false, lieu: true, evenement: true })
  const [requeteMoi, setRequete] = useState('')
  const [listeMoi, setListe] = useState(false)
  const [choisi, setChoisi] = useState<string | null>(null)
  // During the tour the screen shows what the tour sets; its own state stays untouched.
  const actifs = visite?.actifs ?? actifsMoi
  const requete = visite?.requete ?? requeteMoi
  const liste = visite?.liste ?? listeMoi
  // A key, so a new filter object with the same values does not rebuild the markers.
  const cleActifs = GENRES.filter((g) => actifs[g]).join('|')

  const tous = useMemo(() => construire(profils, lieux, evenements), [profils, lieux, evenements])
  const visibles = useMemo(() => {
    const q = sans(requete.trim())
    const on = cleActifs.split('|')
    return tous.filter((e) => on.includes(e.genre) && (!q || e.recherche.includes(q)))
  }, [tous, cleActifs, requete])
  const parDistance = useMemo(
    () => visibles.map((e) => ({ e, d: distanceM(CENTRE_SAINT_ROCH, e) })).sort((a, b) => a.d - b.d),
    [visibles],
  )
  const selection = visibles.find((e) => e.id === choisi) ?? null
  // Lignes de licence des données ouvertes affichées (portées par les données elles-mêmes).
  const credits = useMemo(() => Array.from(new Set([
    ...profils.filter((p) => p.source === 'ouvert').map((p) => p.origine),
    ...lieux.filter((l) => l.source === 'ouvert').map((l) => l.attribution),
  ])), [profils, lieux])
  // Sur la carte, une ligne courte (producteurs); les lignes complètes sont dans la liste et l'écran Sources.
  const producteurs = useMemo(() => Array.from(new Set(credits.map((c) => c.replace(/^Source : /, '').split(', ')[0]))), [credits])

  useEffect(() => {
    if (!conteneur.current) return
    const map = new Map({ container: conteneur.current, style: STYLE_URL, center: [CENTRE_SAINT_ROCH.lng, CENTRE_SAINT_ROCH.lat], zoom: 14.5, attributionControl: false })
    carte.current = map
    const canvas = map.getCanvas()
    canvas.setAttribute('aria-hidden', 'true')
    canvas.tabIndex = -1
    return () => { map.remove(); carte.current = null }
  }, [])

  useEffect(() => {
    const map = carte.current
    if (!map) return
    marqueurs.current.forEach((m) => m.remove())
    marqueurs.current = visibles.map((e) => {
      // Un vrai bouton: atteignable au clavier, nom lu par les lecteurs d'écran.
      const bouton = document.createElement('button')
      bouton.type = 'button'
      bouton.className = 'ex-pin'
      bouton.setAttribute('aria-label', `${e.nom}, ${e.detail}`)
      bouton.innerHTML = svgPin(e.genre, 44)
      bouton.addEventListener('click', () => setChoisi(e.id))
      return new Marker({ element: bouton }).setLngLat([e.lng, e.lat]).addTo(map)
    })
  }, [visibles])

  // La carte reste montée (cachée) pendant la vue liste et derrière un profil: position et zoom conservés.
  useEffect(() => { if (!liste && !masque) carte.current?.resize() }, [liste, masque])

  return (
    <div className="ex-racine" hidden={masque}>
      <div ref={conteneur} className="ex-carte" role="img" aria-label={t.carteAria} hidden={liste} />
      <header className="ex-haut">
        <div className="ex-ligne">
          <button type="button" className="ex-btn" onClick={onRetour}>← {t.retour}</button>
          <label className="ex-recherche">
            <span className="ex-sr">{t.rechercheEtiquette}</span>
            <input type="search" value={requete} placeholder={t.recherche} onChange={(ev) => setRequete(ev.target.value)} />
          </label>
          <button type="button" className="ex-btn" data-visite="ex-liste" aria-pressed={liste} onClick={() => setListe((v) => !v)}>
            {t.vueListe}
          </button>
        </div>
        <div className="ex-chips" role="group" aria-label={t.filtres}>
          {GENRES.map((g) => (
            <button key={g} type="button" data-genre={g} className={`ex-chip${actifs[g] ? ' ex-chip-on' : ''}`} aria-pressed={actifs[g]} onClick={() => setActifs({ ...actifs, [g]: !actifs[g] })}>
              <PinForme nom={g} taille={22} /> {t.chips[g]}
            </button>
          ))}
        </div>
        <p className="ex-sr" role="status">{t.nbResultats(visibles.length)}</p>
      </header>

      {/* Map view with nothing to show: the same message as the list, where the pin card would sit. */}
      {!liste && visibles.length === 0 && <p className="ex-fiche" role="status">{t.aucun}</p>}

      {liste && (
        <main className="ex-liste">
          {parDistance.length === 0 ? <p>{t.aucun}</p> : (
            <ul>
              {parDistance.map(({ e, d }) => (
                <li key={e.id} className="ex-item">
                  <PinForme nom={e.genre} taille={32} />
                  <div className="ex-item-texte">
                    <strong>{e.nom}</strong>
                    <span>{e.detail} · {t.distance(d)}</span>
                    <Etiquettes el={e} court />
                  </div>
                  {e.profil && (
                    <button type="button" className="ex-btn ex-btn-p" data-visite={`profil-${e.id}`} onClick={() => onOuvrirProfil(e.id)}>
                      {t.voirProfil}<span className="ex-sr"> : {e.nom}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="ex-note ex-credits">{credits.join(' · ')}</p>
        </main>
      )}

      {!liste && selection && (
        <section className="ex-fiche" aria-label={selection.nom}>
          <button type="button" className="ex-fermer" aria-label={t.fermer} onClick={() => setChoisi(null)}>×</button>
          <strong className="ex-fiche-nom">{selection.nom}</strong>
          <span>{selection.detail}</span>
          {selection.genre === 'citoyen' && <span className="ex-note">{t.citoyenNote}</span>}
          <Etiquettes el={selection} />
          {selection.profil && <button type="button" className="ex-btn ex-btn-p" onClick={() => onOuvrirProfil(selection.id)}>{t.voirProfil}</button>}
        </section>
      )}

      {!liste && (
        <div className="ex-attribution">
          <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> © <a href="https://openmaptiles.org" target="_blank" rel="noreferrer">OpenMapTiles</a>{' · '}
          données © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">contributeurs OpenStreetMap</a>
          {producteurs.length > 0 && <span> · données ouvertes : {producteurs.join(', ')}, licence CC BY 4.0</span>}
        </div>
      )}
    </div>
  )
}
