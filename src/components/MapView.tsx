import { useEffect, useRef } from 'react'
import { LngLatBounds, Map, Marker, Popup, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Role } from '../types'

export const SIGLE_ROLE: Record<Role, string> = { commerce: 'Co', organisme: 'O', citoyen: 'Ci' }

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

export default function MapView({ pins, margeBas = 0, margeHaut = 70, delaiPinMs = 300 }: Props) {
  const conteneur = useRef<HTMLDivElement>(null)
  const carte = useRef<Map | null>(null)
  const marqueurs = useRef<Marker[]>([])

  useEffect(() => {
    if (!conteneur.current) return
    const map = new Map({ container: conteneur.current, style: STYLE_URL, center: CENTRE, zoom: 15, attributionControl: false })
    carte.current = map
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
      interieur.className = p.role ? `pin pin-${p.type} pin-${p.role}` : `pin pin-${p.type}`
      interieur.style.animationDelay = `${i * delaiPinMs}ms`
      interieur.setAttribute('role', 'img')
      interieur.setAttribute('aria-label', p.label)
      interieur.title = p.label
      interieur.textContent = p.type === 'lieu' ? 'L' : p.type === 'evenement' ? '★' : p.role ? SIGLE_ROLE[p.role] : p.label.charAt(0)
      el.appendChild(interieur)
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

    // Dashed line linking the partners, drawn once their pins have dropped.
    const liens = pins.filter((p) => p.type === 'partenaire').map((p) => [p.lng, p.lat])
    if (liens.length === 3) liens.push(liens[0])
    const tracer = () => {
      const geo = {
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'LineString' as const, coordinates: liens.length >= 2 ? liens : [] },
      }
      const source = map.getSource('lien') as GeoJSONSource | undefined
      if (source) {
        source.setData(geo)
        return
      }
      map.addSource('lien', { type: 'geojson', data: geo })
      map.addLayer({
        id: 'lien', type: 'line', source: 'lien',
        paint: { 'line-color': '#e8833a', 'line-width': 3, 'line-dasharray': [2, 2] },
      })
    }
    // The style may still be loading when the pins drop: retry for a few seconds.
    let minuteur = 0
    const essayer = (n: number) => {
      if (map.isStyleLoaded()) {
        tracer()
      } else if (n < 40) {
        minuteur = window.setTimeout(() => essayer(n + 1), 250)
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
    return () => window.clearTimeout(minuteur)
  }, [pins, margeBas, margeHaut, delaiPinMs])

  return (
    <>
      <div ref={conteneur} className="map" />
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
