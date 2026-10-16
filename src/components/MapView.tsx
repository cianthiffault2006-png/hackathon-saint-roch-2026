import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { fr } from '../i18n/fr'
import { LngLatBounds, Map, Marker, Popup, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Role } from '../types'
import { svgPin } from './Icones'

// The bundler moves the library, so its default worker path breaks: point to the emitted file.
setWorkerUrl(new URL(workerUrl, window.location.href).href)

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
const CENTRE: [number, number] = [-71.2195, 46.8155]

export interface Pin {
  id: string
  lat: number
  lng: number
  type: 'partenaire' | 'lieu' | 'evenement'
  label: string
  /** Role of a partner pin: sets its colour and its letters. */
  role?: Role
  /** A public event: its popup offers « Je participe » without approval. */
  evenement?: { id: string; ouvert: boolean; inscrits: number; inscrit: boolean }
  /** Second line of the tap popup, e.g. the role. */
  detail?: string
}

interface Props {
  pins: Pin[]
  /** Pixels hidden by the bottom sheet, kept free when fitting the pins. */
  margeBas?: number
  /** Pixels hidden by the tour bar at the top. */
  margeHaut?: number
  /** Side padding for the fit (px); defaults to 72 on phones, 50 on desktop. */
  margeCote?: number
  /** Delay between two pin drops. */
  delaiPinMs?: number
  /**
   * Whether the pins drop when they are placed. By default they drop once per set of pins:
   * coming back to the same proposal (from the invitation, or after a status change) does not replay it.
   */
  animerPins?: boolean
  /** Guided tour: shows or hides the 5-minute ring and the links (by default they show after the drop). */
  anneauVisible?: boolean
  onParticiper?: (evenementId: string) => void
}

function cerclePoints(lng: number, lat: number, rayonM: number): number[][] {
  const pts: number[][] = []
  const dLat = rayonM / 111320
  const dLng = rayonM / (111320 * Math.cos((lat * Math.PI) / 180))
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * 2 * Math.PI
    pts.push([lng + dLng * Math.sin(a), lat + dLat * Math.cos(a)])
  }
  return pts
}

/** The last set of pins that dropped, kept across remounts (ids joined). */
let dernierLot = ''

interface Boite { x: number; y: number; w: number; h: number }
const chevauche = (a: Boite, b: Boite) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
const PLACES = ['bas', 'droite', 'gauche', 'haut'] as const
type Place = (typeof PLACES)[number]
const DEMI_PIN = 20 // .pin-forme is 40 px, centred on the point
const ECART = 22 // gap between the point and the label: matches the data-place offsets in styles.css

/** A label sits under its pin; when that lands on another pin or label (or off the map), it moves right, left, then above. */
function placerEtiquettes(map: Map, marqueurs: Marker[]) {
  const { clientWidth, clientHeight } = map.getContainer()
  const carte: Boite = { x: 0, y: 0, w: clientWidth, h: clientHeight }
  const pts = marqueurs.map((m) => map.project(m.getLngLat()))
  const pins = pts.map((p): Boite => ({ x: p.x - DEMI_PIN, y: p.y - DEMI_PIN, w: 2 * DEMI_PIN, h: 2 * DEMI_PIN }))
  // The licence line and the legend float over the map: a label must not hide under them either.
  const cont = map.getContainer().getBoundingClientRect()
  const poses: Boite[] = Array.from(document.querySelectorAll('.attribution, .legende'))
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0)
    .map((r): Boite => ({ x: r.left - cont.left, y: r.top - cont.top, w: r.width, h: r.height }))
  // Top pins first: their labels keep the default spot, lower ones move around them.
  const ordre = marqueurs.map((_, i) => i).sort((a, b) => pts[a].y - pts[b].y)
  for (const i of ordre) {
    const et = marqueurs[i].getElement().querySelector<HTMLElement>('.pin-etiquette')
    if (!et) continue
    const w = et.offsetWidth
    const h = et.offsetHeight
    const p = pts[i]
    const candidats: Record<Place, Boite> = {
      bas: { x: p.x - w / 2, y: p.y + ECART, w, h },
      droite: { x: p.x + ECART, y: p.y - h / 2, w, h },
      gauche: { x: p.x - ECART - w, y: p.y - h / 2, w, h },
      haut: { x: p.x - w / 2, y: p.y - ECART - h, w, h },
    }
    const obstacles = [...pins.filter((_, j) => j !== i), ...poses]
    let choix: Place = 'bas'
    let gene = Infinity
    for (const place of PLACES) {
      const b = candidats[place]
      const g = obstacles.reduce((s, o) => s + chevauche(b, o), 0) + (w * h - chevauche(b, carte))
      if (g < gene) { gene = g; choix = place }
      if (g === 0) break
    }
    et.dataset.place = choix
    poses.push(candidats[choix])
  }
}

