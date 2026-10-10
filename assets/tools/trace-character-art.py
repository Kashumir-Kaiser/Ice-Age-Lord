"""Trace the T0 character concept sheet into editable, raster-free SVG art.

The source illustration remains in assets/source/concepts. This small adapter
uses the project's shared cell selector and palette-to-path encoder so the
registered character art follows the same export approach as other early art.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONCEPTS = ROOT / "source" / "concepts"
CHARACTERS = ROOT / "source" / "characters"

spec = importlib.util.spec_from_file_location(
    "concept_tracer", ROOT / "tools" / "trace-concept-sheets.py"
)
if spec is None or spec.loader is None:
    raise RuntimeError("Cannot load shared concept tracer")
tracer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tracer)

SHEET = "li-lan-t0-two-view.png"
JOBS = [
    (0, "li-lan-t0-portrait", "Lí Lan at T0 · winter-ink portrait", 480, 640),
    (1, "li-lan-t0-fullbody", "Lí Lan at T0 · winter-ink full-body", 400, 640),
]


def main() -> None:
    from PIL import Image

    image = Image.open(CONCEPTS / SHEET).convert("RGBA")
    for column, name, title, width, height in JOBS:
        crop = tracer.select_component(
            image, columns=2, rows=1, col=column, row=0, isolate_main=True
        )
        svg = tracer.color_path_svg(crop, title, width, height, colors=128)
        target = CHARACTERS / f"{name}.svg"
        target.write_text(svg, encoding="utf-8")
        print(f"{target.relative_to(ROOT)}: {crop.width}x{crop.height} -> {width}x{height}")


if __name__ == "__main__":
    main()
