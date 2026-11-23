"""Testfoto's voor kolonies tellen uit een foto (S59): een petrischaal van boven.

Donkere ondergrond, de schaalrand als lichte ring met een smalle reflectie erbinnen, agar met een
helderheidsverloop, ruis en een lichte onscherpte. Vaste seed, dus het aantal is bekend:
python tests/fixtures/make_colonies.py schrijft
  colonies_light.png: 40 losse donkere kolonies op lichte agar;
  colonies_dark.png: 150 lichte kolonies op donkere agar, waarvan 12 paren die elkaar raken (24 kolonies).
"""
import pathlib
import cv2
import numpy as np

HERE = pathlib.Path(__file__).parent


def make(path, n_single, n_pair, agar, colony, rmin, rmax, seed, w=800, h=760):
    rng = np.random.default_rng(seed)
    cx, cy, R = w / 2 + 15, h / 2 - 10, 330
    yy, xx = np.mgrid[0:h, 0:w]
    img = np.zeros((h, w, 3), np.float32); img[:] = (38, 40, 44)            # tafel (BGR)
    s = 4                                                                    # subpixel-shift van cv2
    C = (int(cx * s), int(cy * s))
    cv2.circle(img, C, int((R + 16) * s), (175, 178, 180), -1, cv2.LINE_AA, 2)  # schaalwand
    cv2.circle(img, C, int((R + 9) * s), (120, 122, 125), -1, cv2.LINE_AA, 2)
    cv2.circle(img, C, int(R * s), agar, -1, cv2.LINE_AA, 2)                    # agar
    cv2.ellipse(img, C, (int((R - 8) * s), int((R - 8) * s)), 0, 200, 300, (235, 235, 235), 2 * s, cv2.LINE_AA, 2)  # reflectie
    units = []                                                               # (x, y, straal van de eenheid, [kolonies])
    while len(units) < n_single + n_pair:
        pair = len(units) < n_pair
        r1, r2 = rng.uniform(rmin, rmax), rng.uniform(rmin, rmax)
        ext = r1 + 2 * r2 if pair else r1
        a, q = rng.uniform(0, 2 * np.pi), (R - 30 - ext) * np.sqrt(rng.uniform(0, 1))
        x, y = cx + q * np.cos(a), cy + q * np.sin(a)
        if all((x - u) ** 2 + (y - v) ** 2 > (ext + e + 1.5 * rmax) ** 2 for u, v, e, _ in units):
            if pair:
                b = rng.uniform(0, 2 * np.pi); d = r1 + r2 - 1                 # raken elkaar net
                cols = [(x, y, r1), (x + d * np.cos(b), y + d * np.sin(b), r2)]
            else:
                cols = [(x, y, r1)]
            units.append((x, y, ext, cols))
    for _, _, _, cols in units:
        for x, y, r in cols:
            cv2.circle(img, (int(x * s), int(y * s)), int(r * s), colony, -1, cv2.LINE_AA, 2)
    shade = 1 + 0.15 * (xx - w / 2) / w + 0.08 * (yy - h / 2) / h            # verloop
    img = cv2.GaussianBlur(img * shade[..., None], (0, 0), 1.0) + rng.normal(0, 4, img.shape)
    cv2.imwrite(str(path), np.clip(img, 0, 255).astype(np.uint8))


if __name__ == '__main__':
    make(HERE / 'colonies_light.png', 40, 0, (150, 200, 215), (90, 120, 140), 7, 12, 1)
    make(HERE / 'colonies_dark.png', 126, 12, (40, 45, 120), (175, 195, 205), 5, 8, 2)
