// src/hooks/useGPS.ts
import { useState, useCallback, useEffect } from 'react'
import type { GeoPoint } from '@/types'

export type GPSStatus = 'idle' | 'requesting' | 'success' | 'failed' | 'unavailable'

interface GPSResult {
  location: GeoPoint | null
  accuracy: number | null
  status: GPSStatus
  error: string | null
  requestLocation: () => void
}

export function useGPS(): GPSResult {
  const [location, setLocation] = useState<GeoPoint | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [status, setStatus] = useState<GPSStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable')
      setError('GPS not available on this device')
      return
    }

    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setAccuracy(position.coords.accuracy)
        setStatus('success')
        setError(null)
      },
      (err) => {
        setStatus('failed')
        setError(err.message)
        // IMPORTANT: we do NOT throw — GPS failure is recoverable
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  // Auto-request location on mount
  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  return { location, accuracy, status, error, requestLocation }
}
