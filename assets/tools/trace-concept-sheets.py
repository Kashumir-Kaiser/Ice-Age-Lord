"""Convert authored concept-sheet cells to editable color-path SVG masters.

The source PNG sheets stay in assets/source/concepts. This exports true SVG color
geometry, with no embedded raster image, from each separately cropped illustration.
Requires Pillow, NumPy and SciPy in the authoring environment only.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
CONCEPTS = ROOT / "source" / "concepts"
ITEMS = ROOT / "source" / "items"
UNITS = ROOT / "source" / "units"

JOBS = [
    ("early-unit-studies.png", 3, 1, 0, 0, "polar-farmer-t1", "Nông Phu Cực Địa · hình mẫu cư dân", 320, 400, 132),
    ("early-unit-studies.png", 3, 1, 1, 0, "tomb-zombie-t0", "Zombie Ngôi Mộ · mẫu Thường T0", 320, 400, 132),
    ("early-unit-studies.png", 3, 1, 2, 0, "direct-revived-cadaver", "Tử Phục · hình mẫu thi thể giữ dấu tích riêng", 320, 400, 132),
    ("early-ecology-studies.png", 3, 3, 0, 0, "snow-hare-r0", "Thỏ Băng · ecology T0", 320, 400, 132),
    ("early-ecology-studies.png", 3, 3, 1, 0, "snow-fox-r0", "Cáo Tuyết · ecology T0", 320, 400, 132),
    ("early-ecology-studies.png", 3, 3, 2, 0, "mist-deer-r0", "Hươu Sương · ecology T0", 320, 400, 132),
    ("early-ecology-studies.png", 3, 3, 0, 1, "ice-burrowing-worm-r0", "Sâu Đào Băng · ecology T0", 320, 400, 132),
    ("early-ecology-studies.png", 3, 3, 1, 1, "snow-wolf-r1", "Sói Tuyết · ecology R1", 320, 400, 132),
    ("early-ecology-studies.png", 3, 3, 2, 1, "carrion-crow-r1", "Quạ Xác · ecology R1", 320, 400, 132),
    ("early-ecology-studies.png", 3, 3, 0, 2, "long-haired-ox-r2", "Bò Lông Dài · ecology R2", 320, 400, 132),
    ("early-ecology-studies.png", 3, 3, 1, 2, "ice-cave-bear-r3", "Gấu Hang Băng · ecology R3", 320, 400, 132),
    ("early-ecology-studies.png", 3, 3, 2, 2, "wild-undead-r3", "Undead Hoang · ecology R3", 320, 400, 132),
    ("opening-materials.png", 3, 2, 0, 0, "wood", "Gỗ khô dùng làm vật liệu", 256, 256, 96),
    ("opening-materials.png", 3, 2, 1, 0, "stone", "Đá xám vân băng", 256, 256, 96),
    ("opening-materials.png", 3, 2, 2, 0, "ore", "Than nâu thô", 256, 256, 96),
    ("opening-materials.png", 3, 2, 0, 1, "herbs", "Cỏ tuyết", 256, 256, 96),
    ("opening-materials.png", 3, 2, 1, 1, "water", "Băng nước sạch", 256, 256, 96),
    ("opening-materials.png", 3, 2, 2, 1, "salt", "Muối kết tinh", 256, 256, 96),
    ("opening-kit.png", 4, 2, 0, 0, "bread", "Bánh mì dự trữ", 256, 256, 96),
    ("opening-kit.png", 4, 2, 1, 0, "iron-pot", "Nồi sắt nấu ăn", 256, 256, 96),
    ("opening-kit.png", 4, 2, 2, 0, "axe", "Rìu đá buộc cán gỗ", 256, 256, 96),
    ("opening-kit.png", 4, 2, 3, 0, "stone-hammer", "Búa đá cán gỗ", 256, 256, 96),
    ("opening-kit.png", 4, 2, 0, 1, "staff", "Trượng gỗ thường", 256, 256, 96),
    ("opening-kit.png", 4, 2, 1, 1, "round-shield", "Khiên tròn gỗ ghép ván", 256, 256, 96),
    ("opening-kit.png", 4, 2, 2, 1, "convenience-bag", "Bịch đồ ăn cửa hàng tiện lợi, chưa kiểm kê", 256, 256, 96),
    ("opening-kit.png", 4, 2, 3, 1, "supply-coffer", "Hòm Vật Tư Lãnh Địa đóng kín", 256, 256, 96),
    ("ungraded-chest.png", 1, 1, 0, 0, "chest", "Rương Báu chưa giám định", 256, 256, 104),
    ("treasure-chests.png", 5, 1, 0, 0, "chest-moc", "Rương Báu phẩm Mộc", 256, 256, 104),
    ("treasure-chests.png", 5, 1, 1, 0, "chest-bronze", "Rương Báu Thanh Đồng", 256, 256, 104),
    ("treasure-chests.png", 5, 1, 2, 0, "chest-silver", "Rương Báu Bạch Ngân", 256, 256, 104),
    ("treasure-chests.png", 5, 1, 3, 0, "chest-gold", "Rương Báu Hoàng Kim", 256, 256, 104),
    ("treasure-chests.png", 5, 1, 4, 0, "chest-moon", "Rương Báu Hạo Nguyệt", 256, 256, 104),
    ("sample-items.png", 5, 1, 0, 0, "cloak", "Áo choàng chống rét bằng vải thô", 256, 256, 96),
    ("sample-items.png", 5, 1, 1, 0, "scroll", "Cuộn bản vẽ cũ", 256, 256, 96),
    ("sample-items.png", 5, 1, 2, 0, "potion", "Lọ thuốc thảo mộc, mẫu vật phẩm", 256, 256, 96),
    ("sample-items.png", 5, 1, 3, 0, "sword", "Kiếm sắt đơn giản, mẫu vật phẩm", 256, 256, 96),
    ("sample-items.png", 5, 1, 4, 0, "ring", "Nhẫn khắc đơn giản, mẫu minh họa", 256, 256, 96),
    ("convenience-bag-contents.png", 4, 3, 0, 0, "main-meal-box", "Hộp cơm tiện lợi", 256, 256, 96),
    ("convenience-bag-contents.png", 4, 3, 1, 0, "two-baozi", "Hai bánh bao nhân", 256, 256, 96),
    ("convenience-bag-contents.png", 4, 3, 2, 0, "packaged-sandwich", "Sandwich đóng gói", 256, 256, 96),
    ("convenience-bag-contents.png", 4, 3, 3, 0, "cup-noodles", "Mì ăn liền cốc", 256, 256, 96),
    ("convenience-bag-contents.png", 4, 3, 0, 1, "cracker-packet", "Gói bánh quy", 256, 256, 96),
    ("convenience-bag-contents.png", 4, 3, 1, 1, "roasted-seeds-packet", "Gói hạt rang", 256, 256, 96),
    ("convenience-bag-contents.png", 4, 3, 2, 1, "chocolate-bar", "Thanh chocolate", 256, 256, 96),
    ("convenience-bag-contents.png", 4, 3, 3, 1, "potato-chip-packet", "Gói khoai tây lát", 256, 256, 96),
    ("convenience-bag-contents.png", 4, 3, 0, 2, "bottled-water", "Chai nước 500 ml", 256, 256, 96),
    ("convenience-bag-contents.png", 4, 3, 1, 2, "tea-bottle", "Chai trà không đường 500 ml", 256, 256, 96),
    ("convenience-bag-contents.png", 4, 3, 2, 2, "coffee-can", "Lon cà phê 330 ml", 256, 256, 96),
    ("convenience-bag-contents.png", 4, 3, 3, 2, "napkin-chopsticks", "Khăn giấy và đũa dùng một lần", 256, 256, 96),
]


def select_component(
    image: Image.Image, columns: int, rows: int, col: int, row: int, isolate_main: bool = False
) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA")).copy()
    mask = rgba[:, :, 3] > 32
    labels, count = ndimage.label(mask, structure=np.ones((3, 3), dtype=np.uint8))
    sizes = np.bincount(labels.ravel())
    centers_x = ndimage.center_of_mass(mask, labels, range(1, count + 1))
    x_center = (col + 0.5) * image.width / columns
    y_center = (row + 0.5) * image.height / rows
    cell_w = image.width / columns
    cell_h = image.height / rows
    candidates = []
    for label in range(1, count + 1):
        area = int(sizes[label])
        if area < 1000:
            continue
        ys, xs = np.where(labels == label)
        cx, cy = float(xs.mean()), float(ys.mean())
        distance = ((cx - x_center) / cell_w) ** 2 + ((cy - y_center) / cell_h) ** 2
        if distance < 0.54:
            candidates.append((distance, area, label, int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    if not candidates:
        raise RuntimeError(f"No art component in cell {col},{row} of {image.size}")
    _, _, main_label, x0, y0, x1, y1 = min(candidates, key=lambda item: (item[0], -item[1]))
    pad = max(7, round(max(x1 - x0, y1 - y0) * 0.035))
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(image.width, x1 + pad), min(image.height, y1 + pad)
    if isolate_main:
        rgba[labels != main_label, 3] = 0
        image = Image.fromarray(rgba, "RGBA")
    return image.crop((x0, y0, x1, y1)).convert("RGBA")


def color_path_svg(crop: Image.Image, title: str, width: int, height: int, colors: int) -> str:
    margin = 20 if width >= 480 else 13 if width == 256 else 12
    max_w, max_h = width - margin * 2, height - margin * 2
    scale = min(max_w / crop.width, max_h / crop.height)
    size = max(1, round(crop.width * scale)), max(1, round(crop.height * scale))
    resized = crop.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((width - size[0]) // 2, (height - size[1]) // 2))
    rgba = np.asarray(canvas)
    indexed = Image.fromarray(rgba[:, :, :3], "RGB").quantize(
        colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE
    )
    labels = np.asarray(indexed)
    palette_flat = indexed.getpalette()
    palette_flat.extend([0] * (768 - len(palette_flat)))
    palette = np.asarray(palette_flat, dtype=np.uint8).reshape(256, 3)
    alpha = rgba[:, :, 3]
    alpha_bands = np.zeros(alpha.shape, dtype=np.uint8)
    alpha_bands[(alpha >= 20) & (alpha < 100)] = 1
    alpha_bands[(alpha >= 100) & (alpha < 205)] = 2
    alpha_bands[alpha >= 205] = 3
    layers = labels.astype(np.int32) * 4 + alpha_bands.astype(np.int32)
    layers[alpha_bands == 0] = -1
    body = []
    opacity = {1: "0.38", 2: "0.72", 3: "1"}
    for layer in np.unique(layers):
        if layer < 0:
            continue
        palette_index, alpha_index = divmod(int(layer), 4)
        mask = layers == layer
        active: dict[tuple[int, int], int] = {}
        rectangles: list[tuple[int, int, int, int]] = []
        for y in range(height):
            row_mask = mask[y]
            edges = np.flatnonzero(np.diff(np.r_[False, row_mask, False].astype(np.int8)))
            spans = {(int(edges[i]), int(edges[i + 1])) for i in range(0, len(edges), 2)}
            for span, start_y in list(active.items()):
                if span not in spans:
                    rectangles.append((span[0], start_y, span[1] - span[0], y - start_y))
                    del active[span]
            for span in spans:
                active.setdefault(span, y)
        for span, start_y in active.items():
            rectangles.append((span[0], start_y, span[1] - span[0], height - start_y))
        if not rectangles:
            continue
        commands = []
        for x, y, w, h in rectangles:
            commands.append(f"M{x},{y}h{w}v{h}h-{w}z")
        r, g, b = map(int, palette[palette_index])
        body.append(f'<path fill="#{r:02x}{g:02x}{b:02x}" fill-opacity="{opacity[alpha_index]}" d="{"".join(commands)}"/>')
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="{title}">\n'
        f'<title>{title}</title>\n<g shape-rendering="crispEdges">\n' + "\n".join(body) + "\n</g>\n</svg>\n"
    )


def main() -> None:
    for sheet, columns, rows, col, row, name, title, width, height, colors in JOBS:
        image = Image.open(CONCEPTS / sheet).convert("RGBA")
        crop = select_component(image, columns, rows, col, row, isolate_main=sheet == "early-ecology-studies.png")
        target_root = UNITS if height != 256 else ITEMS
        target = target_root / f"{name}.svg"
        target.write_text(color_path_svg(crop, title, width, height, colors), encoding="utf-8")
        print(f"{target.relative_to(ROOT)}: {crop.width}x{crop.height} -> {width}x{height}")


if __name__ == "__main__":
    main()
