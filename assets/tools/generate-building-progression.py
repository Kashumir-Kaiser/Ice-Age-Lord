"""Build exact early-building stages from the canonical records and art atlases.

The canonical markdown tables are the source of progression caps and profiles.
Every stage uses its own isolated painted concept, palette-traced to a complete
path-only SVG while retaining the existing 480x400 registered canvas.
"""
from __future__ import annotations

import copy
import html
import importlib.util
import json
import math
import re
import shutil
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
CANON = ROOT / "references" / "canonical"
SOURCE_DIR = ROOT / "assets" / "source" / "buildings"
CONCEPT_DIR = ROOT / "assets" / "source" / "concepts"
PUBLIC_DIR = ROOT / "frontend" / "public" / "assets" / "buildings"
MANIFEST = ROOT / "assets" / "manifest.json"
PUBLIC_MANIFEST = ROOT / "frontend" / "public" / "assets" / "manifest.json"
CANVAS = (480, 400)
BODY_COLORS = 88
DISTRICT_COLORS = 24
ART_PROVENANCE = "Original project concept art generated for Ice Age Lord on 2026-10-10 and palette-traced into path-only SVG."

TRACKS = [
    {"prefix":"lord-house","artBase":"lord-house-repaired","baseIds":["lord-house-damaged","lord-house-repaired"],"name":"Nhà Lãnh Chúa","unit":"Cấp","file":"LORD-DND-01.md","heading":"Phụ lục 1.J","display":"LORD-HOUSE-UPGRADE-PATH-2.0","kind":"lord"},
    {"prefix":"tomb-entry","artBase":"tomb-entry","baseIds":["tomb-entry"],"name":"Ngôi Mộ","unit":"Bậc","file":"LORD-DND-06.md","heading":"21. Tiến trình Ngôi Mộ bậc 1–10","display":"TOMB-RANK-PROGRESSION-1–10","kind":"tomb"},
    {"prefix":"polar-farmhouse","artBase":"polar-farmhouse-l01","baseIds":["polar-farmhouse-l01"],"name":"Nhà Nông Phu Cực Địa","unit":"Cấp","file":"LORD-DND-01.md","heading":"Phụ lục 1.K","display":"POLAR-FARMHOUSE-PROGRESSION-2.0","kind":"farm"},
    {"prefix":"opening-simple-heater","artBase":"opening-simple-heater","baseIds":["opening-simple-heater"],"name":"Lò Sưởi Đơn Giản","unit":"Cấp","file":"LORD-DND-04.md","heading":"4.M.1.","display":"OPENING-FIXED-BUILDINGS-2.0 §4.M.1","kind":"heater"},
    {"prefix":"opening-simple-kitchen","artBase":"opening-simple-kitchen","baseIds":["opening-simple-kitchen"],"name":"Bếp Nấu Đơn Giản","unit":"Cấp","file":"LORD-DND-04.md","heading":"4.M.1.","display":"OPENING-FIXED-BUILDINGS-2.0 §4.M.1","kind":"kitchen"},
    {"prefix":"opening-small-shelter","artBase":"opening-small-shelter","baseIds":["opening-small-shelter"],"name":"Nơi Trú Nhỏ","unit":"Cấp","file":"LORD-DND-04.md","heading":"4.M.1.","display":"OPENING-FIXED-BUILDINGS-2.0 §4.M.1","kind":"shelter"},
    {"prefix":"opening-palisade-wall","artBase":"opening-palisade-wall","baseIds":["opening-palisade-wall"],"name":"Tường Rào","unit":"Cấp","file":"LORD-DND-04.md","heading":"4.M.1.","display":"OPENING-FIXED-BUILDINGS-2.0 §4.M.1","kind":"fence"},
    {"prefix":"opening-timber-gate","artBase":"opening-timber-gate","baseIds":["opening-timber-gate"],"name":"Cổng","unit":"Cấp","file":"LORD-DND-04.md","heading":"4.M.1.","display":"OPENING-FIXED-BUILDINGS-2.0 §4.M.1","kind":"gate"},
    {"prefix":"opening-woodshop","artBase":"opening-woodshop","baseIds":["opening-woodshop"],"name":"Xưởng Gỗ","unit":"Cấp","file":"LORD-DND-04.md","heading":"4.M.2.","display":"OPENING-FIXED-BUILDINGS-2.0 §4.M.2","kind":"woodshop"},
    {"prefix":"opening-tailor","artBase":"opening-tailor","baseIds":["opening-tailor"],"name":"Tiệm May","unit":"Cấp","file":"LORD-DND-04.md","heading":"4.M.2.","display":"OPENING-FIXED-BUILDINGS-2.0 §4.M.2","kind":"tailor"},
    {"prefix":"opening-oreworks","artBase":"opening-oreworks","baseIds":["opening-oreworks"],"name":"Xưởng Quặng","unit":"Cấp","file":"LORD-DND-04.md","heading":"4.M.2.","display":"OPENING-FIXED-BUILDINGS-2.0 §4.M.2","kind":"oreworks"},
    {"prefix":"opening-forge","artBase":"opening-forge","baseIds":["opening-forge"],"name":"Lò Rèn","unit":"Cấp","file":"LORD-DND-04.md","heading":"4.M.2.","display":"OPENING-FIXED-BUILDINGS-2.0 §4.M.2","kind":"forge"},
    {"prefix":"opening-medical-station","artBase":"opening-medical-station","baseIds":["opening-medical-station"],"name":"Phòng Y Tế","unit":"Cấp","file":"LORD-DND-04.md","heading":"4.M.2.","display":"OPENING-FIXED-BUILDINGS-2.0 §4.M.2","kind":"medical"},
]

