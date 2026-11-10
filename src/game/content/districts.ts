/** Original district layout inspired by public Era Northridge / Southridge maps. */

export type DistrictId =
  | 'start_park'
  | 'downtown'
  | 'mercy_west'
  | 'mercy_east'
  | 'mercy_beach'
  | 'airport'
  | 'snow_resort'
  | 'auction'
  | 'bank'
  | 'event_house'
  | 'spar_complex'
  | 'water_park'
  | 'power_plant'
  | 'hotel_row'
  | 'fashion_mall'
  | 'car_row'
  | 'gun_row'
  | 'skate_park'
  | 'subway'
  | 'gz'
  | 'tachi'
  | 'blackholst'
  | 'bbz'
  | 'box_factory'
  | 'lethal'
  | 'mafia'
  | 'bridge'
  | 'southridge'
  | 'pirate_zone'
  | 'guerre'
  | 'neo'
  | 'south_hospital'
  | 'south_mines'
  | 'south_beach'
  | 'cave_coast'
  | 'harbour'
  | 'parkland';

export interface DistrictDef {
  id: DistrictId;
  name: string;
  region: 'northridge' | 'southridge' | 'channel';
  x: number;
  y: number;
  w: number;
  h: number;
  noPk?: boolean;
  gangBase?: boolean;
  blurb: string;
}

/**
 * Provisional project layout on the 147×63 outdoor raster.
 * Coordinates are NOT surveyed Era originals. See era-world-spec.json.
 * West / left = Northridge. Center = channel. East / right = Southridge.
 */
