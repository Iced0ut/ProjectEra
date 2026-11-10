# ProjectEra

Original top-down city action sandbox **inspired by** public GraalOnline Era systems (weapons, jobs, gangs, cosmetics, vehicles) — **not** a copy of Era client code or proprietary assets.

## Highlights

- **GMap city**: 16×16 tiles, 2352×1008 px (147×63). Levels are 64×64 and the camera scrolls across them. Ground, walls, and roofs/canopies are separate layers, so you can walk under trees and eaves
- **Gun timing**: each family has damage, graze damage, freeze after a shot, bullet speed, reload time, and clip size
- **Jobs**: timed trash pickup, mining, and car assembly. Gralats, weapons, hats, and cars save locally in the browser
- Districts include Starter Area, Mercy Beach/West/East, Airport, Snow Resort, Spar Complex, Bank, Auction, Fashion Mall, Gun Point, and gang bases (GZ, Tachi, BH, BBZ, Lethal, Mafia / Pirate, Guerre, Neo)
- Subway warp pads between islands; walkable bridge across the channel
- **Weapon catalog** with melee, pistols, rifles, SMGs, LMGs, shotguns, snipers, launchers, staffs, exotics, grenades, and a shield
- **On-hit effects**: burn, poison, shock, slow, stun, lifesteal, knockback, heal, explode, guard DR
- **Beach digging**: Trochus and shell types, shovel shops, crab spawns, Wandi crab shells
- Populated with NPCs, citizens, and bots across both islands

## Play

```bash
npm install
npm run dev
```

## Controls

| Key | Action |
| --- | --- |
| WASD / Arrows | Move |
| Space | Attack |
| Q | Weapon ability |
| Shift | Dash |
| E | Talk / shop / job |
| 2 | Cycle owned weapons |
| Tab | Weapon loadout prompt |
| 1 | Eat food |
| I | Inventory |
| C | Chat |
| G | Gang |
| H | House |
| B | Bot census |
| V | Mount / car |
| R | Morph |
| U | Upload custom skin |
| M | Music |

## Shops

Talk to **Vendor Vee** (guns/grenades), **Simon** (melees), **Aria** (exotics/staffs), **Rico Motors** (cars), **Faye** / **Hiro Hats** (fashion).

## Desktop builds

```bash
npm run dist:win   # Windows .exe
npm run dist:mac   # macOS (run on a Mac)
```

## Audio

Bundled audio is original. Decompiled Era client dumps are not used.
