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
 * Coordinates are in tiles on the big city grid.
 * Northridge occupies the north landmass; a water channel + bridge
 * connect to Southridge island in the south.
 */
export const DISTRICTS: DistrictDef[] = [
  // ---- Northridge core ----
  { id: 'start_park', name: 'Starter Area', region: 'northridge', x: 68, y: 70, w: 24, h: 18, noPk: true, blurb: 'Player spawn plaza — safe hub (not the beach).' },
  { id: 'downtown', name: 'Downtown', region: 'northridge', x: 60, y: 55, w: 40, h: 40, noPk: true, blurb: 'Shops, FoodMart, police.' },
  { id: 'hotel_row', name: 'Era Hotel Row', region: 'northridge', x: 55, y: 48, w: 20, h: 12, noPk: true, blurb: 'Hotels and Astro Bar.' },
  { id: 'fashion_mall', name: 'Fashion Mall', region: 'northridge', x: 82, y: 48, w: 22, h: 14, noPk: true, blurb: 'Hats, bodies, clothing.' },
  { id: 'gun_row', name: 'Gun Point Row', region: 'northridge', x: 48, y: 60, w: 16, h: 16, noPk: true, blurb: 'Firearms and melee shops.' },
  { id: 'car_row', name: 'Rico Auto Mile', region: 'northridge', x: 100, y: 62, w: 18, h: 14, noPk: true, blurb: 'Cars and skateboards.' },
  { id: 'auction', name: 'Auction House', region: 'northridge', x: 42, y: 78, w: 16, h: 12, noPk: true, blurb: 'Always-safe trading lobby.' },
  { id: 'bank', name: 'City Bank', region: 'northridge', x: 88, y: 78, w: 14, h: 12, gangBase: true, blurb: 'Contested bank income node.' },
  { id: 'event_house', name: 'Event House', region: 'northridge', x: 70, y: 40, w: 18, h: 12, noPk: true, blurb: 'Mini-events lobby.' },
  { id: 'spar_complex', name: 'Spar Complex', region: 'northridge', x: 110, y: 40, w: 28, h: 20, blurb: 'Duels and spar bots.' },
  { id: 'skate_park', name: 'Bam Skate Park', region: 'northridge', x: 30, y: 48, w: 16, h: 14, noPk: true, blurb: 'Skate arena.' },
  { id: 'subway', name: 'Ebizou Subway', region: 'northridge', x: 72, y: 92, w: 16, h: 10, noPk: true, blurb: 'Central subway pond.' },

  // Hospitals / beach
  { id: 'mercy_west', name: 'Mercy West Hospital', region: 'northridge', x: 28, y: 72, w: 18, h: 14, noPk: true, blurb: 'West medical + park.' },
  { id: 'mercy_east', name: 'Mercy East Hospital', region: 'northridge', x: 108, y: 72, w: 18, h: 14, noPk: true, blurb: 'East hospital and park.' },
  { id: 'mercy_beach', name: 'Mercy Beach', region: 'northridge', x: 8, y: 95, w: 40, h: 22, noPk: true, blurb: 'Shell digging shores.' },
  { id: 'harbour', name: 'North Harbour', region: 'northridge', x: 48, y: 100, w: 24, h: 14, noPk: true, blurb: 'Docks and shell shops.' },

  // North landmarks
  { id: 'airport', name: 'Air Asia Airport', region: 'northridge', x: 10, y: 20, w: 32, h: 22, noPk: true, blurb: 'North airport grounds.' },
  { id: 'snow_resort', name: 'Snow Resort', region: 'northridge', x: 110, y: 8, w: 36, h: 24, noPk: true, blurb: 'Winter slopes and lodge.' },
  { id: 'water_park', name: 'Water Park', region: 'northridge', x: 20, y: 35, w: 22, h: 16, noPk: true, blurb: 'Snapshot water park.' },
  { id: 'power_plant', name: 'Power Plant', region: 'northridge', x: 130, y: 70, w: 20, h: 16, blurb: 'Industrial edge.' },

  // Northridge gang bases
  { id: 'gz', name: 'Gangster Zone', region: 'northridge', x: 8, y: 55, w: 18, h: 16, gangBase: true, blurb: 'GZ base.' },
  { id: 'tachi', name: 'Tachi Zone', region: 'northridge', x: 130, y: 30, w: 18, h: 16, gangBase: true, blurb: 'Tachi base.' },
  { id: 'blackholst', name: 'Blackholst Zone', region: 'northridge', x: 20, y: 85, w: 18, h: 14, gangBase: true, blurb: 'BH base near west.' },
  { id: 'bbz', name: 'Blazian Bandits', region: 'northridge', x: 120, y: 95, w: 20, h: 14, gangBase: true, blurb: 'BBZ base + mines.' },
  { id: 'lethal', name: 'Lethal Securities', region: 'northridge', x: 95, y: 28, w: 16, h: 14, gangBase: true, blurb: 'Lethal base.' },
  { id: 'mafia', name: 'Mafia Zone', region: 'northridge', x: 40, y: 28, w: 16, h: 14, gangBase: true, blurb: 'Mafia base.' },

  // Channel
  { id: 'bridge', name: 'Southridge Bridge', region: 'channel', x: 70, y: 118, w: 20, h: 16, noPk: true, blurb: 'Bridge to Southridge Island.' },

  // ---- Southridge ----
  { id: 'southridge', name: 'Southridge Town', region: 'southridge', x: 55, y: 145, w: 50, h: 30, noPk: true, blurb: 'South island town center.' },
  { id: 'south_hospital', name: 'Southridge Hospital', region: 'southridge', x: 70, y: 150, w: 16, h: 12, noPk: true, blurb: 'Island hospital + pizza.' },
  { id: 'south_mines', name: 'Southridge Mines', region: 'southridge', x: 30, y: 150, w: 22, h: 18, blurb: 'Mine shafts and quests.' },
  { id: 'pirate_zone', name: 'Pirate Zone', region: 'southridge', x: 105, y: 155, w: 22, h: 18, gangBase: true, blurb: 'PZ gang base.' },
  { id: 'guerre', name: 'Guerre Zone', region: 'southridge', x: 40, y: 175, w: 22, h: 16, gangBase: true, blurb: 'Guerre base + dangerous mines.' },
  { id: 'neo', name: 'Neo Zone', region: 'southridge', x: 95, y: 175, w: 22, h: 16, gangBase: true, blurb: 'Neo gang base.' },
  { id: 'south_beach', name: 'Southridge Beach', region: 'southridge', x: 55, y: 185, w: 40, h: 18, noPk: true, blurb: 'Southern shelling sands.' },
  { id: 'cave_coast', name: 'Cave Coast', region: 'southridge', x: 20, y: 175, w: 18, h: 20, blurb: 'Mysterious cave entrance.' },
  { id: 'parkland', name: 'North Parks', region: 'northridge', x: 60, y: 10, w: 40, h: 20, noPk: true, blurb: 'Open parkland north of downtown.' },
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

export function regionAt(ty: number): 'northridge' | 'channel' | 'southridge' {
  if (ty < 118) return 'northridge';
  if (ty < 134) return 'channel';
  return 'southridge';
}
