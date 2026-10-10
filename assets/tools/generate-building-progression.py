Warning: truncated output (original token count: 6763)
Total output lines: 291

"""Generate compact, editable SVG upgrade milestones for early settlement buildings.

Stages are presentation art only: each keeps the source building's canvas, anchor,
footprint and hit geometry. Runtime bodies link to the registered level-one SVG,
then add cumulative, hand-authored winter-ink details inside the same canvas.
"""
from __future__ import annotations

import copy
import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "assets" / "source" / "buildings"
PUBLIC = ROOT / "frontend" / "public" / "assets" / "buildings"
LEVELS = (6, 11, 16, 21, 26)
# At most 20% larger than the level-one art; the 480x400 SVG canvas and world
# footprint remain unchanged, so the game can scale the sprite without clipping.
SCALE_FACTORS = (1.04, 1.08, 1.12, 1.16, 1.20)
INK = "#343b43"
SNOW = "#e8e6dc"
WOOD = "#745d4c"
WOOD_LIGHT = "#9b8067"
STONE = "#68767d"
STONE_LIGHT = "#a6b1b3"
AMBER = "#edb76a"
GREEN = "#879876"

FAMILIES = [
    {"base":"lord-house-repaired","prefix":"lord-house","name":"Nhà Lãnh Chúa","kind":"lord","aliases":["lord-house-damaged","lord-house-repaired"]},
    {"base":"tomb-entry","prefix":"tomb-entry","name":"Cửa Mộ","kind":"tomb","aliases":["tomb-entry"]},
    {"base":"polar-farmhouse-l01","prefix":"polar-farmhouse","name":"Nhà Nông Phu Cực Địa","kind":"farm","aliases":["polar-farmhouse-l01"]},
    {"base":"opening-palisade-wall","prefix":"opening-palisade-wall","name":"Tường Rào","kind":"wall","aliases":["opening-palisade-wall"]},
    {"base":"opening-timber-gate","prefix":"opening-timber-gate","name":"Cổng Gỗ","kind":"gate","aliases":["opening-timber-gate"]},
    {"base":"opening-simple-heater","prefix":"opening-simple-heater","name":"Lò Sưởi Đơn Giản","kind":"heater","aliases":["opening-simple-heater"]},
    {"base":"opening-simple-kitchen","prefix":"opening-simple-kitchen","name":"Bếp Nấu Đơn Giản","kind":"kitchen","aliases":["opening-simple-kitchen"]},
    {"base":"opening-woodshop","prefix":"opening-woodshop","name":"Xưởng Gỗ","kind":"woodshop","aliases":["opening-woodshop"]},
    {"base":"opening-tailor","prefix":"opening-tailor","name":"Tiệm May","kind":"tailor","aliases":["opening-tailor"]},
    {"base":"opening-oreworks","prefix":"opening-oreworks","name":"Xưởng Quặng","kind":"oreworks","aliases":["opening-oreworks"]},
    {"base":"opening-forge","prefix":"opening-forge","name":"Lò Rèn","kind":"forge","aliases":["opening-forge"]},
    {"base":"opening-medical-station","prefix":"opening-medical-station","name":"Trạm Y Tế","kind":"medical","aliases":["opening-medical-station"]},
    {"base":"opening-small-shelter","prefix":"opening-small-shelter","name":"Lều Trú Ẩn","kind":"shelter","aliases":["opening-small-shelter"]},
]


def group(contents: str, *, width: float = 3.0) -> str:
    return f'<g stroke="{INK}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round">{contents}</g>'


