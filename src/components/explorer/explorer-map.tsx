"use client";

import { useState, useEffect, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  MapControl,
  ControlPosition,
  useMap,
} from "@vis.gl/react-google-maps";
import { MapPin } from "./map-pin";
import { LocateFixed } from "lucide-react";

interface Place {
  id: number;
  title: string;
  latitude: number;
  longitude: number;
  placeCategories: {
    categoryId: number;
    category: { color: string };
  }[];
}

interface ExplorerMapProps {
  places: Place[];
  selectedPlaceId: number | null;
  onPlaceSelect: (id: number) => void;
}

function useUserLocation() {
  const [position, setPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
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

function UserLocationDot({ heading }: { heading: number | null }) {
  return (
    <div className="relative flex items-center justify-center">
      {heading != null && (
        <div
          className="absolute -top-5 h-8 w-8 opacity-25"
          style={{
            transform: `rotate(${heading}deg)`,
            background:
              "conic-gradient(from -30deg, #4285F4 0deg, transparent 60deg)",
            borderRadius: "50%",
          }}
        />
      )}
      {/* Pulse ring */}
      <div className="absolute h-8 w-8 animate-ping rounded-full bg-blue-400 opacity-20" />
      {/* Blue dot */}
      <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-md" />
    </div>
  );
}

function MyLocationButton({
  userPos,
  error,
}: {
  userPos: { lat: number; lng: number } | null;
  error: string | null;
}) {
  const map = useMap();
  const [showError, setShowError] = useState(false);

  const handleClick = useCallback(() => {
    if (userPos && map) {
      map.panTo(userPos);
      map.setZoom(15);
    } else if (error) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  }, [userPos, error, map]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-md border transition-colors hover:bg-accent"
        title={error || "Center on my location"}
      >
        <LocateFixed
          className={`h-5 w-5 ${userPos ? "text-blue-500" : "text-muted-foreground"}`}
        />
      </button>
      {showError && error && (
        <div className="absolute bottom-12 right-0 whitespace-nowrap rounded-md bg-background px-3 py-1.5 text-xs shadow-md border">
          {error}
        </div>
      )}
    </div>
  );
}

export function ExplorerMap({
  places,
  selectedPlaceId,
  onPlaceSelect,
}: ExplorerMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { position: userPos, heading, error } = useUserLocation();

  if (!apiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-lg font-medium">Map Preview</p>
          <p className="text-sm text-muted-foreground">
            Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {places.length} places loaded
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        className="h-full w-full"
        defaultCenter={{ lat: 35.6762, lng: 139.6503 }}
        defaultZoom={12}
        mapId="places-explorer"
        gestureHandling="greedy"
        mapTypeControl={false}
      >
        {/* User location */}
        {userPos && (
          <AdvancedMarker position={userPos} zIndex={1000} title="You are here">
            <UserLocationDot heading={heading} />
          </AdvancedMarker>
        )}

        {places.map((place) => {
          if (!place.latitude || !place.longitude) return null;
          const primaryColor =
            place.placeCategories[0]?.category?.color || "#6b7280";
          const isSelected = place.id === selectedPlaceId;

          return (
            <AdvancedMarker
              key={place.id}
              position={{
                lat: place.latitude,
                lng: place.longitude,
              }}
              onClick={() => onPlaceSelect(place.id)}
              title={place.title}
            >
              <MapPin color={primaryColor} selected={isSelected} />
            </AdvancedMarker>
          );
        })}

        <MapControl position={ControlPosition.RIGHT_BOTTOM}>
          <div className="mr-2.5 mb-6">
            <MyLocationButton userPos={userPos} error={error} />
          </div>
        </MapControl>
      </Map>
    </APIProvider>
  );
}
