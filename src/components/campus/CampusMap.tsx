import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from 'react-map-gl/maplibre';
import type { LayerProps } from 'react-map-gl/maplibre';
import type { ExpressionSpecification } from 'maplibre-gl';
import {
  Accessibility,
  AlertTriangle,
  ArrowUpDown,
  Ban,
  Eye,
  Footprints,
  Layers,
  LocateFixed,
  Loader2,
  PersonStanding,
  RefreshCw,
  Route as RouteIcon,
  X,
} from 'lucide-react';
import {
  BLOCKED_COST,
  CAMPUS_CENTER,
  CITY,
  type Mode,
  type NetworkGeoJson,
  type PathProps,
  type PlaceRow,
  type RouteLeg,
} from '../../lib/accessibility-types';
import { supabase } from '../../lib/supabase';
import { findCampusRoute, snapBarriers } from '../../lib/campusRouter';
import { retryCampusData, useCampusData } from '../../hooks/useCampusData';
import type { LanguageCode } from '../../types/sugampath';
import { PlacePicker } from './PlacePicker';
import { CAMPUS_STRINGS } from './strings';

import { SATELLITE_STYLE, STREET_STYLE } from '../../lib/mapStyles';

const RED = '#d62828';
const AMBER = '#e09f00';
const GREEN = '#1f9d55';
const NEUTRAL = '#3b6ea5';
const ROUTE = '#1d4ed8';

const SCORE_KEY: Record<Exclude<Mode, 'standard'>, keyof PathProps> = {
  wheelchair: 'score_wheelchair',
  blind: 'score_blind',
  walker: 'score_walker',
};
const COST_KEY: Record<Mode, keyof PathProps> = {
  standard: 'cost_standard',
  wheelchair: 'cost_wheelchair',
  blind: 'cost_blind',
  walker: 'cost_walker',
};

function colorExpr(mode: Mode): ExpressionSpecification | string {
  if (mode === 'standard') return NEUTRAL;
  const score: ExpressionSpecification = ['to-number', ['get', SCORE_KEY[mode]], 0];
  const banded: ExpressionSpecification = ['step', score, RED, 40, AMBER, 75, GREEN];
  // Segments with a wheelchair-blocking barrier are always red for wheelchair users.
  return mode === 'wheelchair' ? ['case', ['==', ['get', 'barrier_wc'], true], RED, banded] : banded;
}

const OPACITY: ExpressionSpecification = ['case', ['<', ['to-number', ['get', 'confidence'], 0], 0.5], 0.35, 0.95];
const WIDTH: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 14, 1.5, 17, 4, 19, 8];

export type ScoreBand = 'good' | 'fair' | 'poor';
export function band(score: number): ScoreBand {
  return score >= 75 ? 'good' : score >= 40 ? 'fair' : 'poor';
}

type RouteState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'ok'; legs: RouteLeg[]; meters: number };

interface Props {
  mode: Mode;
  onModeChange?: (m: Mode) => void;
  showModeSelector?: boolean;
  language: LanguageCode;
  /** Height class for the map area. */
  className?: string;
  /** Preselect the destination (place external_id), e.g. from the Places screen. */
  initialTo?: string | null;
  /** Preselect the start (place external_id). */
  initialFrom?: string | null;
  /** Called with the current route (or null when cleared / not found). */
  onRouteChange?: (r: CampusRoute | null) => void;
  /** Extra content under the route result (navigation panel). */
  panel?: React.ReactNode;
  /** Live GPS position while walking. */
  livePosition?: { lat: number; lng: number } | null;
}

export interface CampusRoute {
  from: string;
  to: string;
  mode: Mode;
  legs: RouteLeg[];
  /** Shortest (standard) route between the same places, for comparison. */
  standardLegs: RouteLeg[];
}

