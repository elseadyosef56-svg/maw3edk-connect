import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

declare global {
  interface Window { google?: any; __gmapsInit?: () => void; }
}

let loader: Promise<void> | null = null;
const loadGoogleMaps = () => {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    const env = import.meta.env as Record<string, string>;
    const key = env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
    const channel = env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"];
    if (!key) { reject(new Error("missing key")); return; }
    window.__gmapsInit = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__gmapsInit&language=ar&region=LY${channel ? `&channel=${channel}` : ""}`;
    s.async = true;
    s.onerror = () => { loader = null; reject(new Error("load failed")); };
    document.head.appendChild(s);
  });
  return loader;
};

interface Props {
  lat: number; lng: number; label?: string; height?: number;
  interactive?: boolean; onChange?: (lat: number, lng: number) => void; className?: string;
}

export const LocationMap = ({ lat, lng, label, height = 240, interactive = false, onChange, className }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then(() => {
      if (cancelled || !ref.current) return;
      const g = window.google.maps;
      const pos = { lat: Number(lat) || 32.8872, lng: Number(lng) || 13.1913 };
      const map = new g.Map(ref.current, {
        center: pos, zoom: 15, clickableIcons: false, gestureHandling: "cooperative",
        mapTypeControl: interactive, streetViewControl: false, fullscreenControl: true,
      });
      const marker = new g.Marker({ position: pos, map, draggable: interactive, title: label, animation: g.Animation.DROP });
      if (label) {
        const info = new g.InfoWindow({ content: "" });
        const div = document.createElement("div");
        div.style.cssText = "font-weight:700;padding:2px 4px";
        div.textContent = label;
        info.setContent(div);
        marker.addListener("click", () => info.open({ map, anchor: marker }));
      }
      if (interactive) {
        marker.addListener("dragend", () => { const p = marker.getPosition(); changeRef.current?.(p.lat(), p.lng()); });
        map.addListener("click", (e: any) => { marker.setPosition(e.latLng); changeRef.current?.(e.latLng.lat(), e.latLng.lng()); });
      }
      mapRef.current = map; markerRef.current = marker;
      setState("ready");
    }).catch(() => !cancelled && setState("error"));
    return () => { cancelled = true; markerRef.current?.setMap(null); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const p = { lat: Number(lat), lng: Number(lng) };
    markerRef.current.setPosition(p);
    mapRef.current.panTo(p);
  }, [lat, lng]);

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border border-border shadow-md ${className ?? ""}`} style={{ height }}>
      <div ref={ref} className="absolute inset-0" />
      {state !== "ready" && (
        <div className="absolute inset-0 grid place-items-center bg-muted/60 text-muted-foreground text-sm">
          {state === "loading" ? <Loader2 className="w-6 h-6 animate-spin" /> : (
            <a className="flex items-center gap-2 underline" target="_blank" rel="noopener"
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}>
              <MapPin className="w-4 h-4" /> فتح الموقع في خرائط جوجل
            </a>
          )}
        </div>
      )}
    </div>
  );
};
