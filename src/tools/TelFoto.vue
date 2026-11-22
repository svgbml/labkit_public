<!-- ================= TELKAMER: TELLEN UIT EEN FOTO (S60) =================
     Een microscoopfoto van één vak: countCells() (src/lib/cellcount.js) zoekt de cellen en deelt ze
     op kleur in (trypaanblauw = dood). Tik op een cel: levend → dood → weg; tik ernaast: een
     levende cel erbij. "Invullen als één vak" zet de aantallen achter de tellingen van de
     Telkamer (event `fill`). Id's: k-photo, k-thr, k-pcv, k-pfill. -->
<template>
  <details class="f" style="margin-top:12px">
    <summary>{{ t('Tellen uit een foto') }}</summary>
    <div class="fields" style="margin-top:8px">
      <div class="f">
        <label for="k-photo">{{ t('Foto van één vak') }}</label>
        <input id="k-photo" type="file" accept="image/*" @change="load">
      </div>
      <div class="f">
        <label for="k-thr">{{ t('Drempel (hoger = alleen duidelijke cellen)') }}</label>
        <input id="k-thr" type="range" min="3" max="12" step="1" v-model="thr" @change="detect">
      </div>
    </div>
    <template v-if="cells">
      <canvas id="k-pcv" style="width:100%;margin-top:8px;cursor:crosshair" @click="tap"></canvas>
      <lk-kv :rows="[[t('Levend'), n.live], [t('Dood (blauw)'), n.dead]]"/>
      <div class="row" style="margin-top:8px">
        <button type="button" id="k-pfill" @click="$emit('fill', n)">{{ t('Invullen als één vak') }}</button>
      </div>
    </template>
    <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('Groen = levend, rood omlijnd = dood (blauw gekleurd). Tik op een cel om hem dood te maken, nog eens om hem weg te halen; tik naast een cel om er een toe te voegen. Klonten tellen op oppervlak (het getal erbij); kijk ze na. De lijnen van de telkamer worden genegeerd.') }}</p>
  </details>
</template>

<script>
import {countCells} from '../lib/cellcount.js';

export default {
  name: 'TelFoto',
  emits: ['fill'],
  data() { return {thr: '6', cells: null}; },
  computed: {
    n() {
      const s = (d) => this.cells.filter(c => c.dead === d).reduce((a, c) => a + c.n, 0);
      return {live: s(false), dead: s(true)};
    }
  },
  updated() { this.draw(); },
  methods: {
    /* de foto verkleind tot hoogstens 1000 px; de pixels blijven buiten Vue (geen proxy op een grote array) */
    load(e) {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const img = new Image(), url = URL.createObjectURL(f);
      img.onload = () => {
        const k = Math.min(1, 1000 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        this._img = c; this.detect();
      };
      img.src = url;
    },
    detect() {
      const c = this._img; if (!c) return;
      this.cells = countCells(c.getContext('2d').getImageData(0, 0, c.width, c.height).data, c.width, c.height, num(this.thr));
    },
    draw() {
      const cv = document.getElementById('k-pcv'), c = this._img; if (!cv || !c || !this.cells) return;
      cv.width = c.width; cv.height = c.height;
      const x = cv.getContext('2d'), lw = Math.max(2, c.width / 400);
      x.drawImage(c, 0, 0); x.lineWidth = lw; x.font = `bold ${Math.round(lw * 7)}px sans-serif`;
      this.cells.forEach(p => {
        x.strokeStyle = p.dead ? '#e0201b' : '#18a957'; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 2 * Math.PI); x.stroke();
        if (p.n > 1) { x.fillStyle = x.strokeStyle; x.fillText(String(p.n), p.x + p.r, p.y - p.r); }
      });
    },
    /* tik: op een cel levend → dood → weg, ernaast een levende cel erbij */
    tap(e) {
      const cv = e.currentTarget, b = cv.getBoundingClientRect(), X = (e.clientX - b.left) * cv.width / b.width, Y = (e.clientY - b.top) * cv.height / b.height;
      const hit = this.cells.find(p => Math.hypot(p.x - X, p.y - Y) <= p.r);
      const r = this.cells.length ? this.cells.reduce((a, p) => a + p.r, 0) / this.cells.length : 10;
      if (!hit) this.cells = [...this.cells, {x: X, y: Y, r, n: 1, dead: false}];
      else if (!hit.dead) this.cells = this.cells.map(p => p === hit ? {...p, dead: true} : p);
      else this.cells = this.cells.filter(p => p !== hit);
    }
  }
};
</script>