SHEETS = {
    "lord-01-10": ("lord-house-levels-01-10.png", 5, 2),
    "lord-11-20": ("lord-house-levels-11-20.png", 5, 2),
    "lord-21-30": ("lord-house-levels-21-30.png", 5, 2),
    "farm": ("polar-farmhouse-levels-01-10.png", 5, 2),
    "tomb": ("tomb-ranks-01-10.png", 5, 2),
    "fixed": ("fixed-buildings-levels-01-03.png", 3, 5),
    "workshops": ("workshops-levels-01-05.png", 5, 5),
}
FIXED_ROWS = {"heater":0, "kitchen":1, "shelter":2, "fence":3, "gate":4}
WORKSHOP_ROWS = {"woodshop":0, "tailor":1, "oreworks":2, "forge":3, "medical":4}

_tracer_spec = importlib.util.spec_from_file_location("concept_tracer", ROOT / "assets" / "tools" / "trace-concept-sheets.py")
if _tracer_spec is None or _tracer_spec.loader is None:
    raise RuntimeError("Could not load the shared SVG palette tracer")
_tracer = importlib.util.module_from_spec(_tracer_spec)
_tracer_spec.loader.exec_module(_tracer)


def table_for(document: str, marker: str) -> tuple[list[str], list[dict[str, str]]]:
    lines = document.splitlines()
    start = next((i for i, line in enumerate(lines) if line.lstrip().startswith("#") and marker in line), None)
    if start is None:
        raise ValueError(f"Canonical section not found: {marker}")
    table: list[str] = []
    for line in lines[start + 1:]:
        if line.lstrip().startswith("|"):
            table.append(line)
        elif table:
            break
    if len(table) < 3:
        raise ValueError(f"Canonical table missing after: {marker}")
    cells = lambda line: [cell.strip() for cell in line.strip().strip("|").split("|")]
    headers = [re.sub(r"[*`]", "", h).strip() for h in cells(table[0])]
    rows = []
    for line in table[2:]:
        values = cells(line)
        if len(values) == len(headers):
            rows.append(dict(zip(headers, values)))
    return headers, rows


