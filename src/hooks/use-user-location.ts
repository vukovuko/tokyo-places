"use client";

import { useState, useEffect } from "react";

interface UserLocation {
  lat: number;
  lng: number;
}

export function useUserLocation() {
  const [position, setPosition] = useState<UserLocation | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (pos.coords.heading != null && !Number.isNaN(pos.coords.heading)) {
          setHeading(pos.coords.heading);
        }
        setError(null);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location access denied");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location unavailable");
            break;
          case err.TIMEOUT:
            setError("Location request timed out");
            break;
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { position, heading, error };
}
