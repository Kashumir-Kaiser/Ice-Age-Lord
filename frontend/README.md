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
- Fog is **always on**: drag beyond observed cells into progressively darker whiteout and finally opaque black. Select **Xem khảo sát mẫu** to inspect fabricated preview-only timber, stone, ore, herb, ice and chest sites, including sample remaining quantities. The real pre-seeded chests are never sent to this display.
- Search/filter inventory and select an item to inspect its demo presentation.
- Inspect building and force mockups and use the responsive mobile sidebar.

## Boundaries

- Fixed protagonist: Lí Lan, Tử Phục Linh Sư SSS.
- Opening presentation: T0, 07:00; no fabricated T0 progression, discovered lairs, recruited heroes, learned recipes, or purchased goods.
- All inventory quantities and UI tasks are explicitly labeled illustrative.
- The map coordinates/geometry are a composition prototype, **not** the canonical world package; real site positions must come from a future filtered map projection. Starting fire radius levels 1–30 and clock boundaries are read from the canonical rules, but level/time controls are **read-only visual scenarios**, not free upgrades or world-time advances.
- UI elements labeled `Chưa kết nối` are not gameplay buttons.
- Zero API calls, server writes, random reward generation or local-save side effects.
- The map uses a layered SVG winter terrain, source-radius warming perimeter, light phases, and strict marker-visibility gating to review art direction and interaction first. Replace its renderer with PixiJS + atlas textures when canonical chunk/terrain data and camera contract are ready; keep the component input contract.

## Integration contract (future work, NOT part of this demo)

Create a read-only `PlayerView` projection with `version`, `worldTime`, `visibleMap`, `inventory`, `units`, `buildings` and `notifications`. Apply knowledge filtering in the runtime **before** serialization. No frontend access to hidden seed coordinates, chest rewards, unobserved actor positions or future events. Actions should be validated by the deterministic engine and return immutable receipts; demo does not impersonate the engine.

The extraction workstream owns `data/`, `research/`, `references/` and `design/`. This frontend lives exclusively in `frontend/` on branch `frontend/demo-ui-v0`.
\n## Continuous integration\n\nPushes to `frontend/**` run the GitHub Actions Vite/TypeScript build and map/demo tests. `.github/workflows/frontend-demo.yml` also includes a daily `0 17 * * *` cron (midnight in Vietnam). **GitHub executes scheduled workflows only from the default branch**; because this project explicitly forbids touching `main` during prototype development, the midnight schedule is configured but cannot execute until a workflow is separately placed on the default branch. `workflow_dispatch` can be used meanwhile to test the frontend branch manually. Nothing is merged to `main`.\n