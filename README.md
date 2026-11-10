# ProjectEra

Original top-down city action sandbox inspired by the *feel* of classic Graal-style online districts — **not** a copy of GraalOnline Era, and **not** built from decompiled Era client code or assets.

## Play

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Desktop builds (Windows EXE + macOS)

```bash
# Windows portable .exe + installer (run on Windows or Linux CI)
npm run dist:win

# macOS .dmg + .zip (must run on macOS)
npm run dist:mac

# Both targets when your machine/CI supports them
npm run dist
```

Artifacts land in `release/`:

- `ProjectEra-*-Windows-Portable.exe`
- Windows NSIS installer
- `ProjectEra-*-macOS-*.dmg` / `.zip` (macOS build host required)

## Controls

| Key | Action |
| --- | --- |
| WASD / Arrows | Move |
| Space | Attack |
| Shift | Dash |
| E | Interact / jobs |
| 1 | Eat food |
| I | Inventory / jobs panel |
| C | Chat |
| G | Gang |
| H | House |
| M | Restart city music |

## Audio

All bundled music/SFX under `public/audio/` are **original** files for ProjectEra. Proprietary Era client audio cannot be included.
