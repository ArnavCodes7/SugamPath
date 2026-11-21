import type { NetworkGeoJson, PlaceRow } from './accessibility-types';
import { placeScore, type BarrierInfo } from './campusRouter';
import type { Place, PlaceType } from '../types/sugampath';

const TYPE_MAP: Partial<Record<PlaceRow['place_type'], PlaceType>> = {
  hospital: 'hospital',
  college: 'college',
  commercial: 'market',
};

export const CAMPUS_NAME = 'Thapar University, Patiala';

/**
 * Adapts a Supabase places_list() row to the app-wide Place shape.
 * Scores are computed from the real path segments + barriers around the place (never invented);
 * there are no gates/buses on campus, so those lists stay empty.
 */
export function placeRowToPlace(
  p: PlaceRow,
  network: NetworkGeoJson | null,
  barriers: Map<number, BarrierInfo>
): Place {
  return {
    id: p.external_id,
    city: 'patiala',
    city_name: CAMPUS_NAME,
    type: TYPE_MAP[p.place_type] ?? 'college',
    name: p.name,
    name_hi: p.name,
    name_pa: p.name,
    address: CAMPUS_NAME,
    lat: p.lat,
    lng: p.lon,
    map_pos: { x: 0, y: 0 },
    score_wheelchair: placeScore(network, barriers, p.lon, p.lat, 'wheelchair'),
    score_blind: placeScore(network, barriers, p.lon, p.lat, 'blind'),
    score_walker: placeScore(network, barriers, p.lon, p.lat, 'walker'),
    confidence: p.confidence ?? 0,
    label: 'ai_estimate',
    source: 'AI estimate',
    last_audited_at: '',
    summary: '',
    gates: [],
    nearby_buses: [],
    reviews: [],
  };
}