export function CampusMap({
  mode,
  onModeChange,
  showModeSelector = false,
  language,
  className = '',
  initialTo = null,
  initialFrom = null,
  onRouteChange,
  panel,
  livePosition = null,
}: Props) {
  const s = CAMPUS_STRINGS[language] ?? CAMPUS_STRINGS.en;
  const { network, places, barriers, gateNodes, networkStatus, placesStatus, networkError, placesError } =
    useCampusData();
  const snapped = useMemo(() => snapBarriers(network, barriers), [network, barriers]);
  const mapRef = useRef<MapRef>(null);

  const [satellite, setSatellite] = useState(false);
  const [zoom, setZoom] = useState(16);
  const [from, setFrom] = useState<string | null>(initialFrom);
  const [to, setTo] = useState<string | null>(initialTo);
  useEffect(() => {
    if (initialTo) setTo(initialTo);
  }, [initialTo]);
  useEffect(() => {
    if (initialFrom) setFrom(initialFrom);
  }, [initialFrom]);
  const [route, setRoute] = useState<RouteState>({ status: 'idle' });
  const [standardLegs, setStandardLegs] = useState<RouteLeg[]>([]);
  const onRouteChangeRef = useRef(onRouteChange);
  onRouteChangeRef.current = onRouteChange;
  useEffect(() => {
    onRouteChangeRef.current?.(
      route.status === 'ok' && from && to ? { from, to, mode, legs: route.legs, standardLegs } : null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, standardLegs]);
  const [segment, setSegment] = useState<{ props: PathProps; lon: number; lat: number } | null>(null);
  const [placePopup, setPlacePopup] = useState<PlaceRow | null>(null);
  const reqId = useRef(0);

  const placeList = places ?? [];
  const byId = useMemo(() => {
    const m = new globalThis.Map<string, PlaceRow>();
    placeList.forEach((p) => m.set(p.external_id, p));
    return m;
  }, [placeList]);

  // If the data refresh removes or disables a picked place, drop it.
  useEffect(() => {
    if (from && !byId.get(from)?.routable) setFrom(null);
    if (to && !byId.get(to)?.routable) setTo(null);
  }, [byId, from, to]);

  const { paths, connectors } = useMemo(() => {
    const feats = network?.features ?? [];
    const p: NetworkGeoJson = {
      type: 'FeatureCollection',
      features: feats
        .filter((f) => !f.properties?.is_connector)
        .map((f) => {
          const b = snapped.get(f.properties.id);
          return b
            ? { ...f, properties: { ...f.properties, barrier_wc: b.blocksWheelchair, barrier_types: b.types.join(', ') } }
            : f;
        }),
    };
    const c: NetworkGeoJson = { type: 'FeatureCollection', features: feats.filter((f) => f.properties?.is_connector) };
    return { paths: p, connectors: c };
  }, [network, snapped]);

  const canRoute = !!from && !!to && from !== to && !!byId.get(from)?.routable && !!byId.get(to)?.routable;

  const findRoute = useCallback(
    async (m: Mode = mode) => {
      if (!from || !to || from === to) return;
      const id = ++reqId.current;
      setRoute({ status: 'loading' });
      setSegment(null);
      let data: RouteLeg[];
      if (network && gateNodes) {
        // Barrier- and tactile-aware routing over the live Supabase network (see campusRouter.ts).
        data = findCampusRoute(network, gateNodes, snapped, from, to, m);
      } else {
        if (!supabase) return setRoute({ status: 'error', message: 'Supabase is not configured.' });
        const r = await supabase.rpc('route_between_places', { p_city: CITY, p_from: from, p_to: to, p_mode: m });
        if (id !== reqId.current) return;
        if (r.error) return setRoute({ status: 'error', message: r.error.message });
        data = (r.data ?? []) as RouteLeg[];
      }
      if (id !== reqId.current) return; // a newer request superseded this one
      const legs = data.filter((l) => l.geojson?.coordinates?.length).sort((a, b) => a.seq - b.seq);
      if (!legs.length) return setRoute({ status: 'empty' });
      const meters = legs.reduce((sum, l) => sum + (Number(l.length_m) || 0), 0);
      setStandardLegs(
        m === 'standard' ? legs : network && gateNodes ? findCampusRoute(network, gateNodes, snapped, from, to, 'standard') : []
      );
      setRoute({ status: 'ok', legs, meters });

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const l of legs)
        for (const [x, y] of l.geojson.coordinates) {
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      mapRef.current?.fitBounds([[minX, minY], [maxX, maxY]], { padding: { top: 90, bottom: 60, left: 60, right: 60 }, maxZoom: 18, duration: 700 });
    },
    [from, to, mode, network, gateNodes, snapped]
  );

  // Picking new endpoints invalidates the old route.
  useEffect(() => {
    reqId.current++;
    setRoute({ status: 'idle' });
  }, [from, to]);

  // Changing mode re-runs a route that is already on screen.
  const lastMode = useRef(mode);
  useEffect(() => {
    if (lastMode.current === mode) return;
    lastMode.current = mode;
    if (route.status !== 'idle' && canRoute) void findRoute(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const standardFc = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features:
        route.status === 'ok' && mode !== 'standard'
          ? standardLegs.map((l) => ({ type: 'Feature' as const, geometry: l.geojson, properties: {} }))
          : [],
    }),
    [route, standardLegs, mode]
  );

  const routeFc = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features:
        route.status === 'ok'
          ? route.legs.map((l) => ({ type: 'Feature' as const, geometry: l.geojson, properties: { seq: l.seq } }))
          : [],
    }),
    [route]
  );

  const onMapClick = (e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f) return setSegment(null);
    setPlacePopup(null);
    setSegment({ props: f.properties as unknown as PathProps, lon: e.lngLat.lng, lat: e.lngLat.lat });
  };

  const color = colorExpr(mode);
  const solidLayer: LayerProps = {
    id: 'paths-solid',
    type: 'line',
    filter: ['!=', ['get', 'has_steps'], true],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': color, 'line-width': WIDTH, 'line-opacity': OPACITY },
  };
  const stepsLayer: LayerProps = {
    id: 'paths-steps',
    type: 'line',
    filter: ['==', ['get', 'has_steps'], true],
    layout: { 'line-join': 'round' },
    paint: { 'line-color': color, 'line-width': WIDTH, 'line-opacity': OPACITY, 'line-dasharray': [1.2, 1] },
  };

  const modes: { id: Mode; label: string; Icon: typeof Accessibility }[] = [
    { id: 'wheelchair', label: s.modes.wheelchair, Icon: Accessibility },
    { id: 'blind', label: s.modes.blind, Icon: Eye },
    { id: 'walker', label: s.modes.walker, Icon: PersonStanding },
    { id: 'standard', label: s.modes.standard, Icon: Footprints },
  ];

  const [locating, setLocating] = useState(false);
  const nearestToMe = () => {
    if (!('geolocation' in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        const kx = Math.cos((coords.latitude * Math.PI) / 180);
        let best: PlaceRow | null = null;
        let bestD = Infinity;
        for (const p of placeList) {
          if (!p.routable) continue;
          const d = ((p.lon - coords.longitude) * kx) ** 2 + (p.lat - coords.latitude) ** 2;
          if (d < bestD) {
            bestD = d;
            best = p;
          }
        }
        if (best) setFrom(best.external_id);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const pick = (which: 'from' | 'to', p: PlaceRow) => {
    if (!p.routable) return;
    (which === 'from' ? setFrom : setTo)(p.external_id);
    setPlacePopup(null);
  };

  const loadingAny = networkStatus === 'loading' || placesStatus === 'loading';
  const segCount = paths.features.length;

  return (
    <div className={`flex flex-col md:grid md:grid-cols-[380px_1fr] md:grid-rows-1 w-full ${className}`}>
      {/* Left column: one scroll area on desktop; on mobile its parts flow around the map. */}
      <div className="contents md:flex md:flex-col md:col-start-1 md:row-start-1 md:min-h-0 md:overflow-y-auto bg-[var(--bg-surface)] md:border-r border-[var(--border-line)]">
      {/* ---------- Controls ---------- */}
      <aside className="order-1 md:order-none bg-[var(--bg-surface)] p-4 space-y-4">
        {/* Mode selector (shown only when enabled, e.g. for auditor inspections) */}
        {showModeSelector && onModeChange && (
          <fieldset>
            <legend className="sr-only">{s.modeLabel}</legend>
            <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={s.modeLabel}>
              {modes.map(({ id, label, Icon }) => {
                const on = mode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => onModeChange(id)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-2 min-h-[60px] text-[11px] font-bold ${
                      on
                        ? 'bg-[var(--tactile-yellow)] border-[var(--ink-primary)] text-[var(--tactile-yellow-ink)]'
                        : 'bg-[var(--bg-paper)] border-[var(--border-line)] text-[var(--ink-primary)]'
                    }`}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span className="truncate max-w-full px-0.5">{label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Route */}
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (canRoute) void findRoute();
          }}
        >
          {placesStatus === 'error' ? (
            <ErrorBox message={placesError ?? ''} retry={s.retry} />
          ) : (
            <>
              <div className="flex justify-end -mb-6 relative z-10">
                <button
                  type="button"
                  onClick={nearestToMe}
                  disabled={placesStatus !== 'ready' || locating}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ink-primary)] underline underline-offset-2 disabled:opacity-50 min-h-[28px]"
                >
                  {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <LocateFixed className="w-3.5 h-3.5" aria-hidden="true" />}
                  {s.useMyLocation}
                </button>
              </div>
              <PlacePicker
                label={s.from}
                places={placeList}
                value={from}
                onChange={setFrom}
                placeholder={placesStatus === 'loading' ? s.loading : s.searchPlace}
                noAccessLabel={s.noEntrance}
                disabled={placesStatus !== 'ready'}
              />
              <div className="flex justify-center -my-1">
                <button
                  type="button"
                  onClick={() => {
                    setFrom(to);
                    setTo(from);
                  }}
                  disabled={!from && !to}
                  aria-label={s.swap}
                  title={s.swap}
                  className="w-10 h-10 grid place-items-center rounded-full border-2 border-[var(--border-line)] bg-[var(--bg-paper)] text-[var(--ink-primary)] disabled:opacity-40"
                >
                  <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <PlacePicker
                label={s.to}
                places={placeList}
                value={to}
                onChange={setTo}
                placeholder={placesStatus === 'loading' ? s.loading : s.searchPlace}
                noAccessLabel={s.noEntrance}
                disabled={placesStatus !== 'ready'}
              />
              {from && to && from === to && (
                <p className="text-xs font-semibold text-[var(--status-red)]">{s.samePlace}</p>
              )}
              <button
                type="submit"
                disabled={!canRoute || route.status === 'loading'}
                className="w-full h-12 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] font-bold text-base inline-flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {route.status === 'loading' ? (
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                ) : (
                  <RouteIcon className="w-5 h-5" aria-hidden="true" />
                )}
                {s.findRoute}
              </button>
            </>
          )}

          <div aria-live="polite">
            {route.status === 'ok' && (
              <div className="rounded-xl border-2 border-[var(--ink-primary)] bg-[var(--tactile-yellow-soft)] p-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-2xl font-bold font-mono-tabular text-[var(--ink-primary)]">
                    {Math.round(route.meters).toLocaleString()} m
                  </div>
                  <div className="text-xs font-semibold text-[var(--ink-secondary)]">
                    {route.legs.length} {s.legs} · {s.modes[mode]}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRoute({ status: 'idle' })}
                  aria-label={s.clearRoute}
                  className="w-10 h-10 grid place-items-center rounded-full hover:bg-[var(--bg-subtle)]"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
            {route.status === 'empty' && (
              <div className="rounded-xl border-2 border-[var(--status-amber)] bg-[var(--status-amber-soft)] p-3 text-sm font-bold text-[var(--ink-primary)]">
                {s.noRoute}
              </div>
            )}
            {route.status === 'error' && (
              <div role="alert" className="rounded-xl border-2 border-[var(--status-red)] bg-[var(--status-red-soft)] p-3 text-sm text-[var(--ink-primary)]">
                <div className="font-bold">{s.routeFailed}</div>
                <div className="text-xs mt-0.5 break-words">{route.message}</div>
              </div>
            )}
          </div>
        </form>
      </aside>

      {panel && <div className="order-3 md:order-none bg-[var(--bg-surface)] px-4 pb-4">{panel}</div>}

      {/* ---------- Legend (below map on mobile, under controls on desktop) ---------- */}
      <section
        aria-label={s.legend}
        className="order-4 md:order-none bg-[var(--bg-surface)] border-t border-[var(--border-line)] px-4 py-3 grid grid-cols-2 md:grid-cols-1 gap-1.5 content-start text-xs font-semibold text-[var(--ink-primary)]"
      >
          {mode === 'standard' ? (
            <LegendRow swatch={<Line color={NEUTRAL} />} label={s.legendPath} />
          ) : (
            <>
              <LegendRow swatch={<Line color={GREEN} />} label={`${s.good} (75+)`} />
              <LegendRow swatch={<Line color={AMBER} />} label={`${s.fair} (40–74)`} />
              <LegendRow swatch={<Line color={RED} />} label={`${s.poor} (<40)`} />
            </>
          )}
          <LegendRow swatch={<Line color="#555" dashed />} label={s.steps} />
          {mode !== 'standard' && (
            <LegendRow
              swatch={
                <span className="grid place-items-center w-7 shrink-0">
                  <span className="grid place-items-center w-4 h-4 rounded-full border-2 border-[#d62828] text-[#d62828]">
                    <Ban className="w-2.5 h-2.5" aria-hidden="true" />
                  </span>
                </span>
              }
              label={mode === 'wheelchair' ? s.barrierAvoided : s.barrier}
            />
          )}
          {mode === 'blind' && <LegendRow swatch={<Line color="#1f9d55" tactile />} label={s.tactilePreferred} />}
          <LegendRow swatch={<Line color="#555" faded />} label={s.lowConfidence} />
          <LegendRow swatch={<Line color={ROUTE} thick />} label={s.yourRoute} />
          {mode !== 'standard' && <LegendRow swatch={<Line color="#4b5563" dashed />} label={s.shortestRoute} />}
      </section>
      </div>

      {/* ---------- Map ---------- */}
      <div className="order-2 md:order-none md:col-start-2 md:row-start-1 flex flex-col h-[62vh] md:h-auto min-h-[360px]">
      <div className="relative flex-1">
        <Map
          ref={mapRef}
          initialViewState={{ longitude: CAMPUS_CENTER[0], latitude: CAMPUS_CENTER[1], zoom: 16 }}
          mapStyle={satellite ? SATELLITE_STYLE : STREET_STYLE}
          style={{ position: 'absolute', inset: 0 }}
          interactiveLayerIds={segCount ? ['paths-solid', 'paths-steps'] : []}
          onClick={onMapClick}
          onZoomEnd={(e) => setZoom(e.viewState.zoom)}
          cursor={segment ? 'pointer' : undefined}
          attributionControl={{ compact: true }}
        >
          <NavigationControl position="top-right" showCompass={false} />
          <ScaleControl position="bottom-right" />

          <Source id="connectors" type="geojson" data={connectors}>
            <Layer
              id="connectors-line"
              type="line"
              paint={{ 'line-color': '#7a7a7a', 'line-width': 1.2, 'line-opacity': 0.5, 'line-dasharray': [0.5, 1] }}
            />
          </Source>
          <Source id="paths" type="geojson" data={paths}>
            <Layer {...solidLayer} />
            <Layer {...stepsLayer} />
            {mode === 'blind' && (
              <Layer
                id="paths-tactile"
                type="line"
                filter={['in', ['get', 'tactile_paving'], ['literal', ['yes', 'partial']]]}
                paint={{ 'line-color': '#ffffff', 'line-width': 2, 'line-dasharray': [0.6, 0.6] }}
              />
            )}
          </Source>
          <Source id="route-standard" type="geojson" data={standardFc}>
            <Layer
              id="route-standard-line"
              type="line"
              layout={{ 'line-join': 'round' }}
              paint={{ 'line-color': '#4b5563', 'line-width': 4, 'line-opacity': 0.8, 'line-dasharray': [1.5, 1.2] }}
            />
          </Source>
          <Source id="route" type="geojson" data={routeFc}>
            <Layer
              id="route-casing"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': '#ffffff', 'line-width': 12, 'line-opacity': 0.95 }}
            />
            <Layer
              id="route-line"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': ROUTE, 'line-width': 7 }}
            />
          </Source>

          {barriers
            .filter((b) => b.blocks !== 'none' && (mode === 'wheelchair' || mode === 'walker' || mode === 'blind'))
            .map((b) => (
              <Marker key={b.external_id} longitude={b.lon} latitude={b.lat} anchor="center">
                <span
                  role="img"
                  aria-label={`${s.barrier}: ${b.type}${b.blocks === 'wheelchair' ? ` (${s.blocksWheelchair})` : ''}`}
                  title={`${s.barrier}: ${b.type}${b.blocks === 'wheelchair' ? ` (${s.blocksWheelchair})` : ''}`}
                  className="grid place-items-center w-5 h-5 rounded-full bg-white border-2 border-[#d62828] text-[#d62828] shadow"
                >
                  <Ban className="w-3 h-3" aria-hidden="true" />
                </span>
              </Marker>
            ))}

          {placeList.map((p) => {
            const role = p.external_id === from ? 'A' : p.external_id === to ? 'B' : null;
            return (
              <Marker key={p.external_id} longitude={p.lon} latitude={p.lat} anchor="center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSegment(null);
                    setPlacePopup(p);
                  }}
                  aria-label={`${p.name}${p.routable ? '' : ` (${s.noEntrance})`}`}
                  className="flex flex-col items-center group focus:outline-none"
                >
                  <span
                    className={`grid place-items-center rounded-full border-2 border-white shadow ${
                      role ? 'w-7 h-7 text-xs font-bold text-white' : 'w-4 h-4'
                    } ${role ? 'bg-[var(--ink-primary)]' : p.routable ? 'bg-[#1d4ed8]' : 'bg-gray-400'} group-focus-visible:ring-4 group-focus-visible:ring-[var(--tactile-yellow)]`}
                  >
                    {role}
                  </span>
                  {(zoom >= 16 || role) && (
                    <span
                      className={`mt-0.5 max-w-[120px] truncate rounded px-1 text-[11px] font-bold leading-tight ${
                        p.routable ? 'bg-white/90 text-gray-900' : 'bg-white/70 text-gray-500'
                      }`}
                    >
                      {p.name}
                    </span>
                  )}
                </button>
              </Marker>
            );
          })}

          {livePosition && (
            <Marker longitude={livePosition.lng} latitude={livePosition.lat} anchor="center">
              <span role="img" aria-label={s.youAreHere} className="relative grid place-items-center w-6 h-6">
                <span className="absolute inset-0 rounded-full bg-[#1d4ed8]/30 animate-ping" />
                <span className="w-4 h-4 rounded-full bg-[#1d4ed8] border-[3px] border-white shadow" />
              </span>
            </Marker>
          )}

          {placePopup && (
            <Popup
              longitude={placePopup.lon}
              latitude={placePopup.lat}
              anchor="bottom"
              offset={14}
              onClose={() => setPlacePopup(null)}
              closeOnClick={false}
              maxWidth="260px"
            >
              <div className="space-y-2 text-gray-900">
                <div className="font-bold text-sm pr-4">{placePopup.name}</div>
                {placePopup.routable ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button type="button" onClick={() => pick('from', placePopup)} className="h-9 rounded-lg bg-gray-900 text-white text-xs font-bold">
                      {s.startHere}
                    </button>
                    <button type="button" onClick={() => pick('to', placePopup)} className="h-9 rounded-lg bg-[#FFC72C] text-gray-900 text-xs font-bold">
                      {s.goHere}
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">{s.noEntranceLong}</div>
                )}
              </div>
            </Popup>
          )}

          {segment && (
            <Popup
              longitude={segment.lon}
              latitude={segment.lat}
              anchor="bottom"
              onClose={() => setSegment(null)}
              closeOnClick={false}
              maxWidth="280px"
            >
              <SegmentDetails p={segment.props} mode={mode} s={s} />
            </Popup>
          )}
        </Map>

        {/* Basemap toggle */}
        <button
          type="button"
          onClick={() => setSatellite((v) => !v)}
          aria-pressed={satellite}
          className="absolute top-3 left-3 z-10 h-10 px-3 rounded-xl bg-white text-gray-900 shadow border border-gray-300 text-sm font-bold inline-flex items-center gap-2"
        >
          <Layers className="w-4 h-4" aria-hidden="true" />
          {satellite ? s.streetMap : s.satellite}
        </button>

        {/* Network status */}
        <div className="absolute bottom-8 left-3 z-10 space-y-2 max-w-[calc(100%-1.5rem)]" aria-live="polite">
          {loadingAny && (
            <div className="rounded-xl bg-white/95 shadow px-3 py-2 text-sm font-semibold text-gray-900 inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              {s.loadingMap}
            </div>
          )}
          {networkStatus === 'error' && <ErrorBox message={networkError ?? ''} retry={s.retry} title={s.mapFailed} />}
          {networkStatus === 'ready' && segCount === 0 && (
            <div className="rounded-xl bg-white/95 shadow px-3 py-2 text-sm font-semibold text-gray-900">{s.noPaths}</div>
          )}
        </div>
      </div>

        {/* Disclaimer — always visible with the map */}
        <p role="note" className="flex items-start gap-2 bg-[var(--tactile-yellow-soft)] border-t border-[var(--border-line)] px-3 py-2 text-xs font-semibold text-[var(--ink-primary)]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--status-amber)]" aria-hidden="true" />
          <span>{s.disclaimer}</span>
        </p>
      </div>
    </div>
  );
}

function SegmentDetails({ p, mode, s }: { p: PathProps; mode: Mode; s: (typeof CAMPUS_STRINGS)['en'] }) {
  const u = (v: unknown) => (v === null || v === undefined || v === '' || v === 'unknown' ? s.unknown : String(v).replace(/_/g, ' '));
  const yesNo = (v: unknown) => (v === true ? s.yes : v === false ? s.no : s.unknown);
  const width = typeof p.width_m === 'number' ? `${p.width_m.toFixed(1)} m` : s.unknown;
  const extra = p as PathProps & { barrier_wc?: boolean; barrier_types?: string };
  const blocked =
    mode !== 'standard' && (Number(p[COST_KEY[mode]]) >= BLOCKED_COST || (mode === 'wheelchair' && !!extra.barrier_wc));
  const scores: [Exclude<Mode, 'standard'>, number][] = [
    ['wheelchair', Number(p.score_wheelchair)],
    ['blind', Number(p.score_blind)],
    ['walker', Number(p.score_walker)],
  ];
  const rows: [string, string][] = [
    [s.f.kind, u(p.kind)],
    [s.f.surface, u(p.surface)],
    [s.f.width, width],
    [s.f.steps, yesNo(p.has_steps)],
    [s.f.kerbRamp, u(p.kerb_ramp)],
    [s.f.tactile, u(p.tactile_paving)],
    [s.f.obstruction, u(p.obstruction)],
    [s.barrier, extra.barrier_types ? `${extra.barrier_types}${extra.barrier_wc ? ` (${s.blocksWheelchair})` : ''}` : s.no],
    [s.f.length, Number.isFinite(Number(p.length_m)) ? `${Math.round(Number(p.length_m))} m` : s.unknown],
  ];
  return (
    <div className="text-gray-900 text-xs space-y-2 pr-3">
      {blocked && (
        <div className="rounded-md bg-red-100 text-red-800 font-bold px-2 py-1">{s.blockedFor} {s.modes[mode]}</div>
      )}
      <div className="grid grid-cols-3 gap-1">
        {scores.map(([m, v]) => {
          const b = Number.isFinite(v) ? band(v) : null;
          return (
            <div
              key={m}
              className={`rounded-md px-1.5 py-1 text-center border ${m === mode ? 'border-gray-900' : 'border-gray-200'}`}
            >
              <div className="text-[10px] text-gray-600 truncate">{s.modes[m]}</div>
              <div className="font-bold text-sm" style={{ color: b === 'good' ? GREEN : b === 'fair' ? '#a87400' : b ? RED : undefined }}>
                {Number.isFinite(v) ? v : '—'}
              </div>
              <div className="text-[10px]">{b ? s[b] : s.unknown}</div>
            </div>
          );
        })}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-gray-600">{k}</dt>
            <dd className="font-semibold capitalize">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="text-[10px] text-gray-500">
        {s.estimate} · {s.f.confidence} {Math.round(Number(p.confidence) * 100)}%
      </div>
    </div>
  );
}

function ErrorBox({ message, retry, title }: { message: string; retry: string; title?: string }) {
  return (
    <div role="alert" className="rounded-xl border-2 border-[var(--status-red)] bg-[var(--status-red-soft)] p-3 text-sm text-[var(--ink-primary)] space-y-2">
      {title && <div className="font-bold">{title}</div>}
      <div className="text-xs break-words">{message}</div>
      <button
        type="button"
        onClick={retryCampusData}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[var(--ink-primary)] text-[var(--bg-surface)] text-xs font-bold"
      >
        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
        {retry}
      </button>
    </div>
  );
}

function LegendRow({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {swatch}
      <span>{label}</span>
    </div>
  );
}

function Line({ color, dashed, faded, thick, tactile }: { color: string; dashed?: boolean; faded?: boolean; thick?: boolean; tactile?: boolean }) {
  return (
    <svg width="28" height="10" aria-hidden="true" className="shrink-0">
      <line
        x1="2" y1="5" x2="26" y2="5"
        stroke={color}
        strokeWidth={thick ? 6 : 4}
        strokeLinecap={dashed ? 'butt' : 'round'}
        strokeDasharray={dashed ? '5 4' : undefined}
        opacity={faded ? 0.35 : 1}
      />
      {tactile && <line x1="2" y1="5" x2="26" y2="5" stroke="#fff" strokeWidth={1.5} strokeDasharray="2 2" />}
    </svg>
  );
}
