# OG 공유 이미지 생성 (1200×630) — public/og.png. 저장소 루트에서 실행.
from PIL import Image, ImageDraw

from og_splash_common import BG, CHALK, DIM, draw_chip, load_font

W, H = 1200, 630
SS = 2

img = Image.new("RGB", (W * SS, H * SS), BG)
d = ImageDraw.Draw(img)

draw_chip(d, 950 * SS, 300 * SS, 340 * SS)
d.text((90 * SS, 160 * SS), "온디바이스 AI", font=load_font(100 * SS), fill=CHALK)
sub = load_font(42 * SS)
d.text((94 * SS, 310 * SS), "내 기기·브라우저의 AI 탐지·검증", font=sub, fill=DIM)
d.text((94 * SS, 372 * SS), "Prompt API · Summarizer · Translator · WebGPU", font=sub, fill=DIM)
d.text((94 * SS, 434 * SS), "서버로 아무것도 보내지 않습니다", font=sub, fill=DIM)

img.resize((W, H), Image.LANCZOS).save("public/og.png")
print("public/og.png")
