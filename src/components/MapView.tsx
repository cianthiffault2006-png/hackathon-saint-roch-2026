import { useEffect, useRef } from 'react'
import { LngLatBounds, Map, Marker, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'

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
}

interface Props {
  pins: Pin[]
  /** Pixels hidden by the bottom sheet, kept free when fitting the pins. */
  margeBas?: number
}

export default function MapView({ pins, margeBas = 0 }: Props) {
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
    marqueurs.current = pins.map((p) => {
      const el = document.createElement('div')
      el.className = `pin pin-${p.type}`
      el.setAttribute('role', 'img')
      el.setAttribute('aria-label', p.label)
      el.title = p.label
      el.textContent = p.type === 'lieu' ? 'L' : p.type === 'evenement' ? '★' : p.label.charAt(0)
      return new Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map)
    })
    if (pins.length > 0) {
      const bornes = new LngLatBounds()
      pins.forEach((p) => bornes.extend([p.lng, p.lat]))
      map.fitBounds(bornes, { padding: { top: 70, left: 50, right: 50, bottom: margeBas + 40 }, maxZoom: 16, duration: 700 })
    }
  }, [pins, margeBas])

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
