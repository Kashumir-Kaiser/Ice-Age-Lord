"""Trace the T0 portrait reference into editable, raster-free SVG art.

The source illustration remains in assets/source/concepts. This small adapter
uses the project's shared palette-to-path encoder so the portrait follows the
same export approach as other early art. The older two-view sheet is retained
for the existing full-body master but is no longer used to regenerate it.
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

SHEET = "li-lan-t0-portrait-generated.png"


def main() -> None:
    from PIL import Image

    image = Image.open(CONCEPTS / SHEET).convert("RGBA")
    title = "Lí Lan at T0 · winter-ink portrait"
    svg = tracer.color_path_svg(image, title, 480, 640, colors=128)
    target = CHARACTERS / "li-lan-t0-portrait.svg"
    target.write_text(svg, encoding="utf-8")
    print(f"{target.relative_to(ROOT)}: {image.width}x{image.height} -> 480x640")


if __name__ == "__main__":
    main()
