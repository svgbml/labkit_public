# Maakt een realistische testgel: 2° scheef, ongelijke belichting, smeer, putjes, lege lanen, primer-dimeren.
# Ladder 100 bp (1000-100) in lane 1, producten van 650 bp en dimeren van 60 bp. Gebruik: python tests/make_test_gel.py
# Synthetic "real-like" gel: tilt, uneven illumination, smear, wells, empty lanes, light background (inverted)
from PIL import Image, ImageDraw, ImageFilter
import numpy as np, math, random
random.seed(1); np.random.seed(1)
W,H=900,620; img=np.zeros((H,W),float)
yy,xx=np.mgrid[0:H,0:W]; img+=18+30*np.exp(-((xx-300)**2+(yy-250)**2)/(2*350**2))  # uneven illumination
nL=11; pitch=72; x0=85
lad=[1000,900,800,700,600,500,400,300,200,100]; Y=lambda bp: 70+(3-math.log10(bp))*430
def band(cx,y,amp,wd=50,hh=4.5):
    img[...] += amp*np.exp(-((xx-cx)/(wd/2))**8)*np.exp(-((yy-y)/hh)**2)
for i in range(nL):
    cx=x0+i*pitch
    band(cx,40,55,54,4)   # well
    if i==0:
        for bp in lad: band(cx,Y(bp),170 if bp==500 else 120)
    elif i in (4,8): pass   # empty lanes
    elif i==nL-1: band(cx,Y(60),40)  # NTC with dimer
    else:
        band(cx,Y(650),random.uniform(90,180)); band(cx,Y(60),35)
        img[...]+= 25*np.exp(-((xx-cx)/26)**8)*((yy>Y(650))&(yy<Y(650)+60))*np.exp(-(yy-Y(650))/30)   # smear
img+=np.random.normal(0,6,img.shape); img=np.clip(img,0,255).astype(np.uint8)
im=Image.fromarray(img).filter(ImageFilter.GaussianBlur(1.2)).rotate(2.0,resample=Image.BICUBIC,fillcolor=20)
im.save('tests/fixtures/gel_realistic.png')
print('expected lanes',[x0+i*pitch for i in range(nL)])