def parse_number(value: str) -> float:
    value = value.strip().replace(" ", "")
    if "," in value:
        whole, fraction = value.rsplit(",", 1)
        return float(whole.replace(".", "") + "." + fraction)
    chunks = value.split(".")
    if len(chunks) > 1 and all(len(chunk) == 3 for chunk in chunks[1:]):
        return float("".join(chunks))
    return float(value)


def first_number(pattern: str, text: str) -> float | None:
    match = re.search(pattern, text, re.IGNORECASE)
    return parse_number(match.group(1)) if match else None


def integer(pattern: str, text: str, fallback: int = 0) -> int:
    value = first_number(pattern, text)
    return int(value) if value is not None else fallback


def area_from(text: str) -> float | None:
    return first_number(r"([\d.,]+)\s*m²", text)


def ratio(value: str) -> tuple[int, int]:
    match = re.search(r"([\d.,]+)\s*/\s*([\d.,]+)", value)
    return (int(parse_number(match.group(1))), int(parse_number(match.group(2)))) if match else (0, 0)


def visible_profile(row: dict[str, str], kind: str) -> dict[str, object]:
    blob = " ".join(row.values())
    profile: dict[str, object] = {}
    form_column = "Hình thái đích; diện tích/tầng" if kind == "lord" else "Hình thái/diện tích" if kind == "farm" else "Hình thể và công năng đích"
    form = row.get(form_column, "")
    area = area_from(form)
    if area is not None:
        profile["areaSqM"] = area
    if kind == "lord":
        profile["durability"], profile["armor"] = ratio(row.get("D/A", ""))
        pop = first_number(r"([\d.,]+)", row.get("Pop", ""))
        profile["populationCap"] = int(pop or 0)
        profile["stories"] = 3 if "ba tầng" in blob else 2 if "hai tầng" in blob else 1
        height = first_number(r"cao\s*([\d.,]+)\s*m", blob)
        if height is not None:
            profile["heightM"] = height
        elif "trên 30 m" in blob:
            profile["heightM"] = ">30"
        profile["form"] = form
    elif kind == "farm":
        profile["durability"], profile["armor"] = ratio(row.get("D/A", ""))
        profile["residentCapacity"] = integer(r"([\d.,]+)", row.get("Chỗ; phí gọi 1 người", ""))
        profile["staminaRecoveryPercent"] = integer(r"\+(\d+)%", row.get("Hiệu quả cư trú", ""))
        profile["form"] = form
    elif kind == "tomb":
        capacity = first_number(r"([\d.,]+)", row.get("Hồ Tử Khí", ""))
        profile["dqCapacity"] = int(capacity or 0)
        profile["rankName"] = row.get("Tên chức năng", "")
        profile["zombieTier"] = integer(r"T(\d+)", row.get("Zombie đầu ra", ""))
        profile["quality"] = row.get("Phẩm đầu ra", "")
        profile["focus"] = row.get("Trọng tâm nâng cấp", "")
        profile["growthCoefficient"] = first_number(r"([\d.,]+)", row.get("G_Q/level", "")) or 0
        profile["form"] = row.get("Tên chức năng", "")
    else:
        profile["form"] = form
        profile["durability"], profile["armor"] = ratio(row.get("D/A", ""))
        profile["stationCount"] = integer(r"(\d+)\s+trạm", form, 1)
        beds = integer(r"(\d+)\s+giường", form)
        profile["bedCount"] = beds
        profile["isolationBedCount"] = integer(r"(\d+)\s+giường cách ly", form)
        profile["sleepingCapacity"] = integer(r"(\d+)\s+chỗ(?: ngủ)?", form)
        if profile["sleepingCapacity"]:
            profile["bedCount"] = profile["sleepingCapacity"]
        profile["portionCount"] = integer(r"(\d+)\s+phần", form)
        profile["treatmentBays"] = integer(r"(\d+)\s+ca", form)
        profile["processingLines"] = integer(r"(\d+)\s+dây chuyền", form, 1)
        profile["recoveryPercent"] = integer(r"\+(\d+)%", form)
        profile["fuelInput"] = row.get("Nhiên liệu/đầu vào", "")
        if kind == "heater":
            profile["coverageSqM"] = integer(r"(?:phòng tối đa|phòng)\s*([\d.,]+)\s*m²", form)
            temps = re.search(r"\+(\d+)\s*[–-]\s*(\d+)°C", form)
            if temps:
                profile["temperatureRangeC"] = [int(temps.group(1)), int(temps.group(2))]
            profile["heatRetentionAfterShutdownMinutes"] = integer(r"giữ nhiệt\s*(\d+)\s*phút", form)
        elif kind == "fence":
            profile["lengthM"] = integer(r"đoạn\s*([\d.,]+)\s*m", form)
            profile["heightM"] = first_number(r"cao\s*([\d.,]+)\s*m", form) or 0
            profile["ironBracing"] = "giằng sắt" in form.lower()
            profile["reinforcedFooting"] = "chân gia cố" in form.lower()
        elif kind == "gate":
            profile["widthM"] = first_number(r"rộng\s*([\d.,]+)\s*m", form) or 0
            profile["heightM"] = first_number(r"cao\s*([\d.,]+)\s*m", form) or 0
            profile["doubleLeaves"] = "hai cánh" in form.lower()
            profile["ironFrame"] = "khung sắt" in form.lower()
        elif kind == "woodshop":
            profile["woodPerHour"] = integer(r"([\d.,]+)\s+Gỗ/giờ", form)
            profile["wasteReductionPercent"] = integer(r"hao hụt\s*[−-](\d+)%", form)
        elif kind == "tailor":
            profile["garmentsPerEightHours"] = integer(r"([\d.,]+)\s+món/8 giờ", form)
            profile["softArmorPerEightHours"] = integer(r"([\d.,]+)\s+giáp mềm/8 giờ", form)
            profile["productionTimeReductionPercent"] = integer(r"thời gian\s*[−-](\d+)%", form)
        elif kind == "oreworks":
            profile["orePerHour"] = integer(r"([\d.,]+)\s+quặng/giờ", form)
            profile["materialUnlock"] = (re.search(r"mở\s+([^;]+)", form, re.IGNORECASE) or [None, ""])[1]
        elif kind == "forge":
            lots = re.search(r"([\d.,]+)\s*/\s*([\d.,]+)\s+lô", form)
            if lots:
                profile["toolLotsPerEightHours"] = int(parse_number(lots.group(1)))
                profile["weaponLotsPerEightHours"] = int(parse_number(lots.group(2)))
            profile["materialUnlock"] = (re.search(r"mở\s+([^;]+)", form, re.IGNORECASE) or [None, ""])[1]
            profile["productionTimeReductionPercent"] = integer(r"thời gian\s*[−-](\d+)%", form)
        elif kind == "medical":
            profile["treatmentEffectPercent"] = integer(r"\+(\d+)%", form)
            profile["bedCount"] = beds
    profile["canonicalLabel"] = row.get("Nhãn", "")
    profile["upgradeRecipe"] = row.get("Recipe + điều kiện lên Cấp kế", row.get("Recipe lên Cấp kế", "Cấp trần theo registry nguồn"))
    profile["workUnits"] = row.get("WU/max", "")
    return profile


