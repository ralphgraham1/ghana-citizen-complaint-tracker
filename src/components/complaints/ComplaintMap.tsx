import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Complaint, PublicComplaint } from '@/lib/types'

const ACCRA_CENTER: [number, number] = [5.6037, -0.187]

const STATUS_COLOR: Record<string, string> = {
  submitted: '#e8a33d',
  assigned: '#4a90d9',
  in_progress: '#e08a3d',
  resolved: '#5fbf6f',
  closed: '#9a938a',
  rejected: '#e8635a',
}

const PICK_COLOR = '#e8a33d'

const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const LIGHT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

function useIsDarkScheme() {
  const [isDark, setIsDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mql.addEventListener('change', listener)
    return () => mql.removeEventListener('change', listener)
  }, [])

  return isDark
}

function markerIcon(color: string, borderColor: string) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:14px;height:14px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.35;animation:complaint-marker-pulse 2s ease-out infinite;"></div>
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};border:2px solid ${borderColor};box-shadow:0 0 8px ${color}88;animation:complaint-marker-in 0.3s ease-out;"></div>
    </div>`,
    iconSize: [14, 14],
  })
}

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

interface ComplaintMapProps {
  complaints?: (Complaint | PublicComplaint)[]
  pickable?: boolean
  pickedLocation?: { lat: number; lng: number } | null
  onPick?: (lat: number, lng: number) => void
  onMarkerClick?: (complaintId: string) => void
}

export function ComplaintMap({ complaints = [], pickable = false, pickedLocation, onPick, onMarkerClick }: ComplaintMapProps) {
  const isDark = useIsDarkScheme()
  const borderColor = isDark ? '#151312' : '#ffffff'

  return (
    <MapContainer center={ACCRA_CENTER} zoom={7} style={{ height: '400px', width: '100%' }}>
      <TileLayer attribution={TILE_ATTRIBUTION} url={isDark ? DARK_TILE_URL : LIGHT_TILE_URL} />
      {pickable && onPick && <ClickCatcher onPick={onPick} />}
      {pickedLocation && <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={markerIcon(PICK_COLOR, borderColor)} />}
      {complaints.map((c) => (
        <Marker
          key={c.id}
          position={[c.latitude, c.longitude]}
          icon={markerIcon(STATUS_COLOR[c.status] ?? '#9a938a', borderColor)}
          eventHandlers={onMarkerClick ? { click: () => onMarkerClick(c.id) } : undefined}
        >
          <Popup>
            <strong>{c.title}</strong>
            <br />
            {c.status.replace('_', ' ')}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
