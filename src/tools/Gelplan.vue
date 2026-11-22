<!-- ================= GELPLANNER =================
     De tool bestaat uit twee tekeningen (de gel van bovenaf en de verwachte gel), een paneel
     met instellingen, de laantabel en drie uitkomstblokken. Het tekenwerk blijft op het
     canvas met de gewone tekencontext: `gpDrawTop()` in `tools/nt/48_gplan.js` wordt na elke
     render opnieuw aangeroepen, net als bij de Z′-factor en de buffercapaciteit.

     S255 zette de instellingen, de laantabel en de uitkomstenlijst onder de gel in Vue, S256
     de verwachte gel, de receptkaart voor het gieten en de looptijd. In de module blijven de
     twee tekeningen (gpDrawTop, gpDrawPredict) en het rekenwerk eronder staan.

     De id's gp-title, gp-type, gp-lad, gp-tray, gp-comb, gp-ladlane, gp-pct, gp-volt, gp-elec,
     gp-buf, gp-stain, gp-dyex, gp-tooth, gp-thick, gp-gelmm, gp-dye, gp-note, gp-auto, gp-cv,
     gp-out, gpp-cv, gpp-out, gp-tbl, gp-tbl-add, gp-cast en gp-run blijven zoals ze waren. -->
<template>
  <div class="picwrap">
    <div class="pic-prev">
      <div class="result">
        <canvas id="gp-cv"></canvas>
        <div class="pic-bar" v-html="picBarTop"></div>
        <div id="gp-out">
          <lk-kv :rows="rows"/>
          <lk-note v-for="(n, i) in notes" :key="i" :kind="n.kind" :html="n.html"/>
        </div>
      </div>
      <div class="result" style="margin-top:16px">
        <h3 style="margin:0 0 10px;font-size:14px">{{ t('Verwachte gel') }}</h3>
        <canvas id="gpp-cv" v-show="predict.show"></canvas>
        <div class="pic-bar" v-html="picBarPred"></div>
        <div id="gpp-out">
          <lk-note v-for="(n, i) in predict.notes" :key="i" :kind="n.kind" :html="n.html"/>
          <lk-kv v-if="predict.rows" :rows="predict.rows"/>
        </div>
      </div>
    </div>
    <div>
      <div class="panel">
        <div class="fields">
          <div class="f" style="grid-column:1/-1">
            <label for="gp-title">{{ t('Titel') }}</label>
            <input id="gp-title" class="txt" v-model="title">
          </div>
          <div class="f">
            <label for="gp-type">{{ t('Geltype') }}</label>
            <select id="gp-type" style="width:100%" v-model="type">
              <option value="dna">{{ t('Agarose (DNA)') }}</option>
              <option value="sds">{{ t('SDS-PAGE (eiwit)') }}</option>
            </select>
          </div>
          <div class="f">
            <label for="gp-lad">{{ t('Ladder') }}</label>
            <select id="gp-lad" style="width:100%" v-model="lad">
              <option v-for="l in ladders" :key="l[0]" :value="l[0]">{{ t(l[1]) }}</option>
            </select>
          </div>
          <div class="f">
            <label for="gp-tray">{{ t('Geldrager') }}</label>
            <select id="gp-tray" style="width:100%" v-model="tray">
              <option v-for="o in TRAYS" :key="o.v" :value="o.v">{{ t(o.n) }}</option>
            </select>
          </div>
          <lk-field v-model="comb" :label="t('Tanden op de kam')" for-id="gp-comb" inputmode="numeric"/>
          <lk-field v-model="ladlane" :label="t('Ladder in laan')" for-id="gp-ladlane" inputmode="numeric"/>
          <div class="f" data-expert="">
            <label for="gp-pct">{{ t('Gelpercentage') }}</label>
            <div class="inu"><input id="gp-pct" inputmode="decimal" v-model="pct"><span class="u">% w/v</span></div>
          </div>
          <lk-field v-model="volt" :label="t('Spanning')" for-id="gp-volt" unit="V"/>
          <lk-field v-model="elec" :label="t('Afstand tussen de elektroden')" for-id="gp-elec" unit="cm"/>
          <div class="f">
            <label for="gp-buf">{{ t('Loopbuffer (stock)') }}</label>
            <select id="gp-buf" style="width:100%" v-model="buf">
              <option v-for="o in BUFS" :key="o.v" :value="o.v">{{ lkNum(o.n) }}</option>
            </select>
          </div>
          <div class="f">
            <label for="gp-stain">{{ t('Kleuring in de gel') }}</label>
            <select id="gp-stain" style="width:100%" v-model="stain">
              <option v-for="o in STAINS" :key="o.v" :value="o.v">{{ t(o.n) }}</option>
            </select>
          </div>
          <lk-field v-model="dyex" :label="t('Laadbuffer sterkte')" for-id="gp-dyex" unit="×"/>
          <div class="f" data-expert="">
            <label for="gp-tooth">{{ t('Breedte van een tand') }}</label>
            <div class="inu"><input id="gp-tooth" inputmode="decimal" v-model="tooth"><span class="u">mm</span></div>
          </div>
          <div class="f" data-expert="">
            <label for="gp-thick">{{ t('Dikte van de kam') }}</label>
            <div class="inu"><input id="gp-thick" inputmode="decimal" v-model="thick"><span class="u">mm</span></div>
          </div>
          <div class="f" data-expert="">
            <label for="gp-gelmm">{{ t('Dikte van de gel') }}</label>
            <div class="inu"><input id="gp-gelmm" inputmode="decimal" v-model="gelmm"><span class="u">mm</span></div>
          </div>
          <div class="f">
            <label for="gp-dye">{{ t('Laadbuffer') }}</label>
            <input id="gp-dye" class="txt" v-model="dye">
          </div>
          <div class="f" style="grid-column:1/-1">
            <label for="gp-note">{{ t('Eigen tekst onder het schema') }}</label>
            <textarea id="gp-note" rows="2" v-model="note"
              :placeholder="t('Bijv. verwachte fragmentgrootten, looptijd of een verwijzing naar het protocol')"></textarea>
          </div>
          <label class="chk" for="gp-auto" style="grid-column:1/-1">
            <input type="checkbox" id="gp-auto" v-model="auto"> {{ t('Standaardtoelichting tonen') }}
          </label>
        </div>
        <div class="tbl-wrap" style="margin-top:12px">
          <lk-etable table-id="gp-tbl" :cols="cols" v-model:rows="lanes" add-id="gp-tbl-add" :wrap="false"/>
        </div>
        <div class="row" style="margin-top:8px">
          <button type="button" id="gp-tbl-add" @click="addLane">{{ t('+ Laan') }}</button>
          <button type="button" data-smp="gplan">{{ t('Monsters…') }}</button>
          <button type="button" id="gp-bench" @click="bench">{{ t('Bench-modus') }}</button>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0" v-html="tHtml(hint)"></p>
      </div>
      <div class="result" id="gp-cast" style="margin-top:16px">
        <h3 style="margin:0 0 6px;font-size:14px">{{ t('Gel gieten') }}</h3>
        <lk-note v-for="(n, i) in cast.notes" :key="i" :kind="n.kind" :html="n.html"/>
        <lk-kv v-if="cast.rows" :rows="cast.rows"/>
        <lk-note v-for="(n, i) in cast.after" :key="'a' + i" :kind="n.kind" :html="n.html"/>
        <p v-if="cast.tail" style="font-size:12.5px;color:var(--muted);margin:8px 0 0">{{ cast.tail }}</p>
      </div>
      <div class="result" id="gp-run" style="margin-top:16px">
        <h3 style="margin:0 0 6px;font-size:14px">{{ t('Looptijd') }}</h3>
        <lk-kv v-if="run.rows" :rows="run.rows"/>
        <lk-note v-for="(n, i) in run.notes" :key="i" :kind="n.kind" :html="n.html"/>
        <p v-if="run.tail" style="font-size:12.5px;color:var(--muted);margin:8px 0 0">{{ run.tail }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn, lkPicBar} from '../lib/bridge.js';

