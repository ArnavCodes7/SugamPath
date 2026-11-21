import { useEffect, useMemo, useState } from 'react';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import { CITY_MAP_LAYOUTS } from '../data/mapLayouts';
import { localizePlaceName, STRINGS } from '../lib/i18n';
import { getScoreTier } from '../lib/scoring';
import type {
  AuditIssue,
  CitySlug,
  LanguageCode,
  PathSegmentMap,
  Place,
  RouteOption,
  TravelMode,
} from '../types/sugampath';

export type MapViewMode = 'route' | 'place' | 'auditor';

interface InteractiveMapProps {
  city: CitySlug;
  language: LanguageCode;
  mode: TravelMode;
  mapMode: MapViewMode;
  places: Place[];
  selectedPlace: Place;
  selectedGateId?: string;
  onSelectPlace?: (placeId: string) => void;
  onSelectGate?: (gateId: string) => void;
  standardRoute?: RouteOption;
  accessibleRoute?: RouteOption;
  segments?: PathSegmentMap[];
  issues?: AuditIssue[];
  selectedIssueId?: string;
  onSelectIssue?: (issueId: string) => void;
  controlsBottomOffsetClass?: string;
}

function pointsToPath(pts: Array<{ x: number; y: number }>): string {
  if (!pts.length) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

function getMidpoint(pts: Array<{ x: number; y: number }>): { x: number; y: number } {
  if (!pts.length) return { x: 480, y: 250 };
  if (pts.length === 1) return pts[0];
  const midIdx = Math.floor(pts.length / 2);
  const a = pts[midIdx - 1];
  const b = pts[midIdx];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function getGateColor(stepFree: string): string {
  if (stepFree === 'yes') return 'var(--status-good)';
  if (stepFree === 'partial') return 'var(--status-amber)';
  return 'var(--status-red)';
}

export function InteractiveMap({
  city,
  language,
  mode,
  mapMode,
  places,
  selectedPlace,
  selectedGateId,
  onSelectPlace,
  onSelectGate,
  standardRoute,
  accessibleRoute,
  segments = [],
  issues = [],
  selectedIssueId,
  onSelectIssue,
  controlsBottomOffsetClass = 'bottom-[46%] lg:bottom-6',
}: InteractiveMapProps) {
  const t = STRINGS[language];
  const layout = CITY_MAP_LAYOUTS[city];

  const [zoom, setZoom] = useState<number>(mapMode === 'place' ? 1.85 : 1.15);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(mapMode === 'place' ? 1.95 : mapMode === 'route' ? 1.35 : 1.08);
  }, [city, mapMode, selectedPlace.id]);

  // Compute focal center so routes & station footprints sit cleanly in frame
  const focusCenter = useMemo(() => {
    if (mapMode === 'place') {
      return { x: selectedPlace.map_pos.x, y: selectedPlace.map_pos.y + 18 };
    }
    if (mapMode === 'route' && accessibleRoute?.points?.length) {
      const xs = accessibleRoute.points.map((p) => p.x);
      const ys = accessibleRoute.points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 + 28 };
    }
    return { x: layout.userPos.x + 60, y: layout.userPos.y + 15 };
  }, [mapMode, selectedPlace.map_pos, accessibleRoute, layout.userPos]);

  const viewBox = useMemo(() => {
    const baseW = 960;
    const baseH = 500;
    const w = baseW / zoom;
    const h = baseH / zoom;
    const cx = Math.max(w / 2, Math.min(baseW - w / 2, focusCenter.x + panOffset.x));
    const cy = Math.max(h / 2, Math.min(baseH - h / 2, focusCenter.y + panOffset.y));
    return `${(cx - w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
  }, [focusCenter, panOffset, zoom]);

  const stdMid = useMemo(
    () => (standardRoute ? getMidpoint(standardRoute.points) : { x: 420, y: 245 }),
    [standardRoute]
  );
  const accMid = useMemo(
    () => (accessibleRoute ? getMidpoint(accessibleRoute.points) : { x: 430, y: 280 }),
    [accessibleRoute]
  );

  const originPoint =
    accessibleRoute?.points?.[0] || standardRoute?.points?.[0] || layout.userPos;
  const destPoint =
    accessibleRoute?.points?.[accessibleRoute.points.length - 1] || selectedPlace.map_pos;

  const accessibleCallout =
    mode === 'blind' ? t.tactilePathTag : t.rampPlusLiftTag;

  const handleRecenter = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(mapMode === 'place' ? 1.95 : mapMode === 'route' ? 1.35 : 1.08);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[var(--map-bg)] select-none">
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full block transition-[viewBox] duration-300"
        role="img"
        aria-label={`${t.cities[city]} — ${layout.areaLabel[language]}`}
      >
        {/* Background */}
        <rect x="0" y="0" width="960" height="500" fill="var(--map-bg)" />

        {/* Green Parks */}
        {layout.parks.map((pk, idx) => (
          <rect
            key={`pk-${idx}`}
            x={pk.x}
            y={pk.y}
            width={pk.w}
            height={pk.h}
            rx={pk.rx ?? 12}
            fill="var(--map-park)"
          />
        ))}

        {/* City Building Blocks */}
        {layout.blocks.map((blk, idx) => (
          <rect
            key={`blk-${idx}`}
            x={blk.x}
            y={blk.y}
            width={blk.w}
            height={blk.h}
            rx={blk.rx ?? 8}
            fill="var(--map-block)"
          />
        ))}

        {/* Local Streets (White Road Network) */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {layout.localRoads.map((d, idx) => (
            <g key={`lr-${idx}`}>
              <path d={d} stroke="var(--map-road-stroke)" strokeWidth="18" />
              <path d={d} stroke="var(--map-road)" strokeWidth="14" />
            </g>
          ))}
        </g>

        {/* Arterial Main Roads */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {layout.arterialRoads.map((d, idx) => (
            <g key={`ar-${idx}`}>
              <path d={d} stroke="var(--map-road-stroke)" strokeWidth="26" />
              <path d={d} stroke="var(--map-arterial)" strokeWidth="21" />
            </g>
          ))}
        </g>

        {/* Highlighted Current Area Halo */}
        <g>
          <circle
            cx={layout.userPos.x}
            cy={layout.userPos.y}
            r={layout.userAreaRadius}
            fill="var(--map-area-fill)"
            stroke="var(--status-good)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            opacity="0.7"
          />
        </g>

        {/* Localized Street Name Labels */}
        {layout.streetLabels.map((lbl, idx) => (
          <text
            key={`sl-${idx}`}
            x={lbl.x}
            y={lbl.y}
            transform={lbl.rotate ? `rotate(${lbl.rotate} ${lbl.x} ${lbl.y})` : undefined}
            fontSize="9"
            fontWeight="700"
            letterSpacing="0.8"
            fill="var(--map-label)"
          >
            {lbl.text[language]}
          </text>
        ))}

        {/* AUDITOR MODE: Path segments + clickable severity pins */}
        {mapMode === 'auditor' && (
          <g>
            {segments.map((seg) => {
              const tier = getScoreTier(seg.score_wheelchair);
              return (
                <line
                  key={seg.id}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={seg.score_wheelchair <= 25 ? 'var(--status-red)' : tier.colorVar}
                  strokeWidth="6"
                  strokeDasharray={seg.score_wheelchair <= 25 ? '7 5' : undefined}
                  strokeLinecap="round"
                  opacity="0.88"
                />
              );
            })}

            {places.map((p) => (
              <g key={`aud-p-${p.id}`} transform={`translate(${p.map_pos.x}, ${p.map_pos.y})`}>
                <rect
                  x="-38"
                  y="-12"
                  width="76"
                  height="24"
                  rx="7"
                  fill="var(--bg-surface)"
                  stroke="var(--border-line)"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="700"
                  fill="var(--ink-primary)"
                >
                  {localizePlaceName(p.name, language).split(' ').slice(0, 2).join(' ')}
                </text>
              </g>
            ))}

            {issues.map((iss) => {
              const active = iss.id === selectedIssueId;
              const isFixed = iss.status === 'fixed';
              return (
                <g
                  key={iss.id}
                  transform={`translate(${iss.map_pos.x}, ${iss.map_pos.y})`}
                  onClick={() => onSelectIssue?.(iss.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectIssue?.(iss.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${iss.id} ${iss.place_name}`}
                  className="cursor-pointer"
                >
                  {active && (
                    <circle
                      r="22"
                      fill="var(--tactile-yellow)"
                      opacity="0.35"
                    />
                  )}
                  <circle
                    r={active ? 16 : 13}
                    fill={
                      active
                        ? 'var(--tactile-yellow)'
                        : isFixed
                          ? 'var(--status-good)'
                          : iss.status === 'acknowledged'
                            ? 'var(--status-amber)'
                            : 'var(--status-red)'
                    }
                    stroke="var(--bg-surface)"
                    strokeWidth="2.5"
                  />
                  <text
                    x="0"
                    y="4.5"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="800"
                    fill={active ? 'var(--tactile-yellow-ink)' : '#ffffff'}
                    className="font-mono-tabular"
                  >
                    {iss.severity}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ROUTE MODE: Red dashed standard vs Green solid+white-dots accessible */}
        {mapMode === 'route' && (
          <g>
            {/* Other Stations in City (Tappable subtle pills) */}
            {places
              .filter((p) => p.id !== selectedPlace.id)
              .map((p) => (
                <g
                  key={`other-${p.id}`}
                  transform={`translate(${p.map_pos.x}, ${p.map_pos.y})`}
                  onClick={() => onSelectPlace?.(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectPlace?.(p.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={localizePlaceName(p.name, language)}
                  className="cursor-pointer"
                >
                  <circle
                    r="8"
                    fill="var(--bg-surface)"
                    stroke="var(--ink-secondary)"
                    strokeWidth="2"
                  />
                  <rect
                    x="-46"
                    y="12"
                    width="92"
                    height="18"
                    rx="9"
                    fill="var(--bg-surface)"
                    stroke="var(--border-line)"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="24"
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="700"
                    fill="var(--ink-primary)"
                  >
                    {localizePlaceName(p.name, language).split(' ').slice(0, 2).join(' ')}
                  </text>
                </g>
              ))}

            {/* Standard Route (Red dashed) */}
            {standardRoute && standardRoute.points.length > 1 && (
              <g>
                <path
                  d={pointsToPath(standardRoute.points)}
                  fill="none"
                  stroke="var(--bg-surface)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d={pointsToPath(standardRoute.points)}
                  fill="none"
                  stroke="var(--status-red)"
                  strokeWidth="4.5"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                />
                {/* "! N steps" callout pill */}
                {standardRoute.stairs_count > 0 && (
                  <g transform={`translate(${stdMid.x - 16}, ${stdMid.y - 24})`}>
                    <rect
                      x="-46"
                      y="-13"
                      width="92"
                      height="24"
                      rx="12"
                      fill="var(--bg-surface)"
                      stroke="var(--status-red)"
                      strokeWidth="1.2"
                    />
                    <circle cx="-32" cy="-1" r="7" fill="var(--status-red)" />
                    <text
                      x="-32"
                      y="2.5"
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="800"
                      fill="#ffffff"
                    >
                      !
                    </text>
                    <text
                      x="8"
                      y="2.5"
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fill="var(--ink-primary)"
                    >
                      {standardRoute.stairs_count} {t.mapCalloutSteps}
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* Accessible Route (Thick green with white dotted center, or yellow tactile halo for blind) */}
            {accessibleRoute && accessibleRoute.points.length > 1 && (
              <g>
                {mode === 'blind' && (
                  <path
                    d={pointsToPath(accessibleRoute.points)}
                    fill="none"
                    stroke="var(--tactile-yellow)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.45"
                  />
                )}
                <path
                  d={pointsToPath(accessibleRoute.points)}
                  fill="none"
                  stroke="var(--status-good)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={pointsToPath(accessibleRoute.points)}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.4"
                  strokeDasharray="2 7"
                  strokeLinecap="round"
                />

                {/* "✓ Ramp + lift" or "✓ Tactile path" callout pill */}
                <g transform={`translate(${accMid.x + 28}, ${accMid.y + 26})`}>
                  <rect
                    x="-54"
                    y="-12"
                    width="108"
                    height="24"
                    rx="12"
                    fill="var(--bg-surface)"
                    stroke="var(--status-good)"
                    strokeWidth="1.2"
                  />
                  <circle cx="-39" cy="0" r="7" fill="var(--status-good)" />
                  <text
                    x="-39"
                    y="3"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="800"
                    fill="#ffffff"
                  >
                    ✓
                  </text>
                  <text
                    x="10"
                    y="3"
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="700"
                    fill="var(--ink-primary)"
                  >
                    {accessibleCallout}
                  </text>
                </g>
              </g>
            )}

            {/* Origin Beacon ("Current location") */}
            <g transform={`translate(${originPoint.x}, ${originPoint.y})`}>
              <circle r="16" fill="var(--ink-primary)" opacity="0.14" />
              <circle r="8.5" fill="var(--bg-surface)" />
              <circle r="5.5" fill="var(--ink-primary)" />
              <g transform="translate(0, 22)">
                <rect
                  x="-48"
                  y="-9"
                  width="96"
                  height="18"
                  rx="9"
                  fill="var(--bg-surface)"
                  stroke="var(--border-line)"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="700"
                  fill="var(--ink-primary)"
                >
                  {layout.originLabel[language]}
                </text>
              </g>
            </g>

            {/* Destination Red Google-Maps-Style Drop Pin (Tappable to open Station Gates) */}
            <g
              transform={`translate(${destPoint.x}, ${destPoint.y})`}
              onClick={() => onSelectPlace?.(selectedPlace.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPlace?.(selectedPlace.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={localizePlaceName(selectedPlace.name, language)}
              className="cursor-pointer"
            >
              <path
                d="M 0 -2 C -9 -14 -13 -20 -13 -26 A 13 13 0 1 1 13 -26 C 13 -20 9 -14 0 -2 Z"
                fill="var(--status-red)"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle cx="0" cy="-26" r="4.5" fill="#ffffff" />
            </g>
          </g>
        )}

        {/* PLACE MODE: Zoomed Station Footprint + Numbered Gate Circles (1, 2, 3) */}
        {mapMode === 'place' && (
          <g transform={`translate(${selectedPlace.map_pos.x}, ${selectedPlace.map_pos.y})`}>
            {/* Station Building Footprint */}
            <rect
              x="-88"
              y="-44"
              width="176"
              height="52"
              rx="10"
              fill="var(--map-block)"
              stroke="var(--ink-secondary)"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="-15"
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="800"
              letterSpacing="0.4"
              fill="var(--ink-primary)"
            >
              {localizePlaceName(selectedPlace.name, language).toUpperCase().slice(0, 26)}
            </text>

            {/* Gate Pins (1, 2, 3...) positioned neatly along the front edge like screenshot */}
            {selectedPlace.gates.map((gate, idx) => {
              const total = selectedPlace.gates.length;
              const spacing = total === 1 ? 0 : total === 2 ? 76 : 56;
              const gx = (idx - (total - 1) / 2) * spacing;
              const gy = 14;
              const isSelected = gate.id === selectedGateId;
              const pinColor = getGateColor(gate.step_free);

              return (
                <g
                  key={gate.id}
                  transform={`translate(${gx}, ${gy})`}
                  onClick={() => onSelectGate?.(gate.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectGate?.(gate.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${idx + 1}. ${gate.name}`}
                  className="cursor-pointer"
                >
                  {isSelected && (
                    <circle r="18" fill="var(--tactile-yellow)" opacity="0.45" />
                  )}
                  <circle
                    r={isSelected ? 13 : 11}
                    fill={pinColor}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="800"
                    fill="#ffffff"
                    className="font-mono-tabular"
                  >
                    {idx + 1}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Floating Current Area Badge (Bottom-left on desktop, top-left safe spot on mobile) */}
      <div className="pointer-events-none absolute bottom-3 left-3 hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface)]/95 border border-[var(--border-line)] text-xs font-bold text-[var(--ink-primary)] shadow-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--status-good)]" aria-hidden="true" />
        <span>{layout.areaLabel[language]}</span>
      </div>

      {/* Floating Right Map Controls: Zoom + / - / Recenter */}
      <div
        className={`absolute right-3 ${controlsBottomOffsetClass} z-10 flex flex-col gap-2 transition-all`}
      >
        <button
          type="button"
          onClick={handleRecenter}
          aria-label={t.recenterMapLabel}
          title={t.recenterMapLabel}
          className="w-11 h-11 rounded-full bg-[var(--bg-surface)] border border-[var(--border-line)] text-[var(--ink-primary)] shadow-md flex items-center justify-center hover:bg-[var(--bg-subtle)]"
        >
          <LocateFixed className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="hidden sm:flex flex-col rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-line)] shadow-md overflow-hidden">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.6, +(z + 0.25).toFixed(2)))}
            aria-label={t.zoomInLabel}
            title={t.zoomInLabel}
            className="w-11 h-11 flex items-center justify-center text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)] border-b border-[var(--border-line)]"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.95, +(z - 0.25).toFixed(2)))}
            aria-label={t.zoomOutLabel}
            title={t.zoomOutLabel}
            className="w-11 h-11 flex items-center justify-center text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)]"
          >
            <Minus className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
