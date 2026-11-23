<!-- ================= VERDUNNINGSREEKS: KOLONIES TELLEN UIT EEN FOTO (S59) =================
     Een foto van een petrischaal: countColonies() (src/lib/colonycount.js) zoekt de schaal en de
     kolonies erbinnen. Tik op een kolonie om hem weg te halen, op lege agar om er een toe te voegen.
     "Zet in de verdunningsreeks" zet het totaal bij de gekozen buis en plaat van de tabel (event
     `fill(buis, plaat, aantal)`, Reeks.vue roept er edit() mee aan). Id's: r-photo, r-thr, r-pcv,
     r-pbuis, r-pplaat, r-pfill. -->
<template>
  <details style="margin-top:12px" @toggle="open = $event.target.open">
    <summary>{{ t('Kolonies tellen uit een foto') }}</summary>
    <template v-if="open">
    <div class="fields" style="margin-top:8px">
      <div class="f">
        <label for="r-photo">{{ t('Foto van de plaat (van boven)') }}</label>
        <input id="r-photo" type="file" accept="image/*" @change="load">
      </div>
      <div class="f">
        <label for="r-thr">{{ t('Drempel (hoger = alleen duidelijke kolonies)') }}</label>
        <input id="r-thr" type="range" min="3" max="12" step="1" v-model="thr" @change="detect">
      </div>
    </div>
    <template v-if="res">
      <canvas id="r-pcv" style="width:100%;margin-top:8px;cursor:crosshair;touch-action:manipulation" @pointerup="tap"></canvas>
      <lk-kv :rows="[[t('Kolonies'), total]]"/>
      <div class="fields" style="margin-top:8px">
        <div class="f">
          <label for="r-pbuis">{{ t('Buis') }}</label>
          <select id="r-pbuis" v-model="tube">
            <option v-for="i in tubes" :key="i" :value="i">{{ t('Buis ' + i) }}</option>
          </select>
        </div>
        <div class="f">
          <label for="r-pplaat">{{ t('Plaat') }}</label>
          <select id="r-pplaat" v-model="plate">
            <option :value="0">{{ t('Plaat 1') }}</option>
            <option :value="1">{{ t('Plaat 2') }}</option>
          </select>
        </div>
      </div>
      <div class="row" style="margin-top:8px">
        <button type="button" id="r-pfill" @click="$emit('fill', +tube, +plate, String(total))">{{ t('Zet in de verdunningsreeks') }}</button>
      </div>
    </template>
    <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('Elke gevonden kolonie krijgt een groene cirkel; een getal erbij betekent dat een klont als meer kolonies telt. De blauwe stippellijn is de gevonden schaal: alles daarbuiten en de rand zelf tellen niet mee. Tik op een kolonie om hem weg te halen, tik op lege agar om er een toe te voegen.') }}</p>
    </template>
  </details>
</template>

<script>
import {countColonies} from '../lib/colonycount.js';

export default {
  name: 'KolonieFoto',
  props: {tubes: {type: Array, default: () => []}},
  emits: ['fill'],
  data() { return {thr: '6', res: null, open: false, tube: 1, plate: 0}; },
  computed: {
    total() { return this.res.colonies.reduce((a, c) => a + c.n, 0); }
  },
  updated() { this.draw(); },
  methods: {
    /* de foto verkleind tot hoogstens 1000 px; de pixels blijven buiten Vue (zoals in TelFoto.vue) */
    load(e) {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      this.res = null;   /* de telling van de vorige foto weg tot deze geteld is */
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
      this.res = countColonies(c.getContext('2d').getImageData(0, 0, c.width, c.height).data, c.width, c.height, {sens: num(this.thr)});
    },
    draw() {
      const cv = document.getElementById('r-pcv'), c = this._img; if (!cv || !c || !this.res) return;
      cv.width = c.width; cv.height = c.height;
      const x = cv.getContext('2d'), lw = Math.max(2, c.width / 400), D = this.res.dish;
      x.drawImage(c, 0, 0); x.lineWidth = lw; x.font = `bold ${Math.round(lw * 7)}px sans-serif`;
      x.setLineDash([4 * lw, 3 * lw]); x.strokeStyle = '#2f80ed'; x.beginPath(); x.arc(D.x, D.y, D.r, 0, 2 * Math.PI); x.stroke(); x.setLineDash([]);
      x.strokeStyle = x.fillStyle = '#18a957';
      this.res.colonies.forEach(p => {
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, 2 * Math.PI); x.stroke();
        if (p.n > 1) x.fillText(String(p.n), p.x + p.r, p.y - p.r);
      });
    },
    /* tik op een kolonie: weg; op lege agar binnen de schaal: een kolonie erbij */
    tap(e) {
      const cv = e.currentTarget, b = cv.getBoundingClientRect(), X = (e.clientX - b.left) * cv.width / b.width, Y = (e.clientY - b.top) * cv.height / b.height;
      const {dish, colonies} = this.res, hit = colonies.find(p => Math.hypot(p.x - X, p.y - Y) <= p.r);
      if (hit) this.res = {dish, colonies: colonies.filter(p => p !== hit)};
      else if (Math.hypot(X - dish.x, Y - dish.y) < dish.r) {
        const r = colonies.length ? colonies.reduce((a, p) => a + p.r, 0) / colonies.length : 8;
        this.res = {dish, colonies: [...colonies, {x: X, y: Y, r, n: 1}]};
      }
    }
  }
};
</script>