/* een voorbeeldwaarde in een veld: V() voor tekst, lkNumIn() voor getallen. Dat deed
   i18nValue() eerder zelf; binnen een Vue-boom komt die laag niet. */
const V = s => (typeof trPlain === 'function' ? trPlain(s, true) : s);

const TRAYS = [{v: '7x7', n: 'Mini, 7 × 7 cm'}, {v: '7x10', n: 'Mini, 7 × 10 cm'},
  {v: '10x15', n: 'Midi, 10 × 15 cm'}, {v: '15x15', n: 'Midi, 15 × 15 cm'},
  {v: '20x25', n: 'Maxi, 20 × 25 cm'}];
const BUFS = [{v: '50', n: '50× TAE'}, {v: '10', n: '10× TBE'}, {v: '5', n: '5× TBE'}];
const STAINS = [{v: 'g10k', n: 'GelRed of SYBR Safe, 10 000× stock'},
  {v: 'etbr', n: 'Ethidiumbromide, 10 mg/mL'}, {v: 'none', n: 'Geen (achteraf kleuren)'}];
const HINT = 'De lanen worden van links naar rechts in de slotjes gezet. Laat de naam leeg om '
  + 'een slotje over te slaan. Zet bij <i>Verwachte banden</i> de grootten die je verwacht, '
  + 'gescheiden door een spatie; die worden in de verwachte gel getekend.';