def dormer(x: int, y: int, w: int = 54) -> str:
    """A small timber dormer seated on the roof plane, with snow and a warm window."""
    m = x + w // 2
    return group(
        f'<path d="M{x+6},{y+35}V{y+19}L{m},{y+2}L{x+w-6},{y+19}V{y+35}Z" fill="{WOOD}"/>'
        f'<path d="M{x},{y+20}L{m},{y-1}L{x+w},{y+20}L{x+w-5},{y+26}L{m},{y+7}L{x+5},{y+26}Z" fill="#53616a"/>'
        f'<path d="M{x-1},{y+19}Q{m-10},{y-3} {m},{y-2}Q{m+10},{y-3} {x+w+1},{y+19}" fill="none" stroke="{SNOW}" stroke-width="5"/>'
        f'<rect x="{m-8}" y="{y+23}" width="16" height="12" rx="1" fill="{AMBER}" stroke="#55463d" stroke-width="2"/>'
        f'<path d="M{m},{y+23}v12 M{m-8},{y+29}h16" fill="none" stroke="#55463d" stroke-width="1.5"/>', width=2.5)


def window(x: int, y: int, w: int = 18, h: int = 23, color: str = AMBER) -> str:
    return group(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" fill="#302e2d" stroke="{SNOW}" stroke-width="2.5"/>'
        f'<rect x="{x+3}" y="{y+3}" width="{w-6}" height="{h-6}" fill="{color}" stroke="#594d43" stroke-width="1.5"/>'
        f'<path d="M{x+w/2},{y+3}v{h-6} M{x+3},{y+h/2}h{w-6}" fill="none" stroke="#594d43" stroke-width="1.5"/>', width=2)


def pennant(x: int, y: int, color: str = "#925c50", direction: int = 1) -> str:
    return group(
        f'<path d="M{x},{y+63}V{y}m0,5 {29*direction},4 {-24*direction},14 {24*direction},5 {-29*direction},16" fill="none" stroke="#463f3b" stroke-width="3"/>'
        f'<path d="M{x+2},{y+5}l{24*direction},4 {-19*direction},12Z" fill="{color}" stroke="{INK}" stroke-width="1.5"/>'
        f'<path d="M{x+4},{y+8}l{15*direction},3 {-11*direction},7Z" fill="#c58c70" opacity=".86"/>', width=2)


def chimney(x: int, y: int, w: int = 32, h: int = 62, stone: bool = True) -> str:
    fill = STONE if stone else WOOD
    return group(
        f'<path d="M{x+5},{y+h}V{y+10}h{w-10}v{h-10}Z" fill="{fill}"/>'
        f'<path d="M{x},{y+11}h{w}v9H{x}Z" fill="#4b5760"/>'
        f'<path d="M{x-2},{y+9}h{w+4}" fill="none" stroke="{SNOW}" stroke-width="5"/>'
        f'<path d="M{x+9},{y+29}h{w-18} M{x+9},{y+43}h{w-18}" fill="none" stroke="{STONE_LIGHT}" stroke-width="1.8" opacity=".75"/>', width=2.5)


def lamp(x: int, y: int, scale: float = 1) -> str:
    w, h = 18*scale, 25*scale
    return group(
        f'<path d="M{x+9*scale},{y+40*scale}V{y+15*scale}" fill="none" stroke="#4c4642" stroke-width="3"/>'
        f'<path d="M{x+2*scale},{y+15*scale}h{14*scale}l{-2*scale},{h}h{-10*scale}Z" fill="#414c53" stroke="{INK}" stroke-width="2"/>'
        f'<path d="M{x+5*scale},{y+18*scale}h{8*scale}l{-1*scale},{h-7*scale}h{-6*scale}Z" fill="{AMBER}" stroke="#57473d" stroke-width="1.5"/>'
        f'<path d="M{x},{y+13*scale}h{w}" fill="none" stroke="{SNOW}" stroke-width="3"/>', width=2)


def roof_window(x: int, y: int, w: int = 38, h: int = 27) -> str:
    """A glazed opening fitted flush to an existing sloped roof plane."""
    return group(
        f'<path d="M{x},{y}l{w},9 -6,{h+9} -{w},-9Z" fill="#43515a"/>'
        f'<path d="M{x+4},{y+4}l{w-9},8 -4,{h} -{w-9},-8Z" fill="#809395"/>'
        f'<path d="M{x+7},{y+7}l{w-15},7 -3,{h-3} -{w-15},-7Z" fill="#d2ae78"/>'
        f'<path d="M{x+4},{y+4}l{w-9},8 M{x+5},{y+16}l{w-8},7 M{x+14},{y+2}l-5,{h+8}" fill="none" stroke="#e4e0d4" stroke-width="2.2"/>',
        width=2.3,
    )


