/** Original district layout on the continent. Coordinates are project-defined, not a surveyed game map. */

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
 * West of the river is Northridge. East of the river is Southridge.
 * The river itself is the channel, crossed on foot at the bridges.
 */
export const DISTRICTS: DistrictDef[] = [
  { id: 'airport', name: 'Airport', region: 'northridge', x: 62, y: 28, w: 36, h: 16, noPk: true, blurb: 'North airport grounds.' },
  { id: 'parkland', name: 'North Parks', region: 'northridge', x: 112, y: 24, w: 40, h: 16, noPk: true, blurb: 'Open parkland.' },
  { id: 'snow_resort', name: 'Snow Resort', region: 'northridge', x: 168, y: 26, w: 40, h: 16, noPk: true, blurb: 'Winter slopes and lodge.' },
  { id: 'box_factory', name: 'Box Factory Zone', region: 'northridge', x: 148, y: 48, w: 18, h: 12, gangBase: true, blurb: 'Box Factory base.' },
  { id: 'skate_park', name: 'Skate Park', region: 'northridge', x: 112, y: 52, w: 22, h: 14, blurb: 'Skate arena.' },
  { id: 'water_park', name: 'Water Park', region: 'northridge', x: 64, y: 70, w: 24, h: 16, noPk: true, blurb: 'Water park.' },
  { id: 'mafia', name: 'Mafia Zone', region: 'northridge', x: 112, y: 74, w: 22, h: 14, gangBase: true, blurb: 'Mafia base.' },
  { id: 'lethal', name: 'Lethal', region: 'northridge', x: 140, y: 72, w: 22, h: 14, gangBase: true, blurb: 'Lethal base.' },
  { id: 'tachi', name: 'Tachi Zone', region: 'northridge', x: 168, y: 78, w: 24, h: 14, gangBase: true, blurb: 'Tachi base.' },
  { id: 'spar_complex', name: 'Spar Complex', region: 'northridge', x: 96, y: 100, w: 28, h: 16, blurb: 'Duels and spar bots.' },
  { id: 'power_plant', name: 'Power Plant', region: 'northridge', x: 64, y: 108, w: 22, h: 14, blurb: 'Industrial edge.' },
  { id: 'gz', name: 'Gangster Zone', region: 'northridge', x: 128, y: 108, w: 18, h: 14, gangBase: true, blurb: 'Gangster Zone base.' },
  { id: 'hotel_row', name: 'Hotel Row', region: 'northridge', x: 150, y: 104, w: 22, h: 12, noPk: true, blurb: 'Hotels.' },
  { id: 'fashion_mall', name: 'Fashion Mall', region: 'northridge', x: 176, y: 96, w: 26, h: 14, noPk: true, blurb: 'Hats and clothing.' },
  { id: 'event_house', name: 'Event House', region: 'northridge', x: 198, y: 116, w: 22, h: 12, noPk: true, blurb: 'Events lobby.' },
  { id: 'car_row', name: 'Auto Mile', region: 'northridge', x: 150, y: 122, w: 20, h: 12, blurb: 'Cars and boards.' },
  { id: 'bbz', name: 'Blazian Bandits Zone', region: 'northridge', x: 78, y: 136, w: 18, h: 16, gangBase: true, blurb: 'Blazian Bandits base.' },
  { id: 'auction', name: 'Auction House', region: 'northridge', x: 96, y: 136, w: 26, h: 14, noPk: true, blurb: 'Safe trade lobby.' },
  { id: 'gun_row', name: 'Gun Point', region: 'northridge', x: 128, y: 136, w: 24, h: 12, blurb: 'Firearms and melee.' },
  { id: 'downtown', name: 'Downtown', region: 'northridge', x: 172, y: 136, w: 46, h: 32, noPk: true, blurb: 'Shops and police.' },
  { id: 'start_park', name: 'Starter Area', region: 'northridge', x: 184, y: 146, w: 22, h: 14, noPk: true, blurb: 'Spawn plaza. Not the beach.' },
  { id: 'bank', name: 'Era Bank', region: 'northridge', x: 222, y: 150, w: 16, h: 14, gangBase: true, blurb: 'Era Bank. Base name, not a surveyed owner.' },
  { id: 'blackholst', name: 'Blackholst Zone', region: 'northridge', x: 128, y: 156, w: 20, h: 14, gangBase: true, blurb: 'Blackholst base.' },
  { id: 'mercy_west', name: 'Mercy West', region: 'northridge', x: 100, y: 160, w: 22, h: 12, noPk: true, blurb: 'West hospital.' },
  { id: 'subway', name: 'Subway', region: 'northridge', x: 156, y: 172, w: 14, h: 8, noPk: true, blurb: 'Warp pad.' },
  { id: 'harbour', name: 'Harbour', region: 'northridge', x: 176, y: 172, w: 28, h: 12, noPk: true, blurb: 'Docks and shell shops.' },
  { id: 'mercy_east', name: 'Mercy East', region: 'northridge', x: 222, y: 118, w: 16, h: 12, noPk: true, blurb: 'East hospital.' },
  { id: 'mercy_beach', name: 'Mercy Beach', region: 'northridge', x: 156, y: 186, w: 70, h: 14, noPk: true, blurb: 'Shell digging sand on the south shore.' },
  { id: 'bridge', name: 'Southridge Bridge', region: 'channel', x: 240, y: 144, w: 28, h: 10, noPk: true, blurb: 'South bridge across the river.' },

  { id: 'south_mines', name: 'South Mines', region: 'southridge', x: 330, y: 96, w: 32, h: 22, blurb: 'Mine shafts.' },
  { id: 'cave_coast', name: 'Cave Coast', region: 'southridge', x: 300, y: 112, w: 20, h: 14, blurb: 'Cave entrance.' },
  { id: 'southridge', name: 'Southridge Town', region: 'southridge', x: 276, y: 140, w: 42, h: 26, noPk: true, blurb: 'Eastern town.' },
  { id: 'south_hospital', name: 'South Hospital', region: 'southridge', x: 286, y: 148, w: 16, h: 12, noPk: true, blurb: 'Hospital and pizza.' },
  { id: 'neo', name: 'Neo Zone', region: 'southridge', x: 330, y: 168, w: 22, h: 14, gangBase: true, blurb: 'Neo base.' },
  { id: 'pirate_zone', name: 'Pirate Zone', region: 'southridge', x: 300, y: 170, w: 22, h: 14, gangBase: true, blurb: 'Pirate base.' },
  { id: 'guerre', name: 'Guerre Zone', region: 'southridge', x: 268, y: 176, w: 24, h: 14, gangBase: true, blurb: 'Guerre base.' },
  { id: 'south_beach', name: 'South Beach', region: 'southridge', x: 276, y: 198, w: 60, h: 14, noPk: true, blurb: 'Eastern sand.' },
];

export function districtById(id: DistrictId): DistrictDef {
  const found = DISTRICTS.find((d) => d.id === id);
  if (!found) throw new Error(`Missing district ${id}`);
  return found;
}

export function districtAt(tx: number, ty: number): DistrictDef | null {
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
  if (tx >= 240 && tx < 270) return 'channel';
  if (tx >= 270) return 'southridge';
  return 'northridge';
}