export default function MapView({ pins, margeBas = 0, margeHaut = 70, margeCote, delaiPinMs = 300, animerPins, anneauVisible, onParticiper }: Props) {
  const conteneur = useRef<HTMLDivElement>(null)
  const carte = useRef<Map | null>(null)
  const marqueurs = useRef<Marker[]>([])
  const etiquetteAnneau = useRef<Marker | null>(null)
  const cadre = useRef('')
  const participer = useRef(onParticiper)
  participer.current = onParticiper
  const listePins = useRef(pins)
  const animer = useRef(animerPins)
  const anneau = useRef(anneauVisible)
  // Latest props for the effects below, which must not re-run (and rebuild markers) when only these change.
  useLayoutEffect(() => {
    listePins.current = pins
    animer.current = animerPins
    anneau.current = anneauVisible
  })
  // Markers are rebuilt only when what they show changes, never on a parent re-render: a new
  // array with the same pins used to remove and re-add every marker, replaying the drop each time.
  const signature = pins.map((p) => `${p.id}@${p.lat},${p.lng}:${p.evenement ? Number(p.evenement.inscrit) : ''}`).join('|')
  const lot = pins.map((p) => p.id).join('|')

  // The ring and the links follow anneauVisible when it is given, else they show.
  const appliquerAnneau = useCallback(() => {
    const map = carte.current
    if (!map) return
    const visible = anneau.current !== false
    for (const id of ['cercle-bord', 'lien']) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
    }
    const el = etiquetteAnneau.current?.getElement()
    if (el) el.style.visibility = visible && map.getLayer('cercle-bord') ? 'visible' : 'hidden'
  }, [])

  useEffect(() => {
    if (!conteneur.current) return
    const map = new Map({ container: conteneur.current, style: STYLE_URL, center: CENTRE, zoom: 15, attributionControl: false })
    carte.current = map
    // A new map has not been fitted yet.
    cadre.current = ''
    // The canvas is not keyboard- or screen-reader-friendly: the list below the map carries the same facts.
    const canvas = map.getCanvas()
    canvas.setAttribute('aria-hidden', 'true')
    canvas.tabIndex = -1
    // Labels are placed again after every fit, zoom or pan (moveend covers all three).
    map.on('moveend', () => placerEtiquettes(map, marqueurs.current))
    return () => {
      map.remove()
      carte.current = null
    }
  }, [])

  useEffect(() => {
    const map = carte.current
    if (!map) return
    const pins = listePins.current
    const chute = animer.current ?? lot !== dernierLot
    marqueurs.current.forEach((m) => m.remove())
    // MapLibre positions the marker element with a transform, so the drop animates an inner node.
    marqueurs.current = pins.map((p, i) => {
      const el = document.createElement('div')
      // Partner and place pins always draw above event pins (an event at the café's address hid its pin).
      el.style.zIndex = p.type === 'evenement' ? '1' : '2'
      const interieur = document.createElement('div')
      interieur.className = 'pin-forme'
      if (chute) interieur.style.animationDelay = `${i * delaiPinMs}ms`
      else interieur.style.animation = 'none'
      // Static markup from our own icon set, never user text.
      interieur.innerHTML = svgPin(p.type === 'lieu' ? 'lieu' : p.type === 'evenement' ? 'evenement' : (p.role ?? 'citoyen'), 40)
      el.appendChild(interieur)
      el.setAttribute('aria-hidden', 'true')
      if (p.type !== 'evenement') {
        const etiquette = document.createElement('div')
        etiquette.className = 'pin-etiquette'
        if (chute) etiquette.style.animationDelay = `${i * delaiPinMs + 300}ms`
        else etiquette.style.animation = 'none'
        etiquette.textContent = p.label // long names wrap to two lines (styles.css), nothing is cut
        el.appendChild(etiquette)
      }
      // Tap popup with the full name and the role.
      const contenu = document.createElement('div')
      const nom = document.createElement('strong')
      nom.textContent = p.label
      contenu.appendChild(nom)
      if (p.detail) {
        const role = document.createElement('div')
        role.textContent = p.detail
        contenu.appendChild(role)
      }
      if (p.evenement?.ouvert) {
        const ligne = document.createElement('div')
        ligne.textContent = fr.evenement.nbPersonnes(p.evenement.inscrits + (p.evenement.inscrit ? 1 : 0))
        contenu.appendChild(ligne)
        const bouton = document.createElement('button')
        bouton.type = 'button'
        bouton.className = 'popup-participe'
        bouton.textContent = p.evenement.inscrit ? fr.evenement.inscritMoi : fr.evenement.participe
        const idEvt = p.evenement.id
        bouton.addEventListener('click', () => participer.current?.(idEvt))
        contenu.appendChild(bouton)
      }
      const popup = new Popup({ offset: 24, closeButton: false }).setDOMContent(contenu)
      return new Marker({ element: el }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(map)
    })
    placerEtiquettes(map, marqueurs.current)

    // Thin dashed lines from the asker (first partner) to each other partner, and a 400 m ring
    // around the asker (about 5 minutes on foot), drawn once the pins have dropped.
    const partenaires = pins.filter((p) => p.type === 'partenaire')
    const demandeur = partenaires[0]
    const lignes = demandeur ? partenaires.slice(1).map((p) => [[demandeur.lng, demandeur.lat], [p.lng, p.lat]]) : []
    const cercle = demandeur ? cerclePoints(demandeur.lng, demandeur.lat, 400) : []
    const tracer = () => {
      const geoLiens = { type: 'Feature' as const, properties: {}, geometry: { type: 'MultiLineString' as const, coordinates: lignes } }
      const geoCercle = { type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon' as const, coordinates: cercle.length ? [cercle] : [] } }
      // Idempotent on purpose: a failed attempt (style not ready) is simply retried.
      const sCercle = map.getSource('cercle') as GeoJSONSource | undefined
      if (sCercle) sCercle.setData(geoCercle)
      else map.addSource('cercle', { type: 'geojson', data: geoCercle })
      const sLien = map.getSource('lien') as GeoJSONSource | undefined
      if (sLien) sLien.setData(geoLiens)
      else map.addSource('lien', { type: 'geojson', data: geoLiens })
      if (!map.getLayer('cercle-bord')) {
        map.addLayer({ id: 'cercle-bord', type: 'line', source: 'cercle', paint: { 'line-color': '#1f5f4a', 'line-opacity': 0.45, 'line-width': 1.5 } })
      }
      if (!map.getLayer('lien')) {
        map.addLayer({ id: 'lien', type: 'line', source: 'lien', layout: { 'line-cap': 'round' }, paint: { 'line-color': '#1f5f4a', 'line-width': 3, 'line-dasharray': [1.5, 2.5] } })
      }
      appliquerAnneau()
    }
    let etiquetteCercle: Marker | null = null
    if (demandeur) {
      const el = document.createElement('div')
      el.className = 'cercle-etiquette'
      el.textContent = fr.carte.cinqMinutes
      el.setAttribute('aria-hidden', 'true')
      // Hidden until the ring is drawn.
      el.style.visibility = 'hidden'
      etiquetteCercle = new Marker({ element: el, anchor: 'bottom' }).setLngLat([demandeur.lng, demandeur.lat + 400 / 111320]).addTo(map)
    }
    etiquetteAnneau.current = etiquetteCercle
    // The style may still be loading when the pins drop: retry for a few seconds.
    let minuteur = 0
    // isStyleLoaded() stays false while tiles download, so try to add the layers and retry on failure.
    const essayer = (n: number) => {
      try {
        tracer()
      } catch {
        if (n < 160) minuteur = window.setTimeout(() => essayer(n + 1), 250)
      }
    }
    // Remember this set once its drop has played, so coming back to it does not replay it. Recorded
    // after the drop rather than now, so React's double effect run in development cannot skip it.
    const memoire = window.setTimeout(() => {
      dernierLot = lot
    }, chute ? pins.length * delaiPinMs + 600 : 0)
    // When the tour drives the ring, or nothing drops, draw it now (hidden or shown by appliquerAnneau).
    minuteur = window.setTimeout(() => essayer(0), anneau.current !== undefined || !chute ? 0 : pins.length * delaiPinMs)
    // Fit on the partners and the place only: nearby events must not zoom the map out.
    const cadres = pins.filter((p) => p.type !== 'evenement')
    // Once per set of pins on this map: a new event status does not move the camera.
    if (cadres.length > 0 && cadre.current !== lot) {
      cadre.current = lot
      const bornes = new LngLatBounds()
      cadres.forEach((p) => bornes.extend([p.lng, p.lat]))
      // Phones: the licence line sits bottom-left above the sheet, so keep pins and their labels (about 50 px below the centre) clear of it.
      const telephone = window.innerWidth < 900
      const licence = telephone ? document.querySelector('.screen-carte .attribution')?.getBoundingClientRect().height ?? 0 : 0
      // Short canvases (landscape phones, 853x480): MapLibre refuses a fit whose padding exceeds the canvas and the map
      // stays at city scale. Keep at least 140 px of map on each axis, scaling the paddings down together.
      const { clientWidth: largeur, clientHeight: hauteur } = map.getContainer()
      const haut = margeHaut
      const bas = margeBas + 40 + (telephone ? licence + 50 : 0)
      const kV = Math.min(1, Math.max(0, hauteur - 140) / Math.max(1, haut + bas))
      const cote = Math.min(margeCote ?? (telephone ? 72 : 50), Math.max(0, largeur - 140) / 2)
      map.fitBounds(bornes, { padding: { top: Math.round(haut * kV), left: cote, right: cote, bottom: Math.round(bas * kV) }, maxZoom: 17, duration: 700 })
    }
    return () => {
      window.clearTimeout(minuteur)
      window.clearTimeout(memoire)
      etiquetteCercle?.remove()
      etiquetteAnneau.current = null
    }
  }, [signature, lot, margeBas, margeHaut, margeCote, delaiPinMs, appliquerAnneau])

  useEffect(() => {
    appliquerAnneau()
  }, [anneauVisible, appliquerAnneau])

  return (
    <>
      <div ref={conteneur} className="map" role="img" aria-label={fr.carte.resume} />
      <div className="attribution">
        <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a>{' '}
        © <a href="https://openmaptiles.org" target="_blank" rel="noreferrer">OpenMapTiles</a>
        {' · '}données ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          contributeurs OpenStreetMap
        </a>
      </div>
    </>
  )
}