def stage_art(kind: str, tier: int) -> str:
    """Cumulative improvements stay attached to each base silhouette."""
    drawings: dict[str, list[str]] = {
        "farm": [
            group('<path d="M318,187l10,-8 M383,205l9,7 M323,201v34 M383,213v31" fill="none" stroke="#57483e" stroke-width="4"/><path d="M319,190q30,-9 66,8" fill="none" stroke="#e8e6dc" stroke-width="4"/>', width=2),
            roof_window(257, 101, 39, 26),
            group('<path d="M317,184l24,-12h44l13,13 M318,187q35,-7 78,1v33l-57,-11Z" fill="#66777a" fill-opacity=".54"/><path d="M326,187v25 M348,179v38 M370,178v42 M320,199l72,13" fill="none" stroke="#d5dfd7" stroke-width="2.3"/><path d="M316,182l25,-14h44" fill="none" stroke="#eee9dd" stroke-width="4"/>', width=2),
            group('<path d="M128,63h37 M128,75h37 M128,87h37 M128,99h37" fill="none" stroke="#b1b9b5" stroke-width="2"/><path d="M128,68h37" fill="none" stroke="#514b47" stroke-width="2"/>', width=2),
            group('<path d="M363,238v20m18,-17v19 M358,256q13,-7 29,0v12q-14,6-29,0Z" fill="none" stroke="#594a3d" stroke-width="3"/><path d="M360,258q12,-5 25,0" fill="none" stroke="#d1c8b8" stroke-width="2"/>', width=2),
        ],
        "lord": [
            group('<path d="M119,151l13,-13m-5,21 15,-14 M322,137l12,7m-2,-16 13,7" fill="none" stroke="#665346" stroke-width="3.5"/><path d="M120,148l12,-12m204,-8 11,6" fill="none" stroke="#d9d6cc" stroke-width="2"/>', width=2),
            pennant(141, 48, "#875449", -1),
            group('<path d="M229,35l10,-12 11,12 -3,8h-15Z" fill="#7c8584"/><path d="M228,35l11,-16 12,16" fill="none" stroke="#eee8db" stroke-width="4"/><path d="M239,25v13m-5,-6h10" fill="none" stroke="#c6965f" stroke-width="2.5"/>', width=2),
            group('<path d="M222,157l17,-8 17,8 -3,11h-28Z" fill="#5b6870"/><path d="M226,158l13,-6 13,6 M239,154v12m-6,-6h12" fill="none" stroke="#d8b17a" stroke-width="2.2"/>', width=2),
            pennant(343, 75, "#506e74"),
        ],
        "tomb": [
            group('<path d="M226,150l14,-8 14,8 M231,149l9,-5 9,5 M240,146v7m-4,-3h8" fill="none" stroke="#b99368" stroke-width="2.3"/>', width=2),
            lamp(158, 204, .75) + lamp(303, 204, .75),
            group('<path d="M218,222v-30a22,22 0 0 1 44,0v30 M226,219v-26a14,14 0 0 1 28,0v26" fill="none" stroke="#424b50" stroke-width="3"/><path d="M228,189v31 M239,183v39 M250,189v31" fill="none" stroke="#aab1af" stroke-width="2"/>', width=2),
            group('<path d="M186,199a54,54 0 0 1 108,0 M190,200a50,50 0 0 1 100,0" fill="none" stroke="#b3b8b2" stroke-width="2.5"/><path d="M191,183l7,4m85,-4 -7,4 M201,164l6,4m66,-4 -6,4" fill="none" stroke="#4d565a" stroke-width="2"/>', width=2),
            group('<path d="M238,209l7,6 -7,8 -7,-8Z" fill="#af7950"/><path d="M238,212l3,3 -3,4 -3,-4Z" fill="#edb76a"/><path d="M220,228h36" stroke="#797e78" stroke-width="2"/>', width=2),
        ],
        "wall": [
            group('<path d="M78,151L361,271 M77,171L362,291" fill="none" stroke="#664d3c" stroke-width="10"/><path d="M78,147L361,267" fill="none" stroke="#ddd9cc" stroke-width="3.5"/>', width=2),
            group('<path d="M111,158l-2,17m55,5 -2,17m55,4 -2,17m55,4 -2,17m55,4 -2,17" stroke="#48413d" stroke-width="5"/><path d="M110,159l5,2m49,21 6,2m49,21 6,2m48,21 6,2m48,21 6,2" stroke="#c19a6e" stroke-width="2"/>', width=2),
            group('<path d="M128,174l-9,20m64,-2 -9,20m64,-2 -9,20m64,-2 -9,20" fill="none" stroke="#745a43" stroke-width="5"/><path d="M120,193l9,-5m45,25 9,-5m45,25 9,-5m45,25 9,-5" fill="none" stroke="#c6ad8b" stroke-width="2.2"/>', width=2),
            group('<path d="M75,145L358,264" fill="none" stroke="#46525a" stro…1763 tokens truncated…ath d="M324,220h42v33h-42Z M320,217h50v7h-50Z" fill="#6c553f"/><path d="M330,228h30m-30,10h30m-30,10h30" stroke="#b59672" stroke-width="2"/>', width=2),
        ],
        "forge": [
            group('<path d="M295,53h37 M294,62h39 M293,71h41 M292,80h43" fill="none" stroke="#9ea9a8" stroke-width="2.2"/><path d="M292,56h43" stroke="#424f57" stroke-width="2"/>', width=2),
            group('<path d="M119,234h46 M124,244h41 M129,254h36 M128,228v34m29,-34v34" fill="none" stroke="#56473d" stroke-width="3"/><path d="M133,231l12,9 11,-9m-23,21h20" fill="none" stroke="#a9b0ad" stroke-width="2"/>', width=2),
            group('<path d="M211,163q10,-16 20,0 10,-16 20,0 10,-16 20,0" fill="none" stroke="#eea75b" stroke-width="3"/><path d="M221,153l-4,-9m24,8 2,-11m17,15 7,-8" stroke="#e8c187" stroke-width="2"/>', width=2),
            group('<path d="M210,156v63 M270,156v63 M210,156h60 M210,219h60" fill="none" stroke="#5c5149" stroke-width="3.5"/><path d="M215,161h50 M215,214h50" stroke="#a9b2b0" stroke-width="2"/>', width=2),
            group('<path d="M195,274l30,8m-19,-18 18,5m48,5 31,-8m-35,18 30,-8" fill="none" stroke="#59666d" stroke-width="3"/><path d="M199,271l24,6m50,2 23,-6" stroke="#e8e6dc" stroke-width="2"/>', width=2),
        ],
        "medical": [
            group('<path d="M163,204q14,-20 29,0t29,0t29,0t29,0" fill="none" stroke="#51473d" stroke-width="2.5"/><path d="M174,206v22m27,-22v20m29,-20v20m28,-20v21" stroke="#7f8f6d" stroke-width="3"/><path d="M173,218q-8,-5 -7,-11m35,17q9,-9 12,-15m16,14q-7,-9 -4,-17m28,16q8,-8 12,-14" fill="none" stroke="#8ba078" stroke-width="2"/>', width=2),
            group('<path d="M127,222l18,-18h32 M127,224h51 M132,224v31 M174,224v31" fill="#607178" fill-opacity=".46"/><path d="M125,221l20,-21h32" fill="none" stroke="#e8e6dc" stroke-width="4"/>', width=2),
            group('<path d="M281,139h24v28h-24Z" fill="#e5d8bf" stroke="#594a40" stroke-width="2"/><path d="M293,145v16m-8,-8h16" stroke="#9a5b4e" stroke-width="4"/>', width=2),
            group('<path d="M322,257h58 M327,253v19 M340,251v20 M353,251v20 M366,252v20" fill="none" stroke="#68533f" stroke-width="3"/><path d="M323,250q27,-7 56,0v8q-29,8-57,0Z" fill="#74866a"/><path d="M330,253v-15m12,15v-19m13,19v-16m12,16v-20" stroke="#93a87f" stroke-width="3"/>', width=2),
            group('<path d="M305,183l17,-7v43h-8v-31l-9,4Z" fill="#5d6e72" fill-opacity=".6"/><path d="M307,180l16,-7" stroke="#e8e6dc" stroke-width="4"/><path d="M313,185v27m6,-30v31" stroke="#c3d0c2" stroke-width="2"/>', width=2),
        ],
        "shelter": [
            group('<path d="M124,184l114,-99 115,99 M133,190l105,-92 107,92" fill="none" stroke="#66503e" stroke-width="2.5"/><path d="M130,185l108,-94 109,94" fill="none" stroke="#e8e6dc" stroke-width="3"/>', width=2),
            group('<path d="M126,194l66,-36 14,8 -68,41Z" fill="#6e5742"/><path d="M128,191l64,-36" stroke="#e8e6dc" stroke-width="4"/><path d="M138,205v37m49,-64v59" stroke="#58483b" stroke-width="3"/>', width=2),
            lamp(201, 195, .55),
            group('<path d="M285,185l45,35 -11,9 -44,-34Z" fill="#6b5946" fill-opacity=".8"/><path d="M282,183l46,35" stroke="#e8e6dc" stroke-width="3.5"/><path d="M324,218v35m-39,-50v51" stroke="#614d3d" stroke-width="3"/>', width=2),
            group('<path d="M184,254q51,-12 111,0v11q-58,13-111,0Z" fill="#7b624b"/><path d="M188,253q47,-10 102,0" fill="none" stroke="#e8e6dc" stroke-width="3"/><path d="M194,260h28m16,0h30" stroke="#be9a73" stroke-width="2.5"/>', width=2),
        ],
    }
    return drawings[kind][tier]