def stage_level(row: dict[str, str], kind: str) -> int:
    key = "Cấp" if kind in ("lord", "farm") else "Bậc Ngôi Mộ" if kind == "tomb" else "Tuyến/Cấp"
    match = re.search(r"\d+", row.get(key, ""))
    if not match:
        raise ValueError(f"No level/rank in canonical row {row}")
    return int(match.group())


def read_tracks() -> list[dict[str, object]]:
    result = []
    aliases = {"heater":"Lò Sưởi", "kitchen":"Bếp", "shelter":"Nơi Trú Nhỏ", "fence":"Tường Rào", "gate":"Cổng", "woodshop":"Xưởng Gỗ", "tailor":"Tiệm May", "oreworks":"Xưởng Quặng", "forge":"Lò Rèn", "medical":"Phòng Y Tế"}
    for config in TRACKS:
        document = (CANON / config["file"]).read_text(encoding="utf-8")
        headers, rows = table_for(document, config["heading"])
        kind = str(config["kind"])
        parsed = {}
        for row in rows:
            if kind in aliases and not row.get("Tuyến/Cấp", "").startswith(aliases[kind]):
                continue
            parsed[stage_level(row, kind)] = row
        levels = sorted(parsed)
        if not levels or levels != list(range(1, len(levels) + 1)):
            raise ValueError(f"Canonical progression must start at 1 and have no gaps: {config['display']} {levels}")
        track = dict(config)
        track.update(maxLevel=len(levels), canonicalRows=parsed, canonicalHeaders=headers,
                     canonicalSection=config["heading"], canonicalPath="references/canonical/" + config["file"])
        result.append(track)
    return result


