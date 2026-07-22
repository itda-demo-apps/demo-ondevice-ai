# 아이콘·OG·스플래시 공용 유틸 — 칩(프로세서) 도안 + Black Han Sans 로드
import urllib.request
from pathlib import Path

from PIL import ImageFont

BG = "#1E2126"
CHALK = "#F2EFE9"
DIM = "#B8B4AC"
GREEN = "#57A867"

FONT_URL = "https://github.com/google/fonts/raw/main/ofl/blackhansans/BlackHanSans-Regular.ttf"
FONT_CACHE = Path(__file__).parent / ".fonts" / "BlackHanSans-Regular.ttf"
FALLBACKS = [
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    "/Library/Fonts/AppleGothic.ttf",
]


def load_font(size):
    try:
        if not FONT_CACHE.exists():
            FONT_CACHE.parent.mkdir(parents=True, exist_ok=True)
            urllib.request.urlretrieve(FONT_URL, FONT_CACHE)
        return ImageFont.truetype(str(FONT_CACHE), size)
    except Exception:
        for p in FALLBACKS:
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
        raise RuntimeError("한글 폰트를 찾지 못했습니다")


def draw_chip(d, cx, cy, size):
    """칩+상태 점 도안을 (cx, cy) 중심, 한 변 size 크기로 그린다 (favicon.svg와 동일 좌표계 100 기준)"""
    u = size / 100

    def pt(x, y):
        return (cx + (x - 50) * u, cy + (y - 50) * u)

    body = [pt(30, 30), pt(70, 70)]
    d.rounded_rectangle([*body[0], *body[1]], radius=8 * u, outline=CHALK, width=max(1, int(5 * u)))
    pin_w = max(1, int(4 * u))
    cap = 2 * u
    for a in (40, 50, 60):
        for (x1, y1, x2, y2) in [(a, 30, a, 18), (a, 70, a, 82), (30, a, 18, a), (70, a, 82, a)]:
            d.line([pt(x1, y1), pt(x2, y2)], fill=CHALK, width=pin_w)
            for ex, ey in [(x1, y1), (x2, y2)]:
                x, y = pt(ex, ey)
                d.ellipse([x - cap, y - cap, x + cap, y + cap], fill=CHALK)
    r = 8 * u
    x, y = pt(50, 50)
    d.ellipse([x - r, y - r, x + r, y + r], fill=GREEN)


def draw_text_center(d, cx, cy, text, font, fill):
    l, t, r, b = d.textbbox((0, 0), text, font=font)
    d.text((cx - (r - l) / 2 - l, cy - (b - t) / 2 - t), text, font=font, fill=fill)