def render_svg(title: str, runtime_base_href: str, kind: str, through: int) -> str:
    label = escape(title, quote=True)
    additions = "\n".join(f'<g id="upgrade-{LEVELS[index]}">{stage_art(kind, index)}</g>' for index in range(through))
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 400" role="img" '
        f'aria-label="{label}">\n<title>{label}</title>\n'
        '<g id="painted-sprite" shape-rendering="geometricPrecision">\n'
        f'<use href="{runtime_base_href}#painted-sprite"/>\n'
        f'{additions}\n</g>\n</svg>\n'
    )


def write_runtime_exports(folder: Path, title: str, kind: str, base: str, through: int) -> dict:
    body = folder / "body.svg"
    body.write_text(render_svg(f"{title} · body", f"../{base}/body.svg", kind, through), encoding="utf-8")
    (folder / "base.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 400" role="img" aria-label="{escape(title, quote=True)} · footing"><title>{escape(title)} · footing</title><defs><clipPath id="ground-cut"><rect x="0" y="320" width="480" height="80"/></clipPath></defs><use href="body.svg#painted-sprite" clip-path="url(#ground-cut)"/></svg>\n', encoding="utf-8")
    (folder / "upper.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 400" role="img" aria-label="{escape(title, quote=True)} · upper"><title>{escape(title)} · upper</title><defs><clipPath id="upper-cut"><rect x="0" y="0" width="480" height="320"/></clipPath></defs><use href="body.svg#painted-sprite" clip-path="url(#upper-cut)"/></svg>\n', encoding="utf-8")
    (folder / "icon.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 400" role="img" aria-label="{escape(title, quote=True)} · icon"><title>{escape(title)} · icon</title><use href="body.svg#painted-sprite"/></svg>\n', encoding="utf-8")
    (folder / "shadow.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 400" role="img" aria-label="Bóng tiếp xúc · {escape(title, quote=True)}"><title>Bóng tiếp xúc · {escape(title)}</title><defs><radialGradient id="ground-shadow"><stop stop-color="#101820" stop-opacity=".42"/><stop offset=".68" stop-color="#101820" stop-opacity=".24"/><stop offset="1" stop-color="#101820" stop-opacity="0"/></radialGradient></defs><ellipse cx="240" cy="342" rx="190" ry="36" fill="url(#ground-shadow)"/></svg>\n', encoding="utf-8")
    runtime = f"/assets/buildings/{folder.name}"
    return {
        "uiIcon": f"{runtime}/icon.svg", "body": f"{runtime}/body.svg", "base": f"{runtime}/base.svg",
        "upper": f"{runtime}/upper.svg", "shadow": f"{runtime}/shadow.svg", "vfx": None,
    }


def main() -> None:
    manifest_path = ROOT / "assets" / "manifest.json"
    runtime_manifest_path = ROOT / "frontend" / "public" / "assets" / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    by_id = {asset["assetId"]: asset for asset in manifest["assets"]}
    old_stage_ids = {f"{family['prefix']}-l{level:02d}" for family in FAMILIES for level in LEVELS}
    manifest["assets"] = [asset for asset in manifest["assets"] if asset["assetId"] not in old_stage_ids]
    by_id = {asset["assetId"]: asset for asset in manifest["assets"]}
    manifest["buildingProgressions"] = [
        row for row in manifest.get("buildingProgressions", [])
        if not set(row.get("baseAssetIds", [])) & {alias for family in FAMILIES for alias in family["aliases"]}
    ]
    new_assets = []

    for family in FAMILIES:
        base_id = family["base"]
        base = by_id[base_id]
        progression_stages = [{"minLevel": 1, "maxLevel": 5, "assetId": base_id}]
        base_scale = float(base.get("presentationScale", 1))
        source_base_href = f"../../../frontend/public/assets/buildings/{base_id}/body.svg"

        for index, level in enumerate(LEVELS):
            asset_id = f"{family['prefix']}-l{level:02d}"
            title = f"{family['name']} · phát triển cấp {level}"
            source_svg = render_svg(f"{title} · master", source_base_href, family["kind"], index + 1)
            (SOURCE / f"{asset_id}.svg").write_text(source_svg, encoding="utf-8")
            folder = PUBLIC / asset_id
            folder.mkdir(parents=True, exist_ok=True)
            layers = write_runtime_exports(folder, title, family["kind"], base_id, index + 1)
            stage = copy.deepcopy(base)
            stage.update({
                "assetId": asset_id,
                "variant": "winter-ink-building-progression-v2",
                "revision": int(base["revision"]) + index + 1,
                "presentationScale": round(base_scale * SCALE_FACTORS[index], 2),
                "layers": layers,
                "source": f"assets/source/buildings/{asset_id}.svg",
                "provenance": f"Original editable winter-ink upgrade artwork composed from the registered {base_id} SVG and attached architectural details for level {level}; art-only progression, no raster payload.",
                "license": "Original project artwork, created for Ice Age Lord.",
                "status": "draft",
            })
            runtime = f"/assets/buildings/{asset_id}"
            stage["lodVariants"] = {
                "close": {"body": f"{runtime}/body.svg", "base": f"{runtime}/base.svg", "upper": f"{runtime}/upper.svg", "shadow": f"{runtime}/shadow.svg"},
                "district": {"body": f"{runtime}/body.svg", "base": f"{runtime}/base.svg", "shadow": f"{runtime}/shadow.svg", "icon": f"{runtime}/icon.svg"},
                "regional": {"body": f"{runtime}/body.svg", "base": f"{runtime}/base.svg", "shadow": f"{runtime}/shadow.svg", "icon": f"{runtime}/icon.svg"},
            }
            new_assets.append(stage)
            progression_stages.append({"minLevel": level, "maxLevel": min(30, level + 4), "assetId": asset_id})
        manifest["buildingProgressions"].append({"baseAssetIds": family["aliases"], "stages": progression_stages})

    manifest["assets"].extend(new_assets)
    serialized = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    manifest_path.write_text(serialized, encoding="utf-8")
    runtime_manifest_path.write_text(serialized, encoding="utf-8")
    print(f"Generated {len(new_assets)} compact stage assets for {len(FAMILIES)} building families; stages cover levels 1–30.")


if __name__ == "__main__":
    main()
