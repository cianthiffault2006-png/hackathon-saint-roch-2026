import { useEffect, useRef } from 'react'
import { Map, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'

// The bundler moves the library, so its default worker path breaks: point to the emitted file.
setWorkerUrl(new URL(workerUrl, window.location.href).href)

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
const CENTER: [number, number] = [-71.2195, 46.8155]

export default function App() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return
    const map = new Map({
      container: container.current,
      style: STYLE_URL,
      center: CENTER,
      zoom: 15,
      attributionControl: false,
    })
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    return () => map.remove()
  }, [])

  return (
    <>
      <div ref={container} className="map" />
      <div className="badge">Prototype</div>
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
