<!-- ================= PLAATINDELING =================
     De bediening van de tool: titel, knoppen, palet, vorm, vinkjes, toelichting en de tekst
     onder de tekening. Wat NIET in de component zit:
     - de plaatontwerper in #w-pld (klik of sleep over de putjes, groepen, legenda): dat is de
       gedeelde ontwerper uit src/engines/plate.js, die ook qPCR en ELISA gebruiken. plaatInit()
       in src/engines/plate.js bouwt hem in mounted(), want een Vue-mount wist zijn host;
     - de tekening op #w-cv: plateImg() in dezelfde module (de ontwerper roept die aan bij elke
       wijziging); de component roept hem aan bij elke keuze;
     - de tekst voor "Kopieer als tabel" en "Download CSV": plaatTSV() en plaatCSV().
     De id's w-title, w-copy, w-csv, w-pld, w-pal, w-shape, w-autolab, w-leg, w-note, w-cv,
     w-copied en w-fallback blijven zoals ze waren. De knoppenbalk onder de tekening
     (data-picbar="w") wordt hier gerenderd, want de mount wist wat index.html erin zet. -->
<template>
  <div class="panel">
    <div class="row" style="justify-content:space-between;margin-bottom:12px">
      <div class="f"><label for="w-title">{{ t('Titel') }}</label>
        <input id="w-title" class="txt" v-model="title" style="width:240px" @input="draw"></div>
      <div class="row">
        <button type="button" data-smp="plaat">{{ t('Monsters…') }}</button>
        <button type="button" class="primary" id="w-copy" @click="copy">{{ t('Kopieer als tabel') }}</button>
        <button type="button" id="w-csv" class="dl-only" :style="dlOn ? '' : 'display:none'" @click="csv">{{ t('Download CSV') }}</button>
      </div>
    </div>
    <div id="w-pld"></div>
    <div class="pl-fill">
      <div class="row" style="gap:10px">
        <button type="button" id="w-fillbtn" @click="toggleFill">{{ fill ? t('Vulmodus sluiten') : t('Vulmodus') }}</button>
        <template v-if="fill">
          <span class="pl-prog">{{ t(nFilled + ' van ' + wells.length + ' putjes gevuld') }}<i><b :style="{width: (wells.length ? 100 * nFilled / wells.length : 0) + '%'}"></b></i></span>
          <button v-if="nFilled" type="button" @click="resetFill">{{ t('Opnieuw') }}</button>
        </template>
      </div>
      <template v-if="fill">
        <p v-if="!wells.length" style="font-size:13px;color:var(--muted)">{{ t('Geen putjes in gebruik: kleur eerst putjes in de plaat.') }}</p>
        <div v-else class="pl-grid" :style="'grid-template-columns:22px repeat(' + dims.c + ',1fr)'">
          <span></span><span v-for="j in dims.c" :key="'h' + j">{{ j }}</span>
          <template v-for="(L, i) in rowLetters" :key="L">
            <span>{{ L }}</span>
            <template v-for="j in dims.c" :key="L + j">
              <button v-if="grp[L + j]" type="button" :class="{fl: filled[L + j], nx: nextWell === L + j}"
                :style="{background: grp[L + j]}" :aria-pressed="!!filled[L + j]" :aria-label="L + j" @click="tapWell(L + j)">{{ filled[L + j] ? '✓' : '' }}</button>
              <button v-else type="button" class="off" disabled :aria-label="L + j"></button>
            </template>
          </template>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:0">{{ nextWell ? t('Volgende putje') + ': ' + nextWell : t('Alle putjes zijn gevuld.') }}</p>
      </template>
    </div>
    <div class="row" style="margin-top:12px;gap:14px">
      <div class="f"><label for="w-pal">{{ t('Kleurenpalet') }}</label>
        <select id="w-pal" v-model="pal" @change="onPal">
          <option v-for="p in pals" :key="p[0]" :value="p[0]">{{ t(p[1]) }}</option>
        </select></div>
      <div class="f"><label for="w-shape">{{ t('Vorm putjes') }}</label>
        <select id="w-shape" v-model="shape" @change="onShape">
          <option value="rond">{{ t('Rond') }}</option><option value="vierkant">{{ t('Vierkant') }}</option>
        </select></div>
      <label class="chk" for="w-autolab"><input type="checkbox" id="w-autolab" v-model="autolab" @change="onAutolab"> {{ t('automatische labels (St1, Mo2 …)') }}</label>
      <label class="chk" for="w-leg"><input type="checkbox" id="w-leg" v-model="leg" @change="draw"> {{ t('legenda in afbeelding') }}</label>
      <span style="font-size:13px;color:var(--muted)">{{ t('Klik op het kleurvakje van een groep voor een eigen kleur.') }}</span>
    </div>
    <div class="f" style="margin-top:12px">
      <label for="w-note">{{ t('Eigen tekst onder de afbeelding (bijv. verdunningen, incubatietijden)') }}</label>
      <textarea id="w-note" rows="2" v-model="note" @input="draw"></textarea>
    </div>
    <h3 style="margin:16px 0 8px">{{ t('Afbeelding') }}</h3>
    <canvas id="w-cv"></canvas>
    <div class="pic-bar" data-picbar="w">
      <button type="button" data-png="w">{{ t('PNG') }}</button>
      <button type="button" data-svg="w">{{ t('SVG') }}</button>
      <button type="button" data-copy="w">{{ t('Kopieer afbeelding') }}</button>
      <button type="button" data-picprint="w">{{ t('Afdrukken') }}</button>
    </div>
    <p id="w-copied" style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t(msg) }}</p>
    <textarea id="w-fallback" ref="fb" rows="6" :style="'margin-top:10px;display:' + (fb === null ? 'none' : 'block')" readonly :value="fb || ''"></textarea>
  </div>
