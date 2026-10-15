import { useEffect, useRef } from 'react'
import { LngLatBounds, Map, Marker, Popup, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Role } from '../types'
import { svgPin } from './Icones'
import { T } from '../textes'

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
  /** Second line of the tap popup, e.g. the role. */
  detail?: string
}

interface Props {
  pins: Pin[]
  /** Pixels hidden by the bottom sheet, kept free when fitting the pins. */
  margeBas?: number
  /** Pixels hidden by the tour bar at the top. */
  margeHaut?: number
  /** Delay between two pin drops. */
  delaiPinMs?: number
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

export default function MapView({ pins, margeBas = 0, margeHaut = 70, delaiPinMs = 300 }: Props) {
  const conteneur = useRef<HTMLDivElement>(null)
  const carte = useRef<Map | null>(null)
  const marqueurs = useRef<Marker[]>([])

  useEffect(() => {
    if (!conteneur.current) return
    const map = new Map({ container: conteneur.current, style: STYLE_URL, center: CENTRE, zoom: 15, attributionControl: false })
    carte.current = map
    // The canvas is not keyboard- or screen-reader-friendly: the list below the map carries the same facts.
    const canvas = map.getCanvas()
    canvas.setAttribute('aria-hidden', 'true')
    canvas.tabIndex = -1
    return () => {
      map.remove()
      carte.current = null
    }
  }, [])

  useEffect(() => {
    const map = carte.current
    if (!map) return
    marqueurs.current.forEach((m) => m.remove())
    // MapLibre positions the marker element with a transform, so the drop animates an inner node.
    marqueurs.current = pins.map((p, i) => {
      const el = document.createElement('div')
      const interieur = document.createElement('div')
      interieur.className = 'pin-forme'
      interieur.style.animationDelay = `${i * delaiPinMs}ms`
      // Static markup from our own icon set, never user text.
      interieur.innerHTML = svgPin(p.type === 'lieu' ? 'lieu' : p.type === 'evenement' ? 'evenement' : (p.role ?? 'citoyen'), 40)
      el.appendChild(interieur)
      el.setAttribute('aria-hidden', 'true')
      if (p.type !== 'evenement') {
        const etiquette = document.createElement('div')
        etiquette.className = 'pin-etiquette'
        etiquette.style.animationDelay = `${i * delaiPinMs + 300}ms`
        etiquette.textContent = p.label.length > 20 ? `${p.label.slice(0, 19)}…` : p.label
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
      const popup = new Popup({ offset: 24, closeButton: false }).setDOMContent(contenu)
      return new Marker({ element: el }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(map)
    })

    // Thin dashed lines from the asker (first partner) to each other partner, and a faint 800 m circle
    // around the asker (about 10 minutes on foot), drawn once the pins have dropped.
    const partenaires = pins.filter((p) => p.type === 'partenaire')
    const demandeur = partenaires[0]
    const lignes = demandeur ? partenaires.slice(1).map((p) => [[demandeur.lng, demandeur.lat], [p.lng, p.lat]]) : []
    const cercle = demandeur ? cerclePoints(demandeur.lng, demandeur.lat, 800) : []
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
        map.addLayer({ id: 'lien', type: 'line', source: 'lien', paint: { 'line-color': '#1c2b25', 'line-width': 2, 'line-dasharray': [2, 2] } })
      }
    }
    let etiquetteCercle: Marker | null = null
    if (demandeur) {
      const el = document.createElement('div')
      el.className = 'cercle-etiquette'
      el.textContent = T.carte.minutesAPied
      el.setAttribute('aria-hidden', 'true')
      etiquetteCercle = new Marker({ element: el, anchor: 'bottom' }).setLngLat([demandeur.lng, demandeur.lat + 800 / 111320]).addTo(map)
    }
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
    minuteur = window.setTimeout(() => essayer(0), pins.length * delaiPinMs)
    // Fit on the partners and the place only: nearby events must not zoom the map out.
    const cadres = pins.filter((p) => p.type !== 'evenement')
    if (cadres.length > 0) {
      const bornes = new LngLatBounds()
      cadres.forEach((p) => bornes.extend([p.lng, p.lat]))
      map.fitBounds(bornes, { padding: { top: margeHaut, left: 50, right: 50, bottom: margeBas + 40 }, maxZoom: 18, duration: 700 })
    }
    return () => {
      window.clearTimeout(minuteur)
      etiquetteCercle?.remove()
    }
  }, [pins, margeBas, margeHaut, delaiPinMs])

  return (
    <>
      <div ref={conteneur} className="map" role="img" aria-label={T.carte.resume} />
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
