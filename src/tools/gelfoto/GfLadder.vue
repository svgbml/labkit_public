<!-- ================= GELFOTO-EDITOR, PANEEL 4: DE LADDER KIEZEN EN METEN =================
     Alleen de velden en de knoppen van paneel 4. De bandentabel, de symbolen en "ladder uit
     een foto" blijven voorlopig gewone HTML (S226), net als de kop van het paneel.

     De id's gf-lad, gf-unit en gf-ladc blijven, want gfUpdate(), gfLadder() en de motor lezen
     ze daar uit; tests/validate.py zet ze ook zo. Wat eerst een losse change-listener op
     gf-lad was (eiwitladder → kDa, en de massa's per band erbij) is nu een watcher. -->
<template>
  <div>
    <div class="row">
      <div class="f">
        <label for="gf-lad">{{ t('Ladder') }}</label>
        <select id="gf-lad" v-model="f.lad">
          <option v-for="o in ladders" :key="o.v" :value="o.v">{{ o.user ? o.n : t(o.n) }}</option>
        </select>
      </div>
      <div class="f">
        <label for="gf-unit">{{ t('Eenheid') }}</label>
        <select id="gf-unit" v-model="f.unit" @change="unitMsg">
          <option value="bp">bp</option>
          <option value="kb">kb</option>
          <option value="kDa">kDa</option>
          <option value="ng">{{ t('ng (hoeveelheid)') }}</option>
        </select>
      </div>
      <div class="f">
        <label>&nbsp;</label>
        <button type="button" class="primary" id="gf-bands" @click="detect">{{ t('Detecteer banden') }}</button>
      </div>
    </div>
    <div class="f" id="gf-ladcw" style="margin-top:8px" v-if="f.lad === 'custom'">
      <label for="gf-ladc">{{ t('Eigen ladder, grootste eerst (spaties of ;)') }}</label>
      <input id="gf-ladc" class="mono" v-model="f.ladc" @change="syncLadc">
    </div>
    <!-- de ladderbibliotheek (S67); de velden heten gf-ll-…, dan slaat een project ze niet op -->
    <details id="gf-ll" style="margin-top:8px">
      <summary>{{ t('Eigen ladders beheren') }}</summary>
      <ul v-if="lib.length" id="gf-ll-list" style="list-style:none;margin:8px 0 0;padding:0;display:grid;gap:6px">
        <li v-for="l in lib" :key="l.id" style="display:flex;gap:8px;align-items:center;min-width:0">
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            <b>{{ l.n }}</b> <span class="mono" style="font-size:12px;color:var(--muted)">{{ l.s.join(' ') }} {{ l.u }}</span></span>
          <button type="button" class="gf-ll-share" @click="share(l, $event.currentTarget)">{{ t('Delen') }}</button>
          <button type="button" class="ghost" :aria-label="t('Verwijderen')" @click="del(l)">✕</button>
        </li>
      </ul>
      <p v-else style="font-size:12.5px;color:var(--muted);margin:8px 0 0">{{ t('Nog geen eigen ladders.') }}</p>
      <div class="row" style="margin-top:8px">
        <div class="f">
          <label for="gf-ll-name">{{ t('Naam') }}</label>
          <input id="gf-ll-name" class="txt" v-model="nw.n">
        </div>
        <div class="f">
          <label for="gf-ll-unit">{{ t('Eenheid') }}</label>
          <select id="gf-ll-unit" v-model="nw.u"><option value="bp">bp</option><option value="kDa">kDa</option></select>
        </div>
      </div>
      <div class="f" style="margin-top:8px">
        <label for="gf-ll-sizes">{{ t('Bandgroottes, grootste eerst (spaties of ;)') }}</label>
        <input id="gf-ll-sizes" class="mono" v-model="nw.s">
      </div>
      <div class="f" style="margin-top:8px">
        <label for="gf-ll-imp">{{ t('Of plak gedeelde ladders (één per regel, „Naam: 1000 500 250 bp”)') }}</label>
        <textarea id="gf-ll-imp" class="mono" rows="2" v-model="imp"></textarea>
      </div>
      <div class="row" style="margin-top:8px">
        <button type="button" id="gf-ll-add" @click="add">{{ t('Toevoegen aan bibliotheek') }}</button>
      </div>
      <lk-note v-if="msg" :kind="msgKind">{{ msg }}</lk-note>
    </details>
    <div class="row" style="margin-top:8px">
      <button type="button" id="gf-addband" @click="addBand">{{ t('+ Ladderband (klik)') }}</button>
      <button type="button" id="gf-measure" @click="measure">{{ t('Band meten (klik)') }}</button>
      <button type="button" id="gf-measall" @click="measAll">{{ t('Meet alle banden') }}</button>
      <button type="button" id="gf-clrmarks" @click="clear">{{ t('Metingen wissen') }}</button>
    </div>
  </div>
</template>

<script>
import {gfMix} from './tick.js';
import {LADS, userLads, ladLoad, ladAdd, ladDel, ladProt, ladLine, ladParse} from './ladders.js';

export default {
  name: 'GfLadder',
  mixins: [gfMix],
  data() {
    return {f: {lad: '100', unit: 'bp', ladc: '250 150 100 75 50 37 25 20 15 10'}, nw: {n: '', s: '', u: 'bp'}, imp: '', msg: '', msgKind: 'ok'};
  },
  computed: {
    lib() { return userLads; },
    /* eigen ladders vóór "Eigen ladder…" (die blijft de laatste keuze) */
    ladders() { return [...LADS.slice(0, -1), ...userLads.map(l => ({v: l.id, n: l.n, user: true})), LADS[LADS.length - 1]]; }
  },
  watch: {
    /* Een eiwitladder rekent in kDa en een DNA-ladder in bp, en bij een ladder met bekende
       massa's komen die massa's in gf-lmass te staan (dat veld staat in GfDens, dus we zetten
       het via de invoer zelf — zo weet die component het ook). Daarna rekent de tool opnieuw,
       maar pas als Vue de keuzelijsten heeft bijgewerkt. */
    'f.lad'(k) {
      if (ladProt(k)) this.f.unit = 'kDa';
      else if (k !== 'custom' && this.f.unit === 'kDa') this.f.unit = 'bp';
      if (LMASS[k]) gfSetIn('gf-lmass', LMASS[k]);
      this.$nextTick(() => { calc.gelfoto(); });
    }
  },
  /* "ladder uit een foto" in src/engines/gelfoto.js kiest een ladder voor ons; zoals bij __oplosVm
     staat de instantie daarom op window. Zelf het veld in de DOM zetten kan niet: het
     eigen-ladderveld bestaat pas nadat Vue het heeft neergezet. */
  created() { ladLoad(); },
  mounted() { window.__gfLadVm = this; },
  methods: {
    /* een ladder van buiten zetten; `done` draait zodra het veld er staat */
    setLadder(key, sizes, done) {
      this.f.lad = key;
      if (key === 'custom' && sizes) this.f.ladc = sizes;
      this.$nextTick(() => { calc.gelfoto(); if (done) done(); });
    },
    /* delen via een link en ongedaan maken sturen alleen een change-event; v-model ziet dat
       bij een tekstveld niet */
    syncLadc(e) { this.f.ladc = e.target.value; },
    /* toevoegen uit de velden of uit geplakte regels; de eerste nieuwe ladder wordt meteen gekozen */
    add() {
      const raw = this.imp.trim() ? ladParse(this.imp) : [{n: this.nw.n, s: String(this.nw.s).split(/[\s;]+/).map(num), u: this.nw.u}];
      const got = raw.map(ladAdd).filter(Boolean);
      if (!got.length) { this.msgKind = 'warn'; this.msg = this.t('Geef een naam en minstens twee bandgroottes.'); return; }
      this.msgKind = 'ok'; this.msg = this.t(got.length + ' ladder(s) toegevoegd.');
      this.nw.n = ''; this.nw.s = ''; this.imp = ''; this.f.lad = got[0].id;
    },
    del(l) { if (this.f.lad === l.id) this.setLadder('custom', l.s.join(' ')); ladDel(l.id); },
    async share(l, btn) {
      try { await navigator.clipboard.writeText(ladLine(l)); flashBtn(btn, 'Gekopieerd'); } catch (e) { flashBtn(btn, 'Geblokkeerd'); }
    },
    detect() { gfBandsBtn(); },
    addBand() { setMode('addband'); },
    measure() { gfMeasureBtn(); },
    measAll() { gfMeasAll(); },
    clear() { gfClearMarks(); },
    /* ng kan alleen met een DNA-massaladder; dezelfde melding als eerst */
    unitMsg() { gfUnitMsg(); }
  }
};
</script>
