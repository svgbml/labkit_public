<!-- ================= GELFOTO-EDITOR, PANEEL 5 EN 6: OPMAAK EN EXPORT =================
     De opmaak van de afbeelding (titel, lettergrootte, labelhoek, kleur van de metingen) en
     wat er in de export terechtkomt. gfRender() leest deze velden op hun id uit gxOpts() en
     gfUpdate(); het tekenen zelf blijft in src/engines/gelfoto.js.

     De gx-velden worden onthouden in localStorage (NOPERSIST laat alleen gf- vallen). De
     herstelcode in index.html loopt voordat Vue mount, dus de component leest die waarden
     zelf uit de opslag. -->
<template>
  <div class="stack" style="gap:12px">
    <div class="panel" data-gs="labels s4">
      <h3>{{ t('5 · Opmaak') }}</h3>
      <div class="row" style="gap:6px;margin-bottom:10px;align-items:center">
        <span style="font-size:12.5px;color:var(--muted)">{{ t('Stijl') }}</span>
        <button v-for="p in presets" :key="p.id" type="button" :id="p.id" :class="{primary: active === p.id}"
                :aria-pressed="active === p.id ? 'true' : 'false'" @click="apply(p)">{{ t(p.n) }}</button>
      </div>
      <div class="f">
        <label for="gf-title">{{ t('Titel') }}</label>
        <input id="gf-title" class="txt" v-model="f.title" @change="sync">
      </div>
      <div class="rng" style="margin-top:8px">
        <label for="gf-fs">{{ t('Lettergrootte') }}</label>
        <input type="range" id="gf-fs" min="10" max="48" v-model="f.fs" @change="sync">
        <span id="gf-fsv">{{ fsTxt }}</span>
      </div>
      <div class="row" style="margin-top:8px">
        <div class="f">
          <label for="gf-ang">{{ t('Labelhoek') }}</label>
          <select id="gf-ang" v-model="f.ang">
            <option value="auto">{{ t('Automatisch (kantelt bij overlap)') }}</option>
            <option value="0">{{ t('Horizontaal') }}</option>
            <option value="45">45°</option>
            <option value="90">{{ t('Verticaal') }}</option>
          </select>
        </div>
        <div class="f">
          <label for="gx-mcol">{{ t('Kleur metingen') }}</label>
          <select id="gx-mcol" v-model="f.mcol">
            <option value="#e8a317">{{ t('Oranje') }}</option>
            <option value="#d62828">{{ t('Rood') }}</option>
            <option value="#1d5bc4">{{ t('Blauw') }}</option>
            <option value="#111111">{{ t('Zwart') }}</option>
          </select>
        </div>
      </div>
      <label class="chk" style="margin-top:10px">
        <input type="checkbox" id="gf-help" v-model="f.help"> {{ t('Lane- en bandmarkeringen in de marge tonen') }}
      </label>
    </div>
    <div class="panel" data-gs="export s4">
      <h3>{{ t('6 · Exporteren') }}</h3>
      <div style="font-size:12.5px;color:var(--muted);margin-bottom:6px">
        {{ t('Wat komt er in de afbeelding? De voorbeeldweergave volgt deze keuzes.') }}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 10px">
        <label class="chk" v-for="o in boxes" :key="o.id">
          <input type="checkbox" :id="o.id" v-model="f[o.id]"> {{ t(o.n) }}
        </label>
      </div>
      <div class="row" style="margin-top:10px">
        <div class="f">
          <label for="gx-fmt">{{ t('Formaat') }}</label>
          <select id="gx-fmt" v-model="f['gx-fmt']">
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
          </select>
        </div>
        <div class="f">
          <label for="gx-scale">{{ t('Resolutie') }}</label>
          <select id="gx-scale" v-model="f['gx-scale']">
            <option value="1">1×</option>
            <option value="2">2×</option>
            <option value="3">3×</option>
          </select>
        </div>
      </div>
      <div class="f" style="margin-top:8px">
        <label for="gx-name">{{ t('Bestandsnaam') }}</label>
        <input id="gx-name" class="txt" :placeholder="t('volgt de titel')" v-model="f['gx-name']" @change="sync">
      </div>
      <div class="row" style="margin-top:10px">
        <button type="button" class="primary" id="gf-dl" v-if="dlOn" @click="download">{{ t('Downloaden') }}</button>
        <button type="button" id="gf-copy" @click="copy">{{ t('Kopieer afbeelding') }}</button>
      </div>
      <p id="gf-exmsg" style="font-size:12.5px;color:var(--muted);margin:8px 0 0">{{ msg || t('De gel zelf blijft onbewerkt: tekst, streepjes en metingen staan altijd in de witte marge eromheen. De blauwe en oranje markeringen in de editor komen niet in de export.') }}</p>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../../lib/bridge.js';
import {gfMix} from './tick.js';

/* de keuzes voor de export, in dezelfde volgorde als eerst; de id's blijven want gxOpts()
   leest ze zo uit */
const BOXES = [
  {id: 'gx-title', n: 'Titel'},
  {id: 'gx-lanes', n: 'Lanelabels'},
  {id: 'gx-bp', n: 'Ladderwaarden'},
  {id: 'gx-ticks', n: 'Streepjes ladder'},
  {id: 'gx-unit', n: 'Eenheid (bp/kDa)'},
  {id: 'gx-marks', n: 'Metingen'},
  {id: 'gx-pad', n: 'Witte rand'}
];

