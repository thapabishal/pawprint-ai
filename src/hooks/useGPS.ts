import { useEffect, useCallback } from 'react';
import { useCatchStore } from '../stores/catchStore';

export const useGPS = () => {
  const setLocation = useCatchStore((state) => state.setLocation);
  const setGpsStatus = useCatchStore((state) => state.setGpsStatus);
  const setGpsError = useCatchStore((state) => state.setGpsError);
  const gpsStatus = useCatchStore((state) => state.gpsStatus);
  const gpsError = useCatchStore((state) => state.gpsError);
  const location = useCatchStore((state) => state.draft.location);
  const accuracy = useCatchStore((state) => state.draft.location_accuracy);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    setGpsStatus('requesting');
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(
          {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          position.coords.accuracy
        );
        setGpsStatus('success');
      },
      (error) => {
        setGpsStatus('failed');
        setGpsError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [setLocation, setGpsStatus, setGpsError]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    location,
    accuracy,
    status: gpsStatus,
    error: gpsError,
    requestLocation,
  };
};
