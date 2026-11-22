"""Testfoto's voor de celtelling uit een foto (S60): een telkamervak met trypaanblauw.

Levende cellen: heldere kern met een donkere rand; dode cellen: egaal blauw. Erdoor lopen de
lijnen van de kamer (enkel en driedubbel), met een helderheidsverloop, ruis en een lichte
onscherpte. Vaste seed, dus het aantal is bekend: python tests/fixtures/make_cells.py schrijft
cells_trypan.png (45 levend, 12 dood) en cells_dense.png (80 levend, 30 dood, kleinere cellen).
"""
import pathlib
import cv2
import numpy as np

HERE = pathlib.Path(__file__).parent


def make(path, n_live, n_dead, rmin, rmax, seed, w=800, h=600):
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w]
    img = np.zeros((h, w, 3), np.float32)
    shade = 1 - 0.12 * (((xx - w / 2) / w) ** 2 + ((yy - h / 2) / h) ** 2) * 4   # vignettering
    for c, v in enumerate((200, 205, 208)):   # BGR, iets koel licht
        img[..., c] = v * shade
    for k in range(0, w, 200):                   # kamerlijnen, de eerste driedubbel
        for d in ((-6, 0, 6) if k == 200 else (0,)):
            cv2.line(img, (k + 100 + d, 0), (k + 100 + d, h), (120, 120, 120), 2)
    for k in (150, 450):
        cv2.line(img, (0, k), (w, k), (120, 120, 120), 2)
    pts = []
    while len(pts) < n_live + n_dead:
        r = rng.uniform(rmin, rmax); x = rng.uniform(r + 4, w - r - 4); y = rng.uniform(r + 4, h - r - 4)
        if all((x - a) ** 2 + (y - b) ** 2 > (2.2 * max(r, s)) ** 2 for a, b, s in pts):
            pts.append((x, y, r))
    for i, (x, y, r) in enumerate(pts):
        c = (int(round(x * 4)), int(round(y * 4))); R = int(round(r * 4))
        if i < n_live:
            cv2.circle(img, c, R, (70, 72, 75), -1, cv2.LINE_AA, 2)
            cv2.circle(img, c, int(R * 0.7), (238, 240, 240), -1, cv2.LINE_AA, 2)
        else:
            cv2.circle(img, c, R, (150, 90, 55), -1, cv2.LINE_AA, 2)   # BGR: blauw
            cv2.circle(img, c, int(R * 0.6), (170, 110, 75), -1, cv2.LINE_AA, 2)
    img = cv2.GaussianBlur(img, (0, 0), 1.0) + rng.normal(0, 4, img.shape)
    cv2.imwrite(str(path), np.clip(img, 0, 255).astype(np.uint8))


if __name__ == '__main__':
    make(HERE / 'cells_trypan.png', 45, 12, 9, 12, 1)
    make(HERE / 'cells_dense.png', 80, 30, 6, 8, 2)