export default {
  name: 'Gelplan',
  data() {
    return {
      title: V('1% agarosegel, 1× TAE, 100 V'), type: 'dna', lad: '100', tray: '7x10',
      comb: '10', ladlane: '1', pct: '1', volt: '100', elec: '15', buf: '50', stain: 'g10k',
      dyex: '6', tooth: lkNumIn('5,5'), thick: lkNumIn('1,5'), gelmm: '6',
      dye: V('6× loading dye'), note: '', auto: true,
      lanes: [[V('Ladder'), '5', '', '#c2410c'], [V('Monster 1'), '10', '500', '#1558b0'],
        [V('Monster 2'), '10', '1500 700', '#1558b0'], [V('Negatieve controle'), '10', '', '#5f6b7a']]
    };
  },
  computed: {
    TRAYS() { return TRAYS; },
    BUFS() { return BUFS; },
    STAINS() { return STAINS; },
    hint() { return HINT; },
    picBarTop() { return lkPicBar('gp'); },
    picBarPred() { return lkPicBar('gpp'); },
    /* de ladders van het gekozen geltype; de lijst zelf staat in tools/nt/48_gplan.js */
    ladders() { return GPLAD[this.type === 'sds' ? 'sds' : 'dna']; },
    cols() {
      const t = this.t;
      return [{h: t('Monster'), t: 'txt', w: 150}, {h: t('Monster (µL)'), t: 'num', w: 72},
        {h: t('Verwachte banden'), t: 'txt', w: 120}, {h: t('Kleur'), t: 'col', d: '#1558b0'}];
    },
    teeth() { return Math.max(1, Math.min(30, Math.round(num(this.comb) || 10))); },
    /* de lanen die in de slotjes passen */
    used() { return this.lanes.slice(0, this.teeth).filter(r => String(r[0] || '').trim()); },
    /* de banden van de gekozen ladder en de eenheid erbij; de groottes komen uit LADDERS van
       de tool Agarosegel. De module heeft hier gpBands() en gpUnit() voor, maar die lezen de
       velden uit de DOM en een computed draait al vóór de eerste render. */
    bands() { return (typeof LADDERS !== 'undefined' && LADDERS[this.lad]) || []; },
    unit() { return this.type === 'sds' ? 'kDa' : 'bp'; },
    /* slotvolume uit de maten van kam en gel; 1 mm³ = 1 µL en een slotje wordt tot 80% gevuld
       (GPFILL en GPFLOOR staan in tools/nt/48_gplan.js) */
    cap() {
      const w = num(this.tooth), t = num(this.thick), d = num(this.gelmm) - GPFLOOR;
      if (!(w > 0) || !(t > 0) || !(d > 0)) return null;
      const geom = w * t * d;
      return {geom, max: geom * GPFILL};
    },
    /* laadbuffer: bij 6× hoort 1 deel buffer op 5 delen monster */
    dyeX() { const x = num(this.dyex); return x > 1 ? x : 0; },
    /* het laadvolume per laan is het monster plus de laadbuffer */
    totals() {
      const x = this.dyeX, add = v => (x && isFinite(v) && v > 0 ? v / (x - 1) : 0);
      const vols = this.used.map(r => num(r[1])).filter(v => isFinite(v) && v > 0);
      return {tot: vols.map(v => v + add(v)), dye: vols.reduce((a, v) => a + add(v), 0)};
    },
    rows() {
      const t = this.t, T = this.totals, cap = this.cap, bb = this.bands;
      const N = (v, d) => lkNumIn(NL(v, d));
      return [[t('Gebruikte slotjes'), t(this.used.length + ' van ' + this.teeth)],
        [t('Grootste laadvolume per slotje'), T.tot.length ? N(Math.max(...T.tot), 1) + ' µL' : '–'],
        [t('Totaal te laden'), T.tot.length ? N(T.tot.reduce((a, b) => a + b, 0), 1) + ' µL' : '–'],
        [t('Laadbuffer in totaal'), T.dye ? N(T.dye, 1) + ' µL' : '–'],
        [t('Slotvolume (tot 80% vullen)'),
          cap ? t(NL(cap.max, 1) + ' µL van ' + NL(cap.geom, 1) + ' µL') : '–'],
        [t('Ladder'), bb.length
          ? t(bb.length + ' banden, ' + NL(bb[bb.length - 1], 0) + '–' + NL(bb[0], 0) + ' '
            + this.unit)
          : '–']];
    },
    notes() {
      const t = this.t, cap = this.cap, out = [];
      if (cap) {
        const over = this.totals.tot.filter(v => v > cap.max).length;
        if (over) {
          out.push({kind: 'bad', html: t(over + ' laan(en) laden meer dan de ' + NL(cap.max, 1)
            + ' µL die in een slotje past; het monster loopt dan over in de buurlaan.')});
        }
      } else {
        out.push({kind: 'warn',
          html: t('Vul de maten van de kam en de gel in om het slotvolume te berekenen.')});
      }
      if (this.lanes.length > this.teeth) {
        out.push({kind: 'warn', html: t('Er staan ' + this.lanes.length + ' lanen in de tabel maar '
          + 'de kam heeft ' + this.teeth + ' tanden; de laatste lanen worden niet getekend.')});
      }
      return out;
    },

    /* ---------- de verwachte gel ---------- */
    /* alle verwachte bandgrootten die in de slotjes staan */
    sizes() { return this.lanes.slice(0, this.teeth).flatMap(r => gpSizes(r[2])); },
    predict() {
      const t = this.t, bb = this.bands, sds = this.type === 'sds';
      const lanes = this.lanes.slice(0, this.teeth);
      const ladLane = Math.max(0, Math.min(30, Math.round(num(this.ladlane) || 0)));
      const any = lanes.some(r => gpSizes(r[2]).length);
      if (!bb.length || (!any && !ladLane)) {
        return {show: false, notes: [{kind: 'info',
          html: t('Vul bij een laan de verwachte banden in om de verwachte gel te tekenen.')}]};
      }
      const lo = bb[bb.length - 1], hi = bb[0], all = this.sizes, notes = [];
      const high = all.filter(v => v > hi).length, low = all.filter(v => v < lo).length;
      if (high) {
        notes.push({kind: 'warn', html: t(high + ' verwachte band(en) zijn groter dan de '
          + 'grootste ladderband; die positie is een schatting.')});
      }
      if (low) {
        notes.push({kind: 'warn', html: t(low + ' verwachte band(en) zijn kleiner dan de '
          + 'kleinste ladderband; die positie is een schatting.')});
      }
      if (!sds && typeof GELR !== 'undefined' && all.length) {
        const pct = num(this.pct), cur = GELR.find(g => Math.abs(g[0] - pct) < 1e-9);
        if (cur) {
          const bad = all.filter(v => v < cur[1] || v > cur[2]).length;
          if (bad) {
            notes.push({kind: 'warn', html: t('Bij ' + NL(pct, 1) + '% agarose scheidt de gel '
              + NL(cur[1], 0) + '\u2013' + NL(cur[2], 0) + ' bp; ' + bad
              + ' verwachte band(en) vallen daarbuiten.')});
          }
        }
      }
      return {show: true, notes,
        rows: notes.length ? null : [[t('Verwachte banden'), lkNumIn(NL(all.length, 0))],
          [t('Lanen met banden'), lkNumIn(NL(lanes.filter(r => gpSizes(r[2]).length).length, 0))]]};
    },

    /* ---------- gel gieten: percentage-advies en receptkaart ---------- */
    cast() {
      const t = this.t, sds = this.type === 'sds';
      if (sds) {
        return {notes: [{kind: 'info', html: t('Een SDS-PAGE-gel giet je met acrylamide, niet '
          + 'met agarose; gebruik het protocol van je practicum voor het scheidings- en stapelgel.')}]};
      }
      const [tw, tl] = GPTRAY[this.tray] || GPTRAY['7x10'];
      const thick = num(this.gelmm), pct = num(this.pct), sizes = this.sizes, notes = [];
      /* welk percentage scheidt alle verwachte fragmenten: het bereik waarvan het midden het
         dichtst bij het midden van de fragmenten ligt */
      if (sizes.length && typeof GELR !== 'undefined') {
        const lo = Math.min(...sizes), hi = Math.max(...sizes);
        const fits = GELR.filter(g => lo >= g[1] && hi <= g[2]);
        let best = null, bd = 1e9;
        fits.forEach(g => {
          const mid = (Math.log10(g[1]) + Math.log10(g[2])) / 2;
          const d = Math.abs((Math.log10(lo) + Math.log10(hi)) / 2 - mid);
          if (d < bd) { bd = d; best = g; }
        });
        if (best) {
          const same = Math.abs(best[0] - pct) < 1e-9;
          notes.push({kind: same ? 'ok' : 'info',
            html: t('Voor ' + NL(lo, 0) + '\u2013' + NL(hi, 0) + ' bp is ' + NL(best[0], 1)
              + '% agarose de beste keus (scheidt ' + NL(best[1], 0) + '\u2013' + NL(best[2], 0)
              + ' bp).')
              + (same ? '' : ` <button type="button" class="ghost" data-gp-pct="${best[0]}">`
                + t('Overnemen') + '</button>')});
        } else {
          notes.push({kind: 'warn', html: t('Geen enkel percentage scheidt ' + NL(lo, 0) + ' tot '
            + NL(hi, 0) + ' bp in één gel; overweeg twee gels of een ander bereik.')});
        }
      }
      const V = thick > 0 ? tw * tl * (thick / 10) : NaN;      /* cm × cm × cm = mL */
      const g = isFinite(V) ? pct / 100 * V : NaN;
      const stock = num(this.buf), st = isFinite(V) ? V / stock : NaN;
      const bufName = (BUFS.find(o => o.v === this.buf) || BUFS[0]).n;
      const [stName, stFn] = GPSTAIN[this.stain] || GPSTAIN.none;
      const rows = [[t('Gelvolume'), isFinite(V) ? t(NL(V, 0) + ' mL') : '–'],
        [t('Agarose afwegen'), isFinite(g) ? lkNumIn(mass(g)) : '–'],
        [t('Loopbuffer voor de gel'),
          isFinite(st) ? t(uv(bufName) + ' ' + vol(st * 1000)) : '–'],
        [t('+ water'), isFinite(V) ? lkNumIn(vol((V - st) * 1000)) : '–']];
      if (stName && isFinite(V)) rows.push([t(stName), lkNumIn(vol(stFn(V)))]);
      /* deze waarschuwing staat onder de receptkaart, op de plek van de regel met de maten */
      const after = thick > 0 ? [] : [{kind: 'warn',
        html: t('Vul een geldikte groter dan nul in om het gelvolume te berekenen.')}];
      return {notes, rows, after,
        tail: thick > 0
          ? t('Drager ' + NL(tw, 0) + ' × ' + NL(tl, 0) + ' cm bij een geldikte van '
            + NL(thick, 1) + ' mm. Smelten in de magnetron, laten afkoelen tot ongeveer 60 °C '
            + 'en pas daarna de kleuring toevoegen en gieten.')
          : ''};
    },

    /* ---------- looptijd ---------- */
    run() {
      const t = this.t, sds = this.type === 'sds';
      if (sds) {
        return {notes: [{kind: 'info', html: t('Voor SDS-PAGE hangt de looptijd af van het '
          + 'geltype en het buffersysteem; volg het protocol van je practicum.')}]};
      }
      const V = num(this.volt), d = num(this.elec), pct = num(this.pct);
      const [, tl] = GPTRAY[this.tray] || GPTRAY['7x10'];
      const target = tl * 0.6;                                /* tot ongeveer 60% van de gel */
      if (!(V > 0) || !(d > 0)) {
        return {notes: [{kind: 'warn', html: t('Vul de spanning en de afstand tussen de '
          + 'elektroden in voor een schatting van de looptijd.')}]};
      }
      const E = V / d, v = gpSpeed(E, pct), ti = v > 0 ? target / v : NaN, notes = [];
      if (E > 10) {
        notes.push({kind: 'warn', html: t(NL(Number(E.toFixed(1)), 1) + ' V/cm is hoog; boven '
          + '10 V/cm warmt de gel op en lopen de banden scheef.')});
      } else if (E < 3) {
        notes.push({kind: 'warn', html: t(NL(Number(E.toFixed(1)), 1) + ' V/cm is laag; onder '
          + '3 V/cm diffunderen kleine fragmenten uit en wordt de band vaag.')});
      }
      /* loopt het kleinste fragment van de gel af voordat het front er is? */
      const fr = gpFronts(pct);
      if (this.sizes.length && fr) {
        const sm = Math.min(...this.sizes);
        if (sm < fr[0]) {
          notes.push({kind: 'warn', html: t('Het kleinste fragment van ' + NL(sm, 0) + ' bp loopt '
            + 'vóór het blauwe front uit; stop eerder of kies een hoger percentage agarose.')});
        }
      }
      return {
        ti: isFinite(ti) ? ti : null, target, volt: V,
        rows: [[t('Veldsterkte'), t(NL(Number(E.toFixed(2)), 2) + ' V/cm')],
          [t('Snelheid van het blauwe front'),
            isFinite(v) ? t(NL(Number(v.toFixed(2)), 2) + ' cm/min') : '–'],
          [t('Looptijd tot ' + NL(Number(target.toFixed(1)), 1) + ' cm'),
            isFinite(ti) ? t(gpMin(ti * 0.75) + ' – ' + gpMin(ti * 1.3)) : '–']],
        notes,
        tail: t('Stop wanneer het blauwe front ongeveer ' + NL(Number(target.toFixed(1)), 1)
          + ' cm van de slotjes staat, dus ruim vóór de rand van de gel. De tijd is een '
          + 'schatting; kijk naar het front, niet naar de klok.')
      };
    }
  },
  watch: {
    /* een ander geltype heeft andere ladders; de gekozen ladder blijft staan als hij bestaat */
    type(v) {
      const L = GPLAD[v === 'sds' ? 'sds' : 'dna'];
      if (!L.some(([k]) => k === this.lad)) this.lad = L[0][0];
    }
  },
  mounted() {
    this.draw();
    matRegister('gplan', () => {
      const L = (this.cast.rows || []).filter(r => r[1] !== '–').map(r => [r[0], r[1]]);
      const T = this.totals;
      L.push([trPlain('Ladder'), this.lad]);
      if (T.dye) L.push([this.dye, lkNumIn(vol(T.dye))]);
      return L;
    });
  },
  updated() { this.draw(); },
  methods: {
    lkNum(v) { return lkNumIn(v); },
    addLane() { this.lanes = [...this.lanes, ['', '10', '', '#1558b0']]; },
    /* bench-modus: gieten (alleen agarose), elke laan laden, lopen met een timer */
    bench() {
      const t = this.t, c = this.cast, r = this.run, steps = [];
      if (c.rows && c.rows[1][1] !== '–') {
        steps.push(t('Weeg ' + uv(c.rows[1][1]) + ' agarose af.'),
          t('Meet ' + uv(c.rows[2][1]) + ' af en voeg ' + uv(c.rows[3][1]) + ' water toe.'),
          t('Smelt de agarose in de magnetron en laat afkoelen tot ongeveer 60 °C.'));
        if (c.rows[4]) steps.push(t('Voeg ' + uv(c.rows[4][0]) + ' toe: ' + uv(c.rows[4][1]) + '.'));
        steps.push(t('Giet de gel in de drager, zet de kam erin en laat de gel stollen.'));
      }
      this.lanes.slice(0, this.teeth).forEach((l, i) => {
        const name = String(l[0] || '').trim(), v = num(l[1]);
        if (!name) return;
        steps.push(v > 0
          ? t('Laan ' + (i + 1) + ': pipetteer ' + lkNumIn(NL(v, 1)) + ' µL van ' + uv(esc(name)) + '.')
          : t('Laan ' + (i + 1) + ': pipetteer ' + uv(esc(name)) + '.'));
      });
      if (r.ti) {
        steps.push({html: t('Zet de spanning op ' + lkNumIn(NL(r.volt, 1)) + ' V en laat de gel lopen; reken op '
          + uv(r.rows[2][1]) + '.') + ' ' + t('Stop wanneer het blauwe front ongeveer '
          + lkNumIn(NL(Number(r.target.toFixed(1)), 1)) + ' cm van de slotjes staat.'),
          timer: [t('Gel laten lopen'), Math.round(r.ti * 60)]});
      }
      if (steps.length) openBench({title: this.title.trim() || t('Gelplanner'), steps});
    },
    /* de twee tekeningen; de tekst eromheen rendert Vue zelf */
    draw() {
      try { gpDrawTop(); } catch (e) {}
      if (this.predict.show) { try { gpDrawPredict(); } catch (e) {} }
    }
  }
};
</script>
