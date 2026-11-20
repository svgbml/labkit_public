<!-- ================= GELPLANNER =================
     De tool bestaat uit twee tekeningen (de gel van bovenaf en de verwachte gel), een paneel
     met instellingen, de laantabel en drie uitkomstblokken. Het tekenwerk blijft op het
     canvas met de gewone tekencontext: `gpDrawTop()` in `tools/nt/48_gplan.js` wordt na elke
     render opnieuw aangeroepen, net als bij de Z′-factor en de buffercapaciteit.

     S255 zet de instellingen, de laantabel en de uitkomstenlijst onder de gel in Vue. De
     verwachte gel, de receptkaart en de looptijd (gpPredict, gpCast en gpRun) schrijven tot
     S256 nog zelf in #gpp-out, #gp-cast en #gp-run; die hosts staan hieronder leeg in het
     template, en wat zulke code erin zet blijft staan omdat Vue er geen kinderen voor rendert.

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
        <canvas id="gpp-cv"></canvas>
        <div class="pic-bar" v-html="picBarPred"></div>
        <div id="gpp-out"></div>
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
        </div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0" v-html="tHtml(hint)"></p>
      </div>
      <div class="result" id="gp-cast" style="margin-top:16px"></div>
      <div class="result" id="gp-run" style="margin-top:16px"></div>
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
    }
  },
  watch: {
    /* een ander geltype heeft andere ladders; de gekozen ladder blijft staan als hij bestaat */
    type(v) {
      const L = GPLAD[v === 'sds' ? 'sds' : 'dna'];
      if (!L.some(([k]) => k === this.lad)) this.lad = L[0][0];
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    lkNum(v) { return lkNumIn(v); },
    addLane() { this.lanes = [...this.lanes, ['', '10', '', '#1558b0']]; },
    /* de twee tekeningen en de drie blokken die nog uit de module komen (S256) */
    draw() {
      try { gpDrawTop(); } catch (e) {}
      /* gpPredict(), gpCast() en gpRun() schrijven HTML in hun eigen host; die tekst staat
         binnen een Vue-boom en de vertaallaag komt daar niet, dus hij wordt hier langs
         i18nWalk() gehaald. In S256 doen componenten dat werk. */
      for (const [fn, id] of [[typeof gpPredict === 'function' ? gpPredict : null, 'gpp-out'],
        [typeof gpCast === 'function' ? gpCast : null, 'gp-cast'],
        [typeof gpRun === 'function' ? gpRun : null, 'gp-run']]) {
        if (!fn) continue;
        try { fn(); } catch (e) { continue; }
        const box = document.getElementById(id);
        if (box && typeof i18nWalk === 'function') { try { i18nWalk(box); } catch (e) {} }
      }
    }
  }
};
</script>
