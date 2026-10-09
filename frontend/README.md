# Ice Age Lord — frontend demo v0.1

This directory is a **standalone visual prototype**. It does not load, write, or mutate the simulation, save files, extracted event catalogs, sealed loot, or source registries. Displayed inventory counts, building footprints and example task entries are deliberately **mock UI data**, not an LL01 campaign checkpoint.

## Run locally

Requires Node.js 20.19+ (or 22.12+) and npm.

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. For a production static build run `npm run build` then `npm run preview`.

## Try the demo

- Switch between Tổng quan, Lãnh địa, Bản đồ, Kho vật phẩm, Quân lực, Công trình, Nhật ký.
- Pan/zoom the illustrated map; click Lửa Trại, Nhà Lãnh Chúa, Ngôi Mộ and Hòm Vật Tư to inspect demo descriptions.
- Toggle the preview fog overlay. This changes **display state only** and discloses no actual hidden sites.
- Search/filter inventory and select an item to inspect its demo presentation.
- Inspect building and force mockups and use the responsive mobile sidebar.

## Boundaries

- Fixed protagonist: Lí Lan, Tử Phục Linh Sư SSS.
- Opening presentation: T0, 07:00; no fabricated T0 progression, discovered lairs, recruited heroes, learned recipes, or purchased goods.
- All inventory quantities and UI tasks are explicitly labeled illustrative.
- The map coordinates/geometry are a composition prototype, **not** the canonical world package; real site positions must come from a future filtered map projection.
- UI elements labeled `Chưa kết nối` are not gameplay buttons.
- Zero API calls, server writes, random reward generation or local-save side effects.
- The current map uses a lightweight SVG scene to review art direction and interaction first. Replace its renderer with PixiJS + atlas textures when canonical chunk/terrain data and camera contract are ready; keep the component input contract.

## Integration contract (future work, NOT part of this demo)

Create a read-only `PlayerView` projection with `version`, `worldTime`, `visibleMap`, `inventory`, `units`, `buildings` and `notifications`. Apply knowledge filtering in the runtime **before** serialization. No frontend access to hidden seed coordinates, chest rewards, unobserved actor positions or future events. Actions should be validated by the deterministic engine and return immutable receipts; demo does not impersonate the engine.

The extraction workstream owns `data/`, `research/`, `references/` and `design/`. This frontend lives exclusively in `frontend/` on branch `frontend/demo-ui-v0`.
