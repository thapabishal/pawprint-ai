// src/hooks/useCamera.ts
import { useState, useRef, useCallback } from 'react'

interface CameraState {
  photoDataUrl: string | null
  isCapturing: boolean
  error: string | null
  capturePhoto: () => void
  retakePhoto: () => void
}

export function useCamera(): CameraState {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const capturePhoto = useCallback(() => {
    // Use file input with capture attribute — most reliable on Android
    if (!fileInputRef.current) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.setAttribute('capture', 'environment') // rear camera
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) {
          setIsCapturing(false)
          return
        }
        const reader = new FileReader()
        reader.onload = (ev) => {
          setPhotoDataUrl(ev.target?.result as string)
          setIsCapturing(false)
        }
        reader.onerror = () => {
          // TODO: add proper logger here if needed
          setError('Failed to read image file')
          setIsCapturing(false)
        }
        reader.readAsDataURL(file)
      }
      fileInputRef.current = input
    }
    setIsCapturing(true)
    fileInputRef.current.click()
  }, [])

  const retakePhoto = useCallback(() => {
    // Clear photo only — preserve all tags and form state
    setPhotoDataUrl(null)
    setError(null)
    capturePhoto()
  }, [capturePhoto])

  return { photoDataUrl, isCapturing, error, capturePhoto, retakePhoto }
}
