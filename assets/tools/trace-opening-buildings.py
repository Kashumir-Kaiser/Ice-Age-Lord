"""Trace the early-settlement building concept studies into editable SVG layers.

Reference sheets are retained in assets/source/concepts. The exported sprites are
path-only vector geometry and keep the existing 480 x 400 scene contract.
Requires the same Pillow, NumPy and SciPy authoring dependencies as the item tracer.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

from PIL import Image
from scipy import ndimage
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CONCEPTS = ROOT / "source" / "concepts"
BUILDINGS = ROOT / "source" / "buildings"
PUBLIC = ROOT.parent / "frontend" / "public" / "assets" / "buildings"
MANIFEST = ROOT / "manifest.json"

# Load the shared palette/path encoder so item and structure art use the same
# antialiasing, palette quantization and SVG run-length path representation.
spec = importlib.util.spec_from_file_location("concept_tracer", ROOT / "tools" / "trace-concept-sheets.py")
if spec is None or spec.loader is None:
    raise RuntimeError("Cannot load shared concept tracer")
tracer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tracer)

JOBS = [
    ("opening-settlement-buildings.png", 4, 2, 0, 0, "lord-house-damaged", "Nhà Lãnh Chúa Hư Hại"),
    ("opening-settlement-buildings.png", 4, 2, 1, 0, "lord-house-repaired", "Nhà Lãnh Chúa Đã Tu Sửa"),
    ("opening-settlement-buildings.png", 4, 2, 2, 0, "tomb-entry", "Ngôi Mộ Bậc 1"),
    ("opening-settlement-buildings.png", 4, 2, 3, 0, "supply-crate", "Hòm Vật Tư Lãnh Địa"),
    ("opening-settlement-buildings.png", 4, 2, 0, 1, "polar-farmhouse-l01", "Nhà Nông Phu Cực Địa"),
    ("opening-settlement-buildings.png", 4, 2, 1, 1, "opening-palisade-wall", "Đoạn Tường Cọc Gỗ"),
    ("opening-settlement-buildings.png", 4, 2, 2, 1, "opening-timber-gate", "Cổng Gỗ Bọc Sắt"),
    ("opening-settlement-buildings.png", 4, 2, 3, 1, "opening-simple-heater", "Bếp Sưởi Đơn Giản"),
    ("opening-workshops.png", 4, 2, 0, 0, "opening-simple-kitchen", "Bếp Nấu Đơn Giản"),
    ("opening-workshops.png", 4, 2, 1, 0, "opening-woodshop", "Xưởng Mộc Sơ Khai"),
    ("opening-workshops.png", 4, 2, 2, 0, "opening-tailor", "Xưởng May Sơ Khai"),
    ("opening-workshops.png", 4, 2, 3, 0, "opening-oreworks", "Xưởng Sàng Quặng"),
    ("opening-workshops.png", 4, 2, 0, 1, "opening-forge", "Lò Rèn Sơ Khai"),
    ("opening-workshops.png", 4, 2, 1, 1, "opening-medical-station", "Trạm Cứu Thương"),
    ("opening-workshops.png", 4, 2, 2, 1, "opening-small-shelter", "Lều Trú Ẩn"),
]

CANVAS = (480, 400)
SPLIT_Y = 320
PALETTE_SIZE = 144
DISTRICT_PALETTE_SIZE = 24
INK_PROVENANCE = "Original OpenAI ImageGen concept sheet generated for this project on 2026-10-10; palette-traced into editable SVG color paths."


def path_content(svg: str) -> str:
    marker = '<g shape-rendering="crispEdges">'
    start = svg.index(marker) + len(marker)
    end = svg.index("</g>", start)
    return svg[start:end].strip()


def select_building_component(image: Image.Image, columns: int, rows: int, col: int, row: int) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA")).copy()
    mask = rgba[:, :, 3] > 32
    labels, count = ndimage.label(mask, structure=np.ones((3, 3), dtype=np.uint8))
    sizes = np.bincount(labels.ravel())
    cell_w, cell_h = image.width / columns, image.height / rows
    x_center, y_center = (col + .5) * cell_w, (row + .5) * cell_h
    candidates = []
    for label in range(1, count + 1):
        area = int(sizes[label])
        if area < 1000:
            continue
        ys, xs = np.where(labels == label)
        cx, cy = float(xs.mean()), float(ys.mean())
        distance = ((cx - x_center) / cell_w) ** 2 + ((cy - y_center) / cell_h) ** 2
        if distance < .54:
            candidates.append((distance, area, label, int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    if not candidates:
        raise RuntimeError(f"No building in {image.size} cell {col},{row}")
    _, _, label, x0, y0, x1, y1 = min(candidates, key=lambda item: (item[0], -item[1]))
    pad = max(8, round(max(x1 - x0, y1 - y0) * .035))
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(image.width, x1 + pad), min(image.height, y1 + pad)
    crop = rgba[y0:y1, x0:x1]
    crop_labels = labels[y0:y1, x0:x1]
    crop[:, :, 3] = np.where(crop_labels == label, crop[:, :, 3], 0)
    return Image.fromarray(crop, "RGBA")


def svg_document(title: str, contents: str, clip: tuple[int, int] | None = None) -> str:
    defs = ""
    group = contents
    if clip is not None:
        y, h = clip
        defs = f'<defs><clipPath id="layer-clip"><rect x="0" y="{y}" width="{CANVAS[0]}" height="{h}"/></clipPath></defs>\n'
        group = f'<g clip-path="url(#layer-clip)" shape-rendering="crispEdges">{contents}</g>'
    else:
        group = f'<g shape-rendering="crispEdges">{contents}</g>'
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS[0]} {CANVAS[1]}" role="img" aria-label="{title}">\n'
        f'<title>{title}</title>\n{defs}{group}\n</svg>\n'
    )


def sprite_document(title: str, contents: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS[0]} {CANVAS[1]}" role="img" aria-label="{title}">\n'
        f'<title>{title}</title>\n<g id="painted-sprite" shape-rendering="crispEdges">{contents}</g>\n</svg>\n'
    )


def linked_layer_document(title: str, clip: tuple[int, int] | None = None, source_file: str = "body.svg") -> str:
    reference = f'<use href="{source_file}#painted-sprite"'
    if clip is None:
        content = reference + '/>'
        defs = ''
    else:
        y, h = clip
        defs = f'<defs><clipPath id="layer-clip"><rect x="0" y="{y}" width="{CANVAS[0]}" height="{h}"/></clipPath></defs>\n'
        content = reference + ' clip-path="url(#layer-clip)"/>'
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS[0]} {CANVAS[1]}" role="img" aria-label="{title}">\n'
        f'<title>{title}</title>\n{defs}{content}\n</svg>\n'
    )


def shadow_document(title: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS[0]} {CANVAS[1]}" role="img" aria-label="Bóng tiếp xúc · {title}">\n'
        f'<title>Bóng tiếp xúc · {title}</title>\n'
        '<defs><radialGradient id="ground-shadow"><stop stop-color="#101820" stop-opacity=".42"/><stop offset=".68" stop-color="#101820" stop-opacity=".24"/><stop offset="1" stop-color="#101820" stop-opacity="0"/></radialGradient></defs>\n'
        '<ellipse cx="240" cy="342" rx="190" ry="36" fill="url(#ground-shadow)"/>\n</svg>\n'
    )


def main() -> None:
    for sheet, columns, rows, col, row, asset_id, title in JOBS:
        sheet_path = CONCEPTS / sheet
        if not sheet_path.exists():
            raise FileNotFoundError(sheet_path)
        crop = select_building_component(Image.open(sheet_path).convert("RGBA"), columns, rows, col, row)
        painted = tracer.color_path_svg(crop, title, *CANVAS, PALETTE_SIZE)
        contents = path_content(painted)
        district_painted = tracer.color_path_svg(crop, title, *CANVAS, DISTRICT_PALETTE_SIZE)
        district_contents = path_content(district_painted)
        # Keep a complete master plus layers that preserve the existing plan-mode
        # cutaway: ground and foundation below the cut, all visible structure above.
        (BUILDINGS / f"{asset_id}.svg").write_text(svg_document(f"Ice Age Lord · {title} · painted source master", contents), encoding="utf-8")
        folder = PUBLIC / asset_id
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "body.svg").write_text(sprite_document(f"{title} · body", contents), encoding="utf-8")
        (folder / "icon.svg").write_text(linked_layer_document(f"{title} · icon"), encoding="utf-8")
        (folder / "upper.svg").write_text(linked_layer_document(f"{title} · upper", (0, SPLIT_Y)), encoding="utf-8")
        (folder / "base.svg").write_text(linked_layer_document(f"{title} · base and plan-mode footing", (SPLIT_Y, CANVAS[1] - SPLIT_Y)), encoding="utf-8")
        (folder / "district.svg").write_text(sprite_document(f"{title} · district LOD", district_contents), encoding="utf-8")
        (folder / "district-base.svg").write_text(linked_layer_document(f"{title} · district base", (SPLIT_Y, CANVAS[1] - SPLIT_Y), "district.svg"), encoding="utf-8")
        (folder / "shadow.svg").write_text(shadow_document(title), encoding="utf-8")
        print(f"{asset_id}: {sheet} cell {col},{row}; {crop.width}x{crop.height} -> {CANVAS[0]}x{CANVAS[1]}")


if __name__ == "__main__":
    main()
