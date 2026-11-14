"""Dev-only: derive web assets from the approved master logo (assets/images/solar-with-philip-logo.png).
The master is never modified. Derivatives are crops/resizes plus a levels fix that turns the master's
off-white (251,252,252) background into pure white. No artwork is redrawn.
Usage: python scripts/make-logo-assets.py"""
from PIL import Image
import numpy as np, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'assets', 'images')
master = Image.open(os.path.join(IMG, 'solar-with-philip-logo.png')).convert('RGB')

def whiten(im):
    a = np.array(im).astype(np.float32)
    a *= 255.0 / np.array([251.0, 252.0, 252.0])
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def resize(im, w=None, h=None):
    if h is not None:
        w = round(im.width * h / im.height)
    else:
        h = round(im.height * w / im.width)
    return im.resize((w, h), Image.LANCZOS)

clean = whiten(master)

# Header: Solar + withPhilip.com wordmark, tagline cropped off.
header = clean.crop((70, 282, 1187, 901))
resize(header, h=168).save(os.path.join(IMG, 'swp-logo-header.webp'), lossless=True, quality=100, method=6)

# Full logo including tagline.
full = clean.crop((60, 272, 1197, 977))
resize(full, w=900).save(os.path.join(IMG, 'swp-logo-full-900.webp'), lossless=True, quality=100, method=6)
resize(full, w=480).save(os.path.join(IMG, 'swp-logo-full-480.webp'), lossless=True, quality=100, method=6)

# Icon: the sun-and-"o" mark. Navy pixels of the neighbouring "S" (left of the sun) are masked to white.
a = np.array(clean).astype(int)
sun = a[288:672, 296:668].copy()
gold = (sun[..., 0] > sun[..., 2] + 25)
xs = np.arange(sun.shape[1]) + 296
outside = (xs < 352) | (xs > 632)
sun[(~gold) & outside[None, :]] = 255
sun_img = Image.fromarray(sun.astype(np.uint8))
side = max(sun_img.size)
sq = Image.new('RGB', (side, side), (255, 255, 255))
sq.paste(sun_img, ((side - sun_img.width) // 2, (side - sun_img.height) // 2))
sq.save(os.path.join(IMG, 'swp-logo-icon-src.png'))

def tile(n, pad):
    inner = round(n * (1 - 2 * pad))
    t = Image.new('RGB', (n, n), (255, 255, 255))
    t.paste(sq.resize((inner, inner), Image.LANCZOS), ((n - inner) // 2, (n - inner) // 2))
    return t

tile(32, .04).save(os.path.join(IMG, 'favicon-32.png'), optimize=True)
tile(180, .10).save(os.path.join(IMG, 'apple-touch-icon.png'), optimize=True)
tile(180, .10).save(os.path.join(ROOT, 'apple-touch-icon.png'), optimize=True)
tile(192, .06).save(os.path.join(IMG, 'icon-192.png'), optimize=True)
tile(256, .04).save(os.path.join(ROOT, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
print('done')