def cell_for(track: dict[str, object], level: int) -> tuple[str, int, int]:
    kind = str(track["kind"])
    if kind == "lord":
        sheet_index = (level - 1) // 10
        key = ("lord-01-10", "lord-11-20", "lord-21-30")[sheet_index]
        local = (level - 1) % 10
        return key, local % 5, local // 5
    if kind == "farm":
        return "farm", (level - 1) % 5, (level - 1) // 5
    if kind == "tomb":
        return "tomb", (level - 1) % 5, (level - 1) // 5
    if kind in FIXED_ROWS:
        return "fixed", level - 1, FIXED_ROWS[kind]
    return "workshops", level - 1, WORKSHOP_ROWS[kind]


_sheet_cache: dict[str, tuple[Image.Image, np.ndarray, int, np.ndarray]] = {}
_sheet_assignments: dict[tuple[str, int], tuple[int, int]] = {}


def selected_sprite(sheet_key: str, col: int, row: int) -> Image.Image:
    if sheet_key not in _sheet_cache:
        filename, columns, rows = SHEETS[sheet_key]
        path = CONCEPT_DIR / filename
        if not path.exists():
            raise FileNotFoundError(path)
        image = Image.open(path).convert("RGBA")
        alpha = np.asarray(image)[:, :, 3]
        labels, count = ndimage.label(alpha > 32, structure=np.ones((3, 3), dtype=np.uint8))
        sizes = np.bincount(labels.ravel())
        _sheet_cache[sheet_key] = (image, labels, count, sizes)
    image, labels, count, sizes = _sheet_cache[sheet_key]
    columns, rows = SHEETS[sheet_key][1:]
    center_x, center_y = (col + 0.5) * image.width / columns, (row + 0.5) * image.height / rows
    candidates = []
    for label_id in range(1, count + 1):
        if sizes[label_id] < 500:
            continue
        ys, xs = np.where(labels == label_id)
        cx, cy = float(xs.mean()), float(ys.mean())
        distance = ((cx - center_x) / (image.width / columns)) ** 2 + ((cy - center_y) / (image.height / rows)) ** 2
        candidates.append((distance, -int(sizes[label_id]), label_id, xs, ys))
    if not candidates:
        raise RuntimeError(f"No sprite found in {sheet_key} cell {col},{row}")
    distance, _, label_id, xs, ys = min(candidates, key=lambda item: (item[0], item[1]))
    if distance > 0.54:
        raise RuntimeError(f"Sprite center is outside expected atlas cell: {sheet_key} {col},{row} distance={distance:.3f}")
    prior_cell = _sheet_assignments.get((sheet_key, label_id))
    if prior_cell is not None and prior_cell != (col, row):
        raise RuntimeError(f"Two progression cells selected the same sprite: {sheet_key} {prior_cell} and {(col, row)}")
    _sheet_assignments[(sheet_key, label_id)] = (col, row)
    x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
    pad = max(6, round(max(x1 - x0, y1 - y0) * 0.035))
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(image.width, x1 + pad), min(image.height, y1 + pad)
    rgba = np.asarray(image).copy()[y0:y1, x0:x1]
    local_labels = labels[y0:y1, x0:x1]
    rgba[:, :, 3] = np.where(local_labels == label_id, rgba[:, :, 3], 0)
    return Image.fromarray(rgba, "RGBA")


