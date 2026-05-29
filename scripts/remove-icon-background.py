"""Remove external white background from diamond icon (flood fill from edges)."""
from __future__ import annotations

import os
import sys
from collections import deque
from pathlib import Path

from PIL import Image


def is_background_white(r: int, g: int, b: int, a: int = 255) -> bool:
    if a < 10:
        return True
    return r > 235 and g > 235 and b > 235


def remove_external_white(src: Path) -> Image.Image:
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    pixels = img.load()
    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if not visited[y][x] and is_background_white(*pixels[x, y]):
                visited[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not visited[y][x] and is_background_white(*pixels[x, y]):
                visited[y][x] = True
                q.append((x, y))

    while q:
        x, y = q.popleft()
        r, g, b, _a = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                if is_background_white(*pixels[nx, ny]):
                    visited[ny][nx] = True
                    q.append((nx, ny))

    return img


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "public" / "icon-source.png"
    outputs = [
        root / "public" / "icon.png",
        root.parent / "Nomeia-Ai_Rankings-App" / "Nomeia-Ai_Rankings" / "assets" / "images" / "icon.png",
    ]

    img = remove_external_white(src)
    for out in outputs:
        out.parent.mkdir(parents=True, exist_ok=True)
        img.save(out, "PNG")
        print(f"saved {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