/* Stijlpresets: alleen waarden voor bestaande velden; gxOpts() en gfUpdate() tekenen ze.
   Alles aan behalve wat de preset zelf anders zet. De afbeeldingsvelden (gf-inv, gf-gray) blijven
   buiten de presets: wat goed is hangt van de foto af. */
const ALL = {fs: '18', ang: 'auto', mcol: '#e8a317', help: true, 'gx-fmt': 'png', 'gx-scale': '1'};
BOXES.forEach(o => { ALL[o.id] = true; });
const PRESETS = [
  /* Labjournaal: alles zichtbaar op schermresolutie, zoals je het in je labboek plakt */
  {id: 'gf-pre-journal', n: 'Labjournaal', v: {...ALL}},
  /* Verslag: zonder metingen en marge-markeringen, 2× scherp in Word */
  {id: 'gf-pre-report', n: 'Verslag', v: {...ALL, mcol: '#1d5bc4', help: false, 'gx-marks': false, 'gx-scale': '2'}},
  /* Publicatie: zwart-wit, geen titel (het onderschrift staat in de tekst), kleinere letter, 3× voor druk */
  {id: 'gf-pre-pub', n: 'Publicatie', v: {...ALL, fs: '14', mcol: '#111111', help: false, 'gx-title': false, 'gx-marks': false, 'gx-scale': '3'}},
  /* Poster: grote letters en titel, rode metingen die op afstand leesbaar zijn, 3× voor groot formaat */
  {id: 'gf-pre-poster', n: 'Poster', v: {...ALL, fs: '36', mcol: '#d62828', help: false, 'gx-scale': '3'}}
];
/* veldnaam in f -> element-id (de gx-velden heten in f al zo) */
const FIELD_ID = {fs: 'gf-fs', ang: 'gf-ang', help: 'gf-help', mcol: 'gx-mcol'};

export default {
  name: 'GfFormat',
  mixins: [gfMix],
  data() {
    const s = storeGet();
    /* een gx-veld dat is onthouden gaat voor de standaardwaarde */
    const pick = (id, d) => (id in s ? s[id] : d);
    /* De vertaallaag zette eerst de getallen in een invoerveld om (i18nValue); binnen een
       Vue-boom komt hij niet, dus doet de component dat zelf. */
    const f = {title: lkNumIn('PCR-product, 1,5% agarose'), fs: '18', ang: 'auto',
      mcol: pick('gx-mcol', '#e8a317'), help: true,
      'gx-fmt': pick('gx-fmt', 'png'), 'gx-scale': pick('gx-scale', '2'),
      'gx-name': pick('gx-name', '')};
    BOXES.forEach(o => { f[o.id] = !!pick(o.id, true); });
    return {f, msg: ''};
  },
  computed: {
    boxes() { return BOXES; },
    presets() { return PRESETS; },
    /* de preset waarvan alle velden nog gelden; wie een veld aanpast, wist de markering */
    active() { const p = PRESETS.find(p => Object.keys(p.v).every(k => String(this.f[k]) === String(p.v[k]))); return p && p.id; },
    fsTxt() { return lkNumIn(String(Math.round(+this.f.fs) || 0)); },
    /* De downloadknop verschijnt pas als opslaan kan (buiten de app van Claude altijd, daar
       zodra de downloadcapability er is). showDl() in index.html tikt de componenten op. */
    dlOn() { this.tick; return typeof dlShown !== 'undefined' && dlShown; }
  },
  methods: {
    apply(p) {
      Object.assign(this.f, p.v);
      /* na het tekenen van Vue: een change per veld bewaart het (persistSave); dan tekent
         gfUpdate() voorbeeld en export opnieuw */
      this.$nextTick(() => {
        Object.keys(p.v).forEach(k => { const el = document.getElementById(FIELD_ID[k] || k); if (el) el.dispatchEvent(new Event('change', {bubbles: true})); });
        gfUpdate();
      });
    },
    /* de motor zet gf-title bij een nieuwe foto of de demo-gel, en delen en ongedaan maken
       sturen alleen een change-event */
    sync(e) {
      const k = {'gf-title': 'title', 'gf-fs': 'fs', 'gx-name': 'gx-name'}[e.target.id];
      if (k) this.f[k] = e.target.value;
    },
    download() {
      if (!gf.src) return;
      const fmtx = this.f['gx-fmt'], c = gfRender(true, +this.f['gx-scale']);
      const name = safeName(this.f['gx-name'] || gf.title || 'gelfoto') + '.' + fmtx;
      c.toBlob(async b => {
        try { await saveBlob(name, b); this.msg = this.t('Opgeslagen.'); }
        catch (err) {
          this.msg = this.t(err && err.code === 'declined' ? 'Download geannuleerd.' : 'Downloaden lukte niet hier.');
        }
      }, fmtx === 'jpg' ? 'image/jpeg' : 'image/png', 0.95);
    },
    async copy() {
      if (!gf.src) return;
      const c = gfRender(true, +this.f['gx-scale']);
      try {
        await navigator.clipboard.write([new ClipboardItem({'image/png': new Promise(r => c.toBlob(r, 'image/png'))})]);
        this.msg = this.t('Afbeelding gekopieerd; plak in Word, PowerPoint of je verslag.');
      } catch (err) {
        this.msg = this.t('Kopiëren werd geblokkeerd; gebruik rechtsklik → Afbeelding opslaan als.');
      }
    }
  }
};
</script>
