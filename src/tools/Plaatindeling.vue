<!-- ================= PLAATINDELING =================
     De bediening van de tool: titel, knoppen, palet, vorm, vinkjes, toelichting en de tekst
     onder de tekening. Wat NIET in de component zit:
     - de plaatontwerper in #w-pld (klik of sleep over de putjes, groepen, legenda): dat is de
       gedeelde ontwerper uit tools/nt/02_plate.js, die ook qPCR en ELISA gebruiken. plaatInit()
       in tools/nt/04_plaat.js bouwt hem in mounted(), want een Vue-mount wist zijn host;
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
      fb: null,
      /* de downloadknop staat verborgen tot index.html showDl() aanroept; was dat al gebeurd,
         dan hoort hij er nu meteen */
      dlOn: STANDALONE || !!dlCap
    };
  },
  computed: { pals() { return PALS_UI; } },
  mounted() { plaatInit(); this.draw(); },
  methods: {
    draw() { plateImg(); },
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
