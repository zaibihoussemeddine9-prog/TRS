"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import type L from "leaflet";
import {
  createScooterMarkerHtml,
  createUserLocationHtml,
  getStatusColor,
  getStatusLabel,
  type ScooterStatus,
} from "@/components/ScooterMarker";

interface Scooter {
  id: string;
  name: string;
  code: string;
  status: string;
  battery: number;
  lat: number;
  lng: number;
  model: string;
  pricePerMin: number;
}

interface MapClientProps {
  scooters: Scooter[];
}

export default function MapClient({ scooters }: MapClientProps) {
  const router = useRouter();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Must import Leaflet dynamically (client only)
    import("leaflet").then((L) => {
      // Fix default marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Initialize map centered on Algiers
      const map = L.map(mapContainerRef.current!, {
        center: [36.7538, 3.0588],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      mapRef.current = map;

      // Dark tile layer
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);

      // Attribution (bottom right small)
      L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

      // Zoom control top right
      L.control.zoom({ position: "topright" }).addTo(map);

      // Add scooter markers
      scooters.forEach((scooter) => {
        const icon = L.divIcon({
          html: createScooterMarkerHtml(scooter.status as ScooterStatus, scooter.battery),
          className: "scooter-marker",
          iconSize: [44, 52],
          iconAnchor: [22, 52],
          popupAnchor: [0, -54],
        });

        const marker = L.marker([scooter.lat, scooter.lng], { icon });

        const statusColor = getStatusColor(scooter.status as ScooterStatus);
        const statusLabel = getStatusLabel(scooter.status as ScooterStatus);
        const isAvailable = scooter.status === "AVAILABLE";

        const popupContent = `
          <div style="
            background:#1e293b;
            border-radius:16px;
            padding:16px;
            min-width:200px;
            font-family:system-ui,sans-serif;
            color:white;
          ">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <span style="
                width:8px;height:8px;border-radius:50%;
                background:${statusColor};
                flex-shrink:0;
                display:inline-block;
              "></span>
              <span style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                ${statusLabel}
              </span>
            </div>
            <h3 style="margin:0 0 4px;font-size:16px;font-weight:800;">${scooter.name}</h3>
            <p style="margin:0 0 12px;font-size:13px;color:#94a3b8;">${scooter.model}</p>

            <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
              <div>
                <div style="font-size:11px;color:#64748b;margin-bottom:2px;">Batterie</div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <div style="width:48px;height:6px;background:#334155;border-radius:3px;overflow:hidden;">
                    <div style="height:100%;width:${scooter.battery}%;background:${scooter.battery >= 60 ? '#10b981' : scooter.battery >= 30 ? '#f59e0b' : '#ef4444'};border-radius:3px;"></div>
                  </div>
                  <span style="font-size:13px;font-weight:700;color:${scooter.battery >= 60 ? '#10b981' : scooter.battery >= 30 ? '#f59e0b' : '#ef4444'};">${scooter.battery}%</span>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:11px;color:#64748b;margin-bottom:2px;">Prix</div>
                <div style="font-size:15px;font-weight:800;color:#10b981;">${scooter.pricePerMin} DA<span style="font-size:11px;font-weight:500;color:#64748b;">/min</span></div>
              </div>
            </div>

            <a href="/rent/${scooter.id}" style="
              display:block;
              background:${isAvailable ? '#10b981' : '#475569'};
              color:white;
              text-align:center;
              padding:10px;
              border-radius:12px;
              font-size:13px;
              font-weight:700;
              text-decoration:none;
              cursor:${isAvailable ? 'pointer' : 'default'};
              opacity:${isAvailable ? '1' : '0.6'};
            ">
              ${isAvailable ? "Louer ce scooter" : "Indisponible"}
            </a>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 240,
          className: "scooter-popup",
        });

        // Override popup click to use router
        if (isAvailable) {
          marker.on("popupopen", () => {
            const btn = document.querySelector(`a[href="/rent/${scooter.id}"]`);
            if (btn) {
              btn.addEventListener("click", (e) => {
                e.preventDefault();
                router.push(`/rent/${scooter.id}`);
              });
            }
          });
        }

        marker.addTo(map);
        markersRef.current.push(marker);
      });

      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setUserPosition({ lat: latitude, lng: longitude });

            const userIcon = L.divIcon({
              html: createUserLocationHtml(),
              className: "",
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            const userMarker = L.marker([latitude, longitude], { icon: userIcon });
            userMarker.addTo(map);
            userMarkerRef.current = userMarker;
          },
          () => {
            // Geolocation denied or unavailable
          }
        );
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
        userMarkerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mapContainerRef}
      className="h-full w-full"
      style={{ background: "#0f172a" }}
    />
  );
}