export const DISTRICTS: DistrictDef[] = [
  { id: 'parkland', name: 'North Parks', region: 'northridge', x: 28, y: 1, w: 30, h: 12, noPk: true, blurb: 'Open parkland.' },
  { id: 'airport', name: 'Airport', region: 'northridge', x: 2, y: 1, w: 24, h: 12, noPk: true, blurb: 'North airport grounds.' },
  { id: 'snow_resort', name: 'Snow Resort', region: 'northridge', x: 60, y: 1, w: 34, h: 12, noPk: true, blurb: 'Winter slopes and lodge.' },
  { id: 'water_park', name: 'Water Park', region: 'northridge', x: 2, y: 14, w: 18, h: 12, noPk: true, blurb: 'Water park.' },
  { id: 'skate_park', name: 'Skate Park', region: 'northridge', x: 22, y: 14, w: 14, h: 12, noPk: true, blurb: 'Skate arena.' },
  { id: 'mafia', name: 'Mafia Zone', region: 'northridge', x: 38, y: 14, w: 14, h: 12, gangBase: true, blurb: 'Mafia base. Provisional footprint.' },
  { id: 'lethal', name: 'Lethal', region: 'northridge', x: 54, y: 14, w: 14, h: 12, gangBase: true, blurb: 'Lethal base. Provisional footprint.' },
  { id: 'tachi', name: 'Tachi Zone', region: 'northridge', x: 70, y: 14, w: 24, h: 12, gangBase: true, blurb: 'Tachi base. Provisional footprint.' },
  { id: 'box_factory', name: 'Box Factory Zone', region: 'northridge', x: 40, y: 4, w: 8, h: 6, gangBase: true, blurb: 'Box Factory base. Provisional footprint.' },
  { id: 'spar_complex', name: 'Spar Complex', region: 'northridge', x: 2, y: 28, w: 22, h: 12, blurb: 'Duels and spar bots.' },
  { id: 'hotel_row', name: 'Hotel Row', region: 'northridge', x: 26, y: 28, w: 16, h: 10, noPk: true, blurb: 'Hotels.' },
  { id: 'fashion_mall', name: 'Fashion Mall', region: 'northridge', x: 44, y: 28, w: 18, h: 10, noPk: true, blurb: 'Hats and clothing.' },
  { id: 'event_house', name: 'Event House', region: 'northridge', x: 64, y: 28, w: 16, h: 10, noPk: true, blurb: 'Events lobby.' },
  { id: 'gz', name: 'Gangster Zone', region: 'northridge', x: 82, y: 28, w: 12, h: 12, gangBase: true, blurb: 'Gangster Zone base. Provisional footprint.' },
  { id: 'auction', name: 'Auction House', region: 'northridge', x: 2, y: 42, w: 20, h: 10, noPk: true, blurb: 'Safe trade lobby.' },
  { id: 'gun_row', name: 'Gun Point', region: 'northridge', x: 24, y: 42, w: 14, h: 8, noPk: true, blurb: 'Firearms and melee.' },
  { id: 'downtown', name: 'Downtown', region: 'northridge', x: 40, y: 40, w: 28, h: 12, noPk: true, blurb: 'Shops and police.' },
  { id: 'start_park', name: 'Starter Area', region: 'northridge', x: 46, y: 42, w: 16, h: 8, noPk: true, blurb: 'Spawn plaza. Not the beach.' },
  { id: 'car_row', name: 'Auto Mile', region: 'northridge', x: 70, y: 40, w: 12, h: 8, noPk: true, blurb: 'Cars and boards.' },
  { id: 'mercy_east', name: 'Mercy East', region: 'northridge', x: 70, y: 50, w: 22, h: 6, noPk: true, blurb: 'East hospital.' },
  { id: 'bank', name: 'Era Bank', region: 'northridge', x: 70, y: 56, w: 14, h: 6, gangBase: true, blurb: 'Era Bank. Base name, not the current owner gang. Provisional footprint.' },
  { id: 'bbz', name: 'Blazian Bandits Zone', region: 'northridge', x: 84, y: 50, w: 10, h: 12, gangBase: true, blurb: 'Blazian Bandits base. Provisional footprint.' },
  { id: 'power_plant', name: 'Power Plant', region: 'northridge', x: 84, y: 40, w: 10, h: 8, blurb: 'Industrial edge.' },
  { id: 'mercy_west', name: 'Mercy West', region: 'northridge', x: 2, y: 54, w: 18, h: 8, noPk: true, blurb: 'West hospital.' },
  { id: 'blackholst', name: 'Blackholst Zone', region: 'northridge', x: 22, y: 52, w: 12, h: 10, gangBase: true, blurb: 'Blackholst base. Provisional footprint.' },
  { id: 'harbour', name: 'Harbour', region: 'northridge', x: 36, y: 54, w: 16, h: 8, noPk: true, blurb: 'Docks and shell shops.' },
  { id: 'mercy_beach', name: 'Mercy Beach', region: 'northridge', x: 52, y: 54, w: 16, h: 8, noPk: true, blurb: 'Shell digging sand.' },
  { id: 'subway', name: 'Subway', region: 'northridge', x: 46, y: 34, w: 10, h: 6, noPk: true, blurb: 'Warp pad.' },
  { id: 'bridge', name: 'Southridge Bridge', region: 'channel', x: 96, y: 26, w: 14, h: 10, noPk: true, blurb: 'Bridge to Southridge.' },

  { id: 'cave_coast', name: 'Cave Coast', region: 'southridge', x: 112, y: 2, w: 10, h: 12, blurb: 'Cave entrance.' },
  { id: 'southridge', name: 'Southridge Town', region: 'southridge', x: 124, y: 2, w: 20, h: 16, noPk: true, blurb: 'Island town.' },
  { id: 'south_hospital', name: 'South Hospital', region: 'southridge', x: 128, y: 6, w: 12, h: 8, noPk: true, blurb: 'Hospital and pizza.' },
  { id: 'south_mines', name: 'South Mines', region: 'southridge', x: 112, y: 16, w: 16, h: 14, blurb: 'Mine shafts.' },
  { id: 'pirate_zone', name: 'Pirate Zone', region: 'southridge', x: 130, y: 16, w: 14, h: 14, gangBase: true, blurb: 'Pirate base. Provisional footprint.' },
  { id: 'guerre', name: 'Guerre Zone', region: 'southridge', x: 112, y: 32, w: 16, h: 14, gangBase: true, blurb: 'Guerre base. Provisional footprint.' },
  { id: 'neo', name: 'Neo Zone', region: 'southridge', x: 130, y: 32, w: 14, h: 14, gangBase: true, blurb: 'Neo base. Provisional footprint.' },
  { id: 'south_beach', name: 'South Beach', region: 'southridge', x: 112, y: 48, w: 32, h: 12, noPk: true, blurb: 'Southern sand.' },
];

export function districtAt(tx: number, ty: number): DistrictDef | null {
  // Prefer smaller / more specific districts by checking gang/noPk overlays first via reverse order of specificity
  let best: DistrictDef | null = null;
  let bestArea = Number.POSITIVE_INFINITY;
  for (const d of DISTRICTS) {
    if (tx >= d.x && ty >= d.y && tx < d.x + d.w && ty < d.y + d.h) {
      const area = d.w * d.h;
      if (area < bestArea) {
        best = d;
        bestArea = area;
      }
    }
  }
  return best;
}

export function regionAt(tx: number): 'northridge' | 'channel' | 'southridge' {
  if (tx >= 112) return 'southridge';
  if (tx >= 96) return 'channel';
  return 'northridge';
}