def path_content(svg: str) -> str:
    marker = '<g shape-rendering="crispEdges">'
    start = svg.index(marker) + len(marker)
    end = svg.index("</g>", start)
    return svg[start:end].strip()


def svg_document(title: str, contents: str, desc: str = "") -> str:
    description = f"<desc>{html.escape(desc, quote=True)}</desc>\n" if desc else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS[0]} {CANVAS[1]}" role="img" aria-label="{html.escape(title, quote=True)}">\n'
            f'<title>{html.escape(title)}</title>\n{description}<g id="painted-sprite" shape-rendering="crispEdges">\n{contents}\n</g>\n</svg>\n')


def layer_document(title: str, target: str, clip: tuple[int, int] | None = None) -> str:
    clip_defs = ""
    attributes = ""
    if clip:
        y, height = clip
        clip_defs = f'<defs><clipPath id="layer-clip"><rect x="0" y="{y}" width="480" height="{height}"/></clipPath></defs>\n'
        attributes = ' clip-path="url(#layer-clip)"'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 400" role="img" aria-label="{html.escape(title, quote=True)}">\n'
            f'<title>{html.escape(title)}</title>\n{clip_defs}<use href="{target}#painted-sprite"{attributes}/>\n</svg>\n')


def shadow_document(title: str) -> str:
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 400" role="img" aria-label="Contact shadow · {html.escape(title, quote=True)}">'
            '<defs><radialGradient id="ground-shadow"><stop stop-color="#101820" stop-opacity=".42"/><stop offset=".68" stop-color="#101820" stop-opacity=".24"/><stop offset="1" stop-color="#101820" stop-opacity="0"/></radialGradient></defs>'
            '<ellipse cx="240" cy="350" rx="188" ry="34" fill="url(#ground-shadow)"/></svg>\n')


def make_art(crop: Image.Image, title: str, colors: int) -> str:
    return path_content(_tracer.color_path_svg(crop, title, *CANVAS, colors))


def render_asset(asset_id: str, title: str, crop: Image.Image, profile_desc: str, *, primary: bool) -> None:
    source = SOURCE_DIR / f"{asset_id}.svg"
    folder = PUBLIC_DIR / asset_id
    folder.mkdir(parents=True, exist_ok=True)
    body = make_art(crop, title, BODY_COLORS)
    body_document = svg_document(f"{title} · body", body, profile_desc)
    source.write_text(body_document, encoding="utf-8")
    (folder / "body.svg").write_text(body_document, encoding="utf-8")
    (folder / "upper.svg").write_text(layer_document(f"{title} · upper", "body.svg", (0, 320)), encoding="utf-8")
    (folder / "base.svg").write_text(layer_document(f"{title} · footing", "body.svg", (320, 80)), encoding="utf-8")
    optional = ["icon.svg", "district.svg", "district-base.svg", "shadow.svg"]
    if primary:
        district = make_art(crop, title, DISTRICT_COLORS)
        (folder / "district.svg").write_text(svg_document(f"{title} · district LOD", district), encoding="utf-8")
        (folder / "icon.svg").write_text(layer_document(f"{title} · icon", "body.svg"), encoding="utf-8")
        (folder / "district-base.svg").write_text(layer_document(f"{title} · district footing", "district.svg", (320, 80)), encoding="utf-8")
        (folder / "shadow.svg").write_text(shadow_document(title), encoding="utf-8")
    else:
        for filename in optional:
            (folder / filename).unlink(missing_ok=True)


