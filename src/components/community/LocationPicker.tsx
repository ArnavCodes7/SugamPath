import { useEffect, useRef, useState } from 'react';
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import { Loader2, LocateFixed, MapPin } from 'lucide-react';
import { CAMPUS_CENTER, type PlaceRow } from '../../lib/accessibility-types';
import { SATELLITE_STYLE, STREET_STYLE } from '../../lib/mapStyles';
import { PlacePicker } from '../campus/PlacePicker';
import { CAMPUS_STRINGS } from '../campus/strings';
import { CM } from '../../lib/i18nCommunity';
import type { LanguageCode } from '../../types/sugampath';

export interface PickedLocation {
  lat: number;
  lon: number;
  placeExtId: string | null;
  placeName: string | null;
}

interface Props {
  language: LanguageCode;
  places: PlaceRow[];
  value: PickedLocation | null;
  onChange: (v: PickedLocation | null) => void;
  /** Show the search box that snaps to a known campus place. */
  withSearch?: boolean;
  height?: number;
}

/** Map with a draggable pin + "use my location" + optional campus place search. */
export function LocationPicker({ language, places, value, onChange, withSearch = true, height = 240 }: Props) {
  const c = CM[language];
  const cs = CAMPUS_STRINGS[language] ?? CAMPUS_STRINGS.en;
  const mapRef = useRef<MapRef>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(false);
  const [satellite, setSatellite] = useState(false);

  useEffect(() => {
    if (value) mapRef.current?.easeTo({ center: [value.lon, value.lat], zoom: Math.max(mapRef.current.getZoom(), 17), duration: 500 });
  }, [value?.lat, value?.lon]); // eslint-disable-line react-hooks/exhaustive-deps

  const locate = () => {
    if (!('geolocation' in navigator)) return setLocError(true);
    setLocating(true);
    setLocError(false);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        onChange({ lat: coords.latitude, lon: coords.longitude, placeExtId: null, placeName: value?.placeName ?? null });
      },
      () => {
        setLocating(false);
        setLocError(true);
      },
      { enableHighAccuracy: true, timeout: 12_000 }
    );
  };

  const selectedExt = value?.placeExtId ?? null;

  return (
    <div className="space-y-3">
      {withSearch && (
        <PlacePicker
          label={c.pickCampusPlace}
          places={places}
          value={selectedExt}
          onChange={(id) => {
            const p = places.find((x) => x.external_id === id);
            if (p) onChange({ lat: p.lat, lon: p.lon, placeExtId: p.external_id, placeName: p.name });
            else onChange(null);
          }}
          placeholder={c.pickCampusPlace}
          noAccessLabel={cs.noEntrance}
          // Every campus place is markable, even ones without a routable gate.
          allowUnroutable
        />
      )}
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-secondary)] flex items-center gap-2">
        <span className="h-px flex-1 bg-[var(--border-line)]" />
        {c.orDropPin}
        <span className="h-px flex-1 bg-[var(--border-line)]" />
      </p>

      <div className="relative rounded-2xl overflow-hidden border-2 border-[var(--border-line)]" style={{ height }}>
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: value?.lon ?? CAMPUS_CENTER[0],
            latitude: value?.lat ?? CAMPUS_CENTER[1],
            zoom: value ? 17 : 15.5,
          }}
          mapStyle={satellite ? SATELLITE_STYLE : STREET_STYLE}
          style={{ position: 'absolute', inset: 0 }}
          attributionControl={{ compact: true }}
          onClick={(e) => onChange({ lat: e.lngLat.lat, lon: e.lngLat.lng, placeExtId: null, placeName: value?.placeName ?? null })}
        >
          <NavigationControl position="top-right" showCompass={false} />
          {value && (
            <Marker
              longitude={value.lon}
              latitude={value.lat}
              anchor="bottom"
              draggable
              onDragEnd={(e) =>
                onChange({ lat: e.lngLat.lat, lon: e.lngLat.lng, placeExtId: null, placeName: value.placeName })
              }
            >
              <div className="flex flex-col items-center drop-shadow-lg cursor-grab active:cursor-grabbing">
                <span className="w-10 h-10 rounded-full bg-[var(--tactile-yellow)] border-[3px] border-[var(--ink-primary)] grid place-items-center">
                  <MapPin className="w-5 h-5 text-[var(--ink-primary)]" aria-hidden="true" />
                </span>
                <span className="w-0 h-0 border-x-[7px] border-x-transparent border-t-[10px] border-t-[var(--ink-primary)] -mt-0.5" />
              </div>
            </Marker>
          )}
        </Map>

        <button
          type="button"
          onClick={() => setSatellite((v) => !v)}
          aria-pressed={satellite}
          className="absolute top-2 left-2 z-10 h-9 px-3 rounded-xl bg-white text-gray-900 shadow border border-gray-300 text-xs font-bold"
        >
          {satellite ? cs.streetMap : cs.satellite}
        </button>
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="absolute bottom-2 left-2 z-10 h-10 px-3.5 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] shadow-lg text-xs font-bold inline-flex items-center gap-1.5"
        >
          {locating ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <LocateFixed className="w-4 h-4" aria-hidden="true" />}
          {locating ? c.locating : c.useMyLocation}
        </button>
        {!value && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center pointer-events-none">
            <span className="inline-block rounded-full bg-white/95 text-gray-900 shadow px-3 py-1.5 text-xs font-bold">{c.dragPin}</span>
          </div>
        )}
      </div>
      {locError && <p role="alert" className="text-xs font-bold text-[var(--status-amber)]">{c.locFailed}</p>}
      {value && !locError && <p className="text-[11px] font-semibold text-[var(--ink-secondary)]">{c.dragPin}</p>}
    </div>
  );
}
