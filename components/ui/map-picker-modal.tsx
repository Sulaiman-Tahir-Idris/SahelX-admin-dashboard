"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog";
import { Button } from "./button";
import { GoogleMap } from "@react-google-maps/api";
import { Input } from "./input";
import { Search } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: { address: string; lat: number; lng: number }) => void;
  initialLat: number;
  initialLng: number;
}

const mapContainerStyle = { width: "100%", height: "400px" };
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "9009e1003c69980469a79a63";

export function MapPickerModal({ isOpen, onClose, onConfirm, initialLat, initialLng }: Props) {
  const [position, setPosition] = useState({ lat: initialLat, lng: initialLng });
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const fetchAddress = useCallback((latLng: google.maps.LatLngLiteral) => {
    if (!geocoderRef.current) geocoderRef.current = new google.maps.Geocoder();
    setLoading(true);
    geocoderRef.current.geocode({ location: latLng }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        setAddress(results[0].formatted_address);
      } else {
        setAddress(`${latLng.lat.toFixed(5)}, ${latLng.lng.toFixed(5)}`);
      }
      setLoading(false);
    });
  }, []);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim() || !window.google) return;
    if (!geocoderRef.current) geocoderRef.current = new google.maps.Geocoder();
    
    setSearching(true);
    geocoderRef.current.geocode({ address: searchQuery }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        const pos = { lat: loc.lat(), lng: loc.lng() };
        setPosition(pos);
        setAddress(results[0].formatted_address);
        // Pan the map to the new position
        if (mapRef.current) mapRef.current.panTo(pos);
      } else {
        alert("Location not found. Try a different search term.");
      }
      setSearching(false);
    });
  }, [searchQuery]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    // Create draggable AdvancedMarkerElement
    const { AdvancedMarkerElement } = window.google.maps.marker;
    const marker = new AdvancedMarkerElement({
      position,
      map,
      gmpDraggable: true,
    });
    markerRef.current = marker;

    marker.addListener("dragend", () => {
      let pos: google.maps.LatLngLiteral;
      // Handle AdvancedMarkerElement position which can be LatLng, LatLngLiteral, or LatLngAltitude
      const p = marker.position as any;
      if (p && typeof p.lat === "function") {
        pos = { lat: p.lat(), lng: p.lng() };
      } else if (p && typeof p.lat === "number") {
        pos = { lat: p.lat, lng: p.lng };
      } else {
        return; // Fallback
      }
      setPosition(pos);
      fetchAddress(pos);
    });
  }, [position, fetchAddress]);

  // Keep marker in sync when position changes from search or click
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.position = position;
    }
  }, [position]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setPosition(pos);
      fetchAddress(pos);
    }
  }, [fetchAddress]);
  
  // Fetch address for initial location when modal opens
  React.useEffect(() => {
    if (isOpen && !address && window.google) {
      fetchAddress(position);
    }
  }, [isOpen, address, position, fetchAddress]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pick Location on Map</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Search for an area, street, or landmark..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching} variant="secondary">
              <Search className="h-4 w-4 mr-2" />
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>
          <div className="mb-2">
            <p className="text-sm text-muted-foreground font-medium mb-1">Selected Location:</p>
            <p className="text-base font-semibold">{loading ? "Loading address..." : address || "Click on the map to select"}</p>
          </div>
          <div className="rounded-xl overflow-hidden border">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={position}
                zoom={14}
                onClick={onMapClick}
                onLoad={onMapLoad}
                options={{ 
                  disableDefaultUI: true, 
                  zoomControl: true,
                  mapId: MAP_ID,
                  clickableIcons: false,
                }}
              />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm({ address, lat: position.lat, lng: position.lng })} disabled={loading || !address}>
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