def asset_paths(asset_id: str, primary_asset_id: str) -> tuple[dict[str, object], dict[str, object]]:
    root = f"/assets/buildings/{asset_id}/"
    body = root + "body.svg"
    base = root + "base.svg"
    shadow = f"/assets/buildings/{primary_asset_id}/shadow.svg"
    layers = {"uiIcon": body, "body": body, "base": base, "upper": root + "upper.svg", "shadow": shadow, "vfx": None}
    lods = {
        "close": {"body": body, "base": base, "upper": root + "upper.svg", "shadow": shadow},
        "district": {"body": body, "base": base, "shadow": shadow, "icon": body},
        "regional": {"body": body, "base": base, "shadow": shadow, "icon": body},
    }
    return layers, lods


def build_manifest(tracks: list[dict[str, object]]) -> dict[str, object]:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    track_prefixes = {str(track["prefix"]) for track in tracks}
    base_ids = {str(asset_id) for track in tracks for asset_id in track["baseIds"]}
    base_by_id = {asset["assetId"]: asset for asset in manifest["assets"]}
    for track in tracks:
        for base_id in track["baseIds"]:
            if base_id not in base_by_id:
                raise ValueError(f"Missing registered base asset {base_id}")
    expected_stage_ids = {
        f"{track['prefix']}-{'b' if track['kind'] == 'tomb' else 'l'}{level:02d}"
        for track in tracks for level in range(2, int(track["maxLevel"]) + 1)
    }
    existing = []
    for asset in manifest["assets"]:
        asset_id = asset["assetId"]
        stale = any(re.fullmatch(re.escape(prefix) + r"-(?:l|b)\d{2}", asset_id) for prefix in track_prefixes)
        if not stale or asset_id in expected_stage_ids or asset_id in base_ids:
            existing.append(asset)
    manifest["assets"] = existing
    known_ids = {asset["assetId"] for asset in existing}
    progressions = []
    for track in tracks:
        kind = str(track["kind"])
        base = base_by_id[str(track["artBase"])]
        stages = []
        for level in range(1, int(track["maxLevel"]) + 1):
            row = track["canonicalRows"][level]
            visible = visible_profile(row, kind)
            asset_id = str(track["artBase"]) if level == 1 else f"{track['prefix']}-{'b' if kind == 'tomb' else 'l'}{level:02d}"
            stages.append({"level": level, "assetId": asset_id, "canonicalProfile": row, "visibleProfile": visible})
            if level == 1:
                base["variant"] = "winter-ink-canonical-progression-v4"
                base["provenance"] = ART_PROVENANCE + f" Canonical level 1 of {track['display']}."
                sheet_key, col, row_number = cell_for(track, level)
                base["referenceSource"] = f"assets/source/concepts/{SHEETS[sheet_key][0]}#cell={col},{row_number}"
                continue
            if asset_id in known_ids:
                manifest["assets"] = [asset for asset in manifest["assets"] if asset["assetId"] != asset_id]
            entry = copy.deepcopy(base)
            entry.update({
                "assetId": asset_id,
                "variant": "winter-ink-canonical-progression-v4",
                "revision": 1,
                "source": f"assets/source/buildings/{asset_id}.svg",
                "referenceSource": f"assets/source/concepts/{SHEETS[cell_for(track, level)[0]][0]}#cell={cell_for(track, level)[1]},{cell_for(track, level)[2]}",
                "provenance": ART_PROVENANCE + f" Canonical {track['display']} {track['unit']} {level}; profile is stored verbatim.",
                "status": "draft",
            })
            entry["layers"], entry["lodVariants"] = asset_paths(asset_id, str(track["artBase"]))
            manifest["assets"].append(entry)
            known_ids.add(asset_id)
        progressions.append({
            "baseAssetIds": list(track["baseIds"]),
            "trackName": track["name"],
            "unit": track["unit"],
            "maxLevel": track["maxLevel"],
            "canonicalRegistry": track["display"],
            "canonicalSource": track["canonicalPath"],
            "canonicalSection": track["canonicalSection"],
            "stageIdsUseExactLevels": True,
            "stages": stages,
        })
    manifest["buildingProgressions"] = progressions
    manifest["assets"].sort(key=lambda asset: asset["assetId"])
    return manifest