</template>

<script>
import {benchGet, benchPut} from './Bench.vue';
const PALS_UI = [['std', 'Standaard'], ['okabe', 'Kleurenblind-veilig'], ['pastel', 'Pastel'],
  ['fel', 'Fel'], ['grijs', 'Grijstinten']];
/* tekst uit de oude opmaak in de taal van de gebruiker (i18nValue deed dit op de velden) */
const loc = v => (LANG === 'en' ? trPlain(v, true) : v);
/* de invoer die storeGet() eerder bewaarde onder de id's van deze velden */
const stored = (id, d) => { try { const v = storeGet()[id]; return v == null ? d : v; } catch (e) { return d; } };

export default {
  name: 'Plaatindeling',
  data() {
    return {
      title: stored('w-title', loc('ELISA / qPCR — plaat 1')),
      pal: stored('w-pal', 'std'), shape: stored('w-shape', 'rond'),
      autolab: stored('w-autolab', true), leg: stored('w-leg', true),
      note: stored('w-note', loc('Standaarden in duplo in kolom 1–2; monsters in drievoud.')),
      msg: 'De tabel plak je direct in Excel, Google Sheets of je labjournaal.',
      fb: null, fill: false, wells: [], grp: {}, dims: {r: 8, c: 12}, filled: {}, fkey: '',
      /* de downloadknop staat verborgen tot index.html showDl() aanroept; was dat al gebeurd,
         dan hoort hij er nu meteen */
      dlOn: STANDALONE || !!dlCap
    };
  },
  computed: {
    pals() { return PALS_UI; },
    rowLetters() { return WRL.slice(0, this.dims.r).split(''); },
    nFilled() { return this.wells.filter(k => this.filled[k]).length; },
    nextWell() { return this.wells.find(k => !this.filled[k]) || ''; }
  },
  mounted() { plaatInit(); this.draw(); },
  methods: {
    draw() { plateImg(); },
    /* vulmodus (S51): tik putjes af; de vinkjes staan in dezelfde opslag als de bench-modus,
       met als sleutel de titel en de putjes met hun groep */
    toggleFill() {
      this.fill = !this.fill;
      if (!this.fill) return;
      const S = wState(), {r, c} = wDims(), grp = {}, wells = [];
      for (let i = 0; i < r; i++) for (let j = 1; j <= c; j++) {
        const k = WRL[i] + j, g = S.wells[k];
        if (g != null && S.groups[g]) { grp[k] = S.groups[g].c; wells.push(k); }
      }
      let h = 0; for (const ch of 'plaat' + this.title + wells.map(k => k + S.wells[k]).join()) h = (h * 31 + ch.codePointAt(0)) | 0;
      this.fkey = 'p' + h;
      const got = benchGet(this.fkey), f = {};
      wells.forEach((k, n) => { if (got.includes(n)) f[k] = true; });
      Object.assign(this, {dims: {r, c}, grp, wells, filled: f});
    },
    saveFill() { benchPut(this.fkey, this.wells.map((k, n) => this.filled[k] ? n : -1).filter(n => n >= 0)); },
    tapWell(k) { this.filled = {...this.filled, [k]: !this.filled[k]}; this.saveFill(); },
    resetFill() { this.filled = {}; this.saveFill(); },
    onPal(e) { const p = PALS[e.target.value]; if (!p || !wPld) return; wPld.palette(p); plateImg(); },
    onShape(e) { if (wPld) wPld.shape(e.target.value); plateImg(); },
    onAutolab(e) { if (wPld) wPld.autoLabel(e.target.checked); plateImg(); },
    async copy() {
      const t = plaatTSV();
      try {
        await navigator.clipboard.writeText(t);
        this.msg = 'Gekopieerd. Plak in Excel, Sheets of je labjournaal.'; this.fb = null;
      } catch (e) {
        this.fb = t; this.msg = 'Kopiëren werd geblokkeerd. Selecteer en kopieer de tekst hieronder.';
        this.$nextTick(() => { const f = this.$refs.fb; if (f) f.select(); });
      }
    },
    async csv() {
      const t = plaatCSV();
      try { await saveBlob(safeName(document.getElementById('w-title').value) + '.csv', csvBlob(t)); this.msg = 'Opgeslagen.'; }
      catch (err) { this.msg = err && err.code === 'declined' ? 'Download geannuleerd.' : 'Downloaden lukte niet hier.'; }
    }
  }
};
</script>
