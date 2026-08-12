import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Complaint, PublicComplaint } from '@/lib/types'

const ACCRA_CENTER: [number, number] = [5.6037, -0.187]

const STATUS_COLOR: Record<string, string> = {
  submitted: '#eab308',
  assigned: '#3b82f6',
  in_progress: '#f97316',
  resolved: '#22c55e',
  closed: '#6b7280',
  rejected: '#ef4444',
}

function markerIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 2px rgba(0,0,0,0.5)"></div>`,
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
  return (
    <MapContainer center={ACCRA_CENTER} zoom={7} style={{ height: '400px', width: '100%' }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {pickable && onPick && <ClickCatcher onPick={onPick} />}
      {pickedLocation && <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={markerIcon('#3b82f6')} />}
      {complaints.map((c) => (
        <Marker
          key={c.id}
          position={[c.latitude, c.longitude]}
          icon={markerIcon(STATUS_COLOR[c.status] ?? '#6b7280')}
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