def remove_stale_art(tracks: list[dict[str, object]]) -> None:
    prefixes = [str(track["prefix"]) for track in tracks]
    base_ids = {str(asset_id) for track in tracks for asset_id in track["baseIds"]}
    expected = {f"{track['prefix']}-{'b' if track['kind'] == 'tomb' else 'l'}{level:02d}" for track in tracks for level in range(2, int(track["maxLevel"]) + 1)}
    for path in SOURCE_DIR.glob("*.svg"):
        if any(re.fullmatch(re.escape(prefix) + r"-(?:l|b)\d{2}", path.stem) for prefix in prefixes) and path.stem not in expected:
            path.unlink()
    for folder in PUBLIC_DIR.iterdir():
        if folder.is_dir() and folder.name not in base_ids and any(re.fullmatch(re.escape(prefix) + r"-(?:l|b)\d{2}", folder.name) for prefix in prefixes) and folder.name not in expected:
            shutil.rmtree(folder)
    obsolete_helper = SOURCE_DIR / "polar-farmhouse-l02-base.svg"
    obsolete_helper.unlink(missing_ok=True)


def write_all(tracks: list[dict[str, object]], manifest: dict[str, object]) -> None:
    remove_stale_art(tracks)
    concepts: dict[tuple[str, int, int], Image.Image] = {}
    for track in tracks:
        kind = str(track["kind"])
        for level in range(1, int(track["maxLevel"]) + 1):
            sheet_key, col, row_number = cell_for(track, level)
            cache_key = (sheet_key, col, row_number)
            if cache_key not in concepts:
                concepts[cache_key] = selected_sprite(sheet_key, col, row_number)
            asset_id = str(track["artBase"]) if level == 1 else f"{track['prefix']}-{'b' if kind == 'tomb' else 'l'}{level:02d}"
            title = f"{track['name']} · {track['unit']} {level}"
            record = track["canonicalRows"][level]
            description = f"Canonical registry {track['display']}; source row: " + " · ".join(f"{key}: {value}" for key, value in record.items())
            render_asset(asset_id, title, concepts[cache_key], description, primary=level == 1)
            body_size = (PUBLIC_DIR / asset_id / "body.svg").stat().st_size
            print(f"{asset_id}: {SHEETS[sheet_key][0]} cell {col},{row_number}; {body_size:,} B SVG")
    expected_cells = {key: columns * rows for key, (_, columns, rows) in SHEETS.items()}
    for key, count in expected_cells.items():
        actual = sum(1 for assigned_key, _ in _sheet_assignments if assigned_key == key)
        if actual != count:
            raise RuntimeError(f"Atlas {key} supplied {actual} unique sprites; expected {count}")
    content = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    MANIFEST.write_text(content, encoding="utf-8")
    PUBLIC_MANIFEST.write_text(content, encoding="utf-8")


def main() -> None:
    tracks = read_tracks()
    manifest = build_manifest(tracks)
    write_all(tracks, manifest)
    print("Canonical progression caps: " + ", ".join(f"{track['prefix']}={track['maxLevel']}" for track in tracks))
    print(f"Unique SVG stage designs above level 1: {sum(int(track['maxLevel']) - 1 for track in tracks)}")


if __name__ == "__main__":
    main()
