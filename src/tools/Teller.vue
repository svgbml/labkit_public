<!-- ================= TELLER =================
     De indelingen, de tellers, de voortgangsbalk en het doel van de teller. Het rekenwerk van
     renderCounter() (totaal, percentages, doel bereikt) staat in computeds; bump(), ongedaan
     maken, op 0 zetten en een categorie toevoegen zijn methoden met dezelfde regels als eerst.

     De id's c-preset, c-target, c-undo, c-reset, c-addcat, c-total, c-bar, c-state en c-grid
     blijven zoals ze waren. De toetsen 1–9 en Backspace luisteren op document en werken alleen
     als de teller de actieve tool is (current === 'teller') en er niet in een veld getypt wordt.

     De stand (categorieën, tikken, indeling) staat onder dezelfde sleutel en in hetzelfde
     formaat in localStorage als eerder: {cats, hist (laatste 500), preset}. De restore daarvan
     stond in web/index.html en kon hier niet blijven, want die draaide voordat de component er was.
     (Het veld c-target onthoudt de algemene invoeropslag niet meer, net als bij de andere
     Vue-tools, want die zet haar waarden terug voordat Vue gemount is.) -->
<template>
  <div class="stack">
    <div class="panel">
      <div class="row" style="justify-content:space-between;margin-bottom:12px">
        <div class="row">
          <div class="f">
            <label for="c-preset">{{ t('Indeling') }}</label>
            <select id="c-preset" v-model="preset" @change="onPreset">
              <option value="diff">{{ t('Differentiële leukocytentelling') }}</option>
              <option value="ld">{{ t('Levend / dood') }}</option>
              <option value="kol">{{ t('Koloniemorfologie (3 typen)') }}</option>
              <option value="gram">{{ t('Gramkleuring (4 typen)') }}</option>
              <option value="vrij">{{ t('Vrij (1 categorie)') }}</option>
            </select>
          </div>
          <div class="f">
            <label for="c-target">{{ t('Stop bij totaal') }}</label>
            <input id="c-target" inputmode="numeric" v-model="targetTxt" style="width:100px">
          </div>
        </div>
        <div class="row">
          <button type="button" id="c-undo" @click="undo">{{ t('Ongedaan maken') }}</button>
          <button type="button" id="c-reset" @click="reset">{{ t('Alles op 0') }}</button>
          <button type="button" id="c-addcat" @click="addCat">{{ t('+ Categorie') }}</button>
        </div>
      </div>
      <div class="row" style="gap:14px;margin-bottom:12px">
        <span class="big" id="c-total" style="margin:0">{{ totTxt }}<small v-if="hasTarget">/ {{ target }}</small></span>
        <div style="flex:1;min-width:160px"><div class="progress"><i id="c-bar" :style="{width: pct + '%'}"></i></div></div>
        <span id="c-state"><span v-if="done" class="chip ok">{{ t('Doel bereikt') }}</span></span>
      </div>
      <div class="cgrid" id="c-grid">
        <div v-for="(x, i) in cats" :key="i" role="button" tabindex="0" class="cbtn" :class="{flash: flash === i}" :data-ci="i" @click="unlockAudio(); bump(i)">
          <span class="key">{{ i < 9 ? i + 1 : '' }}</span>
          <span class="nm" contenteditable="true" :data-cn="i" spellcheck="false" v-nm="t(x.n)" @click.stop @input="onName($event, i)"></span>
          <span class="ct">{{ x.c }}</span>
          <span class="pc">{{ pc(x) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const CPRESETS = {
  diff: ['Neutrofielen', 'Lymfocyten', 'Monocyten', 'Eosinofielen', 'Basofielen'],
  ld: ['Levend', 'Dood'], kol: ['Type A', 'Type B', 'Type C'],
  gram: ['Gram+ kokken', 'Gram+ staven', 'Gram− kokken', 'Gram− staven'], vrij: ['Telling']
};
const CKEY = 'labkit:v1:teller';
const fresh = k => CPRESETS[k].map(n => ({n, c: 0}));

export default {
  name: 'Teller',
  /* de naam van een categorie is bewerkbaar tekst; Vue zet hem alleen terug als hij afwijkt van
     wat er staat, anders springt de cursor bij elke toetsaanslag naar het begin */
  directives: {
    nm: {
      mounted(el, b) { el.textContent = b.value; },
      updated(el, b) { if (el.textContent !== b.value) el.textContent = b.value; }
    }
  },
  data() {
    let st = null;
    try {
      const c = JSON.parse(localStorage.getItem(CKEY) || 'null');
      if (c && Array.isArray(c.cats) && c.cats.length) st = c;
    } catch (e) { /* geen bewaarde stand */ }
    return {
      preset: st && st.preset ? st.preset : 'diff',
      targetTxt: '100',
      cats: st ? st.cats : fresh('diff'),
      hist: st ? (st.hist || []) : [],
      flash: -1
    };
  },
  computed: {
    tot() { return this.cats.reduce((a, b) => a + b.c, 0); },
    target() { return num(this.targetTxt); },
    hasTarget() { return isFinite(this.target) && this.target > 0; },
    totTxt() { return this.tot + (this.hasTarget ? ' ' : ''); },
    pct() { return this.hasTarget ? Math.min(100, this.tot / this.target * 100) : 0; },
    done() { return this.hasTarget && this.tot >= this.target; },
    save() { return JSON.stringify({cats: this.cats, hist: this.hist.slice(-500), preset: this.preset}); }
  },
  watch: {
    /* bewaren zoals eerder: dezelfde sleutel en hetzelfde formaat */
    save: {handler(v) { try { localStorage.setItem(CKEY, v); } catch (e) { /* niet bewaarbaar */ } }, immediate: true}
  },
  methods: {
    unlockAudio() { unlockAudio(); },
    pc(x) { return this.tot ? lkNumIn(fmt(x.c / this.tot * 100, 1)) : '0'; },
    onPreset(e) { this.cats = fresh(e.target.value); this.hist = []; this.flash = -1; },
    onName(e, i) { this.cats[i].n = e.target.textContent; },
    bump(i) {
      const target = num(this.targetTxt), tot = this.tot;
      if (isFinite(target) && target > 0 && tot >= target) { beep(1, 330); return; }
      this.cats[i].c++; this.hist.push(i);
      if (isFinite(target) && tot + 1 === target) beep(2, 990);
      this.flash = i;
    },
    undo() {
      const i = this.hist.pop();
      if (i != null && this.cats[i]) { this.cats[i].c--; this.flash = -1; }
    },
    reset() { this.cats.forEach(x => { x.c = 0; }); this.hist = []; this.flash = -1; },
    addCat() { this.cats.push({n: 'Categorie ' + (this.cats.length + 1), c: 0}); this.flash = -1; },
    /* toetsen 1–9 tellen, Backspace maakt de laatste tik ongedaan; alleen op deze tool en niet
       tijdens het typen in een veld (dezelfde regels als de oude handler in index.html) */
    onKey(e) {
      if (current !== 'teller') return;
      const t = e.target, ae = document.activeElement;
      if (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || ['INPUT', 'TEXTAREA', 'SELECT'].includes(ae?.tagName) || ae?.isContentEditable || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[1-9]$/.test(e.key)) { const i = +e.key - 1; if (this.cats[i]) { e.preventDefault(); unlockAudio(); this.bump(i); } }
      else if (e.key === 'Backspace') { e.preventDefault(); this.undo(); }
    }
  },
  mounted() { document.addEventListener('keydown', this.onKey); },
  unmounted() { document.removeEventListener('keydown', this.onKey); }
};
</script>
