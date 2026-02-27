"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  MapControl,
  ControlPosition,
  useMap,
} from "@vis.gl/react-google-maps";
import Supercluster from "supercluster";
import { MapPin } from "./map-pin";
import { WeatherWidget } from "./weather-widget";
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
  userPosition: { lat: number; lng: number } | null;
  userHeading: number | null;
  locationError: string | null;
  panTarget: { lat: number; lng: number; key: number } | null;
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

function PanToTarget({
  panTarget,
}: {
  panTarget: { lat: number; lng: number; key: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !panTarget) return;
    map.panTo({ lat: panTarget.lat, lng: panTarget.lng });
    map.setZoom(15);
  }, [map, panTarget]);

  return null;
}

interface ClusterProperties {
  cluster: true;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: number;
}

interface PointProperties {
  cluster: false;
  placeId: number;
  color: string;
  title: string;
  selected: boolean;
}

type FeatureProps = ClusterProperties | PointProperties;

const CLUSTER_THRESHOLD = 50;

function ClusteredMarkers({
  places,
  selectedPlaceId,
  onPlaceSelect,
}: {
  places: Place[];
  selectedPlaceId: number | null;
  onPlaceSelect: (id: number) => void;
}) {
  const map = useMap();
  const shouldCluster = places.length > CLUSTER_THRESHOLD;
  const [viewport, setViewport] = useState<{
    bbox: [number, number, number, number];
    zoom: number;
  } | null>(null);

  // Track map viewport
  useEffect(() => {
    if (!map || !shouldCluster) return;
    const listener = map.addListener("idle", () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      if (!bounds || zoom === undefined) return;
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      setViewport({
        bbox: [sw.lng(), sw.lat(), ne.lng(), ne.lat()],
        zoom: Math.floor(zoom),
      });
    });
    return () => google.maps.event.removeListener(listener);
  }, [map, shouldCluster]);

  // Build supercluster index (only when clustering)
  const index = useMemo(() => {
    if (!shouldCluster) return null;
    const sc = new Supercluster<PointProperties>({
      radius: 80,
      maxZoom: 16,
    });
    sc.load(
      places
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [p.longitude, p.latitude],
          },
          properties: {
            cluster: false as const,
            placeId: p.id,
            color: p.placeCategories[0]?.category?.color || "#6b7280",
            title: p.title,
            selected: p.id === selectedPlaceId,
          },
        })),
    );
    return sc;
  }, [places, selectedPlaceId, shouldCluster]);

  // Get visible clusters/points
  const clusters = useMemo(() => {
    if (!index || !viewport) return [];
    return index.getClusters(
      viewport.bbox,
      viewport.zoom,
    ) as Supercluster.ClusterFeature<FeatureProps>[];
  }, [index, viewport]);

  const handleClusterClick = useCallback(
    (clusterId: number, lat: number, lng: number) => {
      if (!map || !index) return;
      const zoom = index.getClusterExpansionZoom(clusterId);
      map.panTo({ lat, lng });
      map.setZoom(zoom);
    },
    [map, index],
  );

  // Few places — render directly, no clustering
  if (!shouldCluster) {
    return (
      <>
        {places.map((place) => {
          if (!place.latitude || !place.longitude) return null;
          const color = place.placeCategories[0]?.category?.color || "#6b7280";
          return (
            <AdvancedMarker
              key={place.id}
              position={{ lat: place.latitude, lng: place.longitude }}
              onClick={() => onPlaceSelect(place.id)}
              title={place.title}
            >
              <MapPin color={color} selected={place.id === selectedPlaceId} />
            </AdvancedMarker>
          );
        })}
      </>
    );
  }

  return (
    <>
      {clusters.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;

        if (props.cluster) {
          const { cluster_id, point_count } = props;
          const size = Math.floor(36 + Math.sqrt(point_count) * 4);
          return (
            <AdvancedMarker
              key={`cluster-${cluster_id}`}
              position={{ lat, lng }}
              zIndex={point_count}
              onClick={() => handleClusterClick(cluster_id, lat, lng)}
            >
              <div
                style={{ width: size, height: size }}
                className="flex items-center justify-center rounded-full bg-blue-500 text-white text-sm font-bold border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-110"
              >
                {point_count}
              </div>
            </AdvancedMarker>
          );
        }

        const { placeId, color, title, selected } =
          props as unknown as PointProperties;
        return (
          <AdvancedMarker
            key={`place-${placeId}`}
            position={{ lat, lng }}
            onClick={() => onPlaceSelect(placeId)}
            title={title}
          >
            <MapPin color={color} selected={selected} />
          </AdvancedMarker>
        );
      })}
    </>
  );
}

export function ExplorerMap({
  places,
  selectedPlaceId,
  onPlaceSelect,
  userPosition: userPos,
  userHeading: heading,
  locationError: error,
  panTarget,
}: ExplorerMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
        <PanToTarget panTarget={panTarget} />

        {/* User location */}
        {userPos && (
          <AdvancedMarker position={userPos} zIndex={1000} title="You are here">
            <UserLocationDot heading={heading} />
          </AdvancedMarker>
        )}

        <ClusteredMarkers
          places={places}
          selectedPlaceId={selectedPlaceId}
          onPlaceSelect={onPlaceSelect}
        />

        <MapControl position={ControlPosition.RIGHT_TOP}>
          <div className="mr-2.5 mt-2.5">
            <WeatherWidget />
          </div>
        </MapControl>

        <MapControl position={ControlPosition.RIGHT_BOTTOM}>
          <div className="mr-2.5 mb-6">
            <MyLocationButton userPos={userPos} error={error} />
          </div>
        </MapControl>
      </Map>
    </APIProvider>
  );
}
