from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SCALE = 4
SIZE = 256


def rounded_rectangle(draw, box, radius, fill):
    draw.rounded_rectangle(tuple(value * SCALE for value in box), radius=radius * SCALE, fill=fill)


image = Image.new("RGBA", (SIZE * SCALE, SIZE * SCALE), "#0f172a")
draw = ImageDraw.Draw(image)

for y in range(SIZE * SCALE):
    ratio = y / (SIZE * SCALE - 1)
    color = (
        round(15 + (13 - 15) * ratio),
        round(23 + (148 - 23) * ratio),
        round(42 + (136 - 42) * ratio),
        255,
    )
    draw.line((0, y, SIZE * SCALE, y), fill=color)

rounded_rectangle(draw, (28, 43, 228, 213), 22, "#f8fafc")
rounded_rectangle(draw, (44, 59, 212, 197), 11, "#ffffff")
rounded_rectangle(draw, (44, 59, 212, 86), 11, "#0f766e")
draw.rectangle((44 * SCALE, 76 * SCALE, 212 * SCALE, 86 * SCALE), fill="#0f766e")

bars = [
    (61, 105, 68, 164),
    (75, 105, 80, 164),
    (87, 105, 98, 164),
    (105, 105, 110, 164),
    (118, 105, 129, 164),
    (137, 105, 143, 164),
    (151, 105, 162, 164),
    (170, 105, 175, 164),
    (183, 105, 194, 164),
]
for left, top, right, bottom in bars:
    draw.rectangle(
        (left * SCALE, top * SCALE, right * SCALE, bottom * SCALE),
        fill="#0f172a",
    )

draw.ellipse(
    (181 * SCALE, 164 * SCALE, 207 * SCALE, 190 * SCALE),
    fill="#f59e0b",
)
draw.ellipse(
    (190 * SCALE, 173 * SCALE, 198 * SCALE, 181 * SCALE),
    fill="#ffffff",
)

image = image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
ASSETS.mkdir(parents=True, exist_ok=True)
image.save(ASSETS / "icon.png", format="PNG")
image.save(
    ASSETS / "icon.ico",
    format="ICO",
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
