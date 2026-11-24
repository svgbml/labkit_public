<!-- ================= CENTRIFUGE =================
     Omrekenen tussen toerental (rpm) en g-kracht (RCF). Twee velden zijn elkaars uitkomst: het
     veld dat je het laatst bewerkte is de invoer, het andere rekent mee. Dat onthoudt `last`
     (in de oude versie de variabele zLast). Het veld waar de cursor staat wordt niet
     overschreven, zodat je niet tegen je eigen invoer in typt.
     De id's z-r, z-rpm, z-g en z-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="z-r">{{ t('Rotorstraal r') }}</label>
          <div class="inu"><input id="z-r" inputmode="decimal" :value="r" @input="onIn('z-r', $event)"><span class="u">cm</span></div>
        </div>
        <div class="f">
          <label for="z-rpm">{{ t('Toerental') }}</label>
          <div class="inu"><input id="z-rpm" inputmode="decimal" :value="rpm" @input="onIn('z-rpm', $event)"><span class="u">rpm</span></div>
        </div>
        <div class="f">
          <label for="z-g">{{ t('g-kracht') }}</label>
          <div class="inu"><input id="z-g" inputmode="decimal" :value="g" @input="onIn('z-g', $event)"><span class="u">× g</span></div>
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Vul rpm óf × g in; het andere veld rekent mee.') }}</p>
      <div class="fields" style="margin-top:12px">
        <div class="f">
          <label for="z-rot">{{ t('Opgeslagen rotors') }}</label>
          <select id="z-rot" :value="sel" @change="pick($event.target.value)">
            <option value="">{{ t('— kies —') }}</option>
            <option v-for="o in rotors" :key="o.name" :value="o.name">{{ o.name }}</option>
          </select>
        </div>
        <div class="f">
          <label for="z-rname">{{ t('Naam van de rotor') }}</label>
          <input id="z-rname" v-model="name">
        </div>
        <div class="f">
          <label for="z-n">{{ t('Aantal posities') }}</label>
          <input id="z-n" inputmode="numeric" v-model="n">
        </div>
      </div>
      <p style="margin:8px 0 0">
        <button type="button" id="z-rsave" :disabled="!name.trim()" @click="save">{{ t('Bewaar rotor') }}</button>
        <button type="button" id="z-rdel" :disabled="!sel" @click="del">{{ t('Verwijder rotor') }}</button>
      </p>
    </div>
    <div class="result" id="z-out">
      <lk-note v-if="!res">{{ t('Vul de rotorstraal en rpm of × g in.') }}</lk-note>
      <template v-else>
        <lk-big :label="res.label" :value="res.big" :sub="res.unit"/>
        <lk-kv :rows="res.rows"/>
        <lk-formula html="RCF = 1,118 × 10⁻⁵ × r × rpm²"/>
        <lk-note>{{ t('Controleer of de waarde binnen het maximum van de rotor valt en balanceer de buizen.') }}</lk-note>
        <lk-report tool="centrifuge" :sentence="method" :answer="last === 'rpm' ? val.g : val.rpm" :unit="last === 'rpm' ? '× g' : 'rpm'" :sheet="sheet" :digits="4"/>
      </template>
      <div class="fields" style="margin-top:14px">
        <div class="f">
          <label for="z-k">{{ t('Aantal buizen') }}</label>
          <input id="z-k" inputmode="numeric" v-model="k">
        </div>
      </div>
      <lk-note v-if="!bal" kind="info">{{ t('Vul het aantal posities en buizen in.') }}</lk-note>
      <template v-else>
        <svg v-if="bal.set" class="z-bal" viewBox="-60 -60 120 120" width="160" height="160" role="img" :aria-label="t('Balansdiagram van de rotor, gezien van boven')">
          <circle r="52" fill="none" stroke="var(--muted)" stroke-width="1"/>
          <g v-for="d in dots" :key="d.i">
            <circle :cx="d.x" :cy="d.y" r="6" :fill="d.on ? 'var(--accent)' : 'none'" stroke="var(--muted)" stroke-width="1"/>
            <text :x="d.x" :y="d.y + 2.5" text-anchor="middle" font-size="7" :fill="d.on ? '#fff' : 'var(--muted)'" data-notr>{{ d.i + 1 }}</text>
          </g>
        </svg>
        <lk-note v-if="bal.set" kind="ok">{{ t('Gebalanceerd: zet de buizen in positie') }} {{ bal.set.map(i => i + 1).join(', ') }}.</lk-note>
        <lk-note v-else kind="warn">{{ t('Met deze aantallen is geen gebalanceerde opstelling mogelijk.') }}<template v-if="bal.next"> {{ t('Voeg een blanco buis (water) toe: met') }} {{ bal.next }} {{ t('buizen kan het wel.') }}</template></lk-note>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import {balanceSet, balanceNext} from '../lib/balance.js';

const RKEY = 'labkit:v1:rotors';

const K = 1.118e-5;
/* de invoer die storeGet() eerder bewaarde onder de id's van deze velden */
const stored = (id, d) => { try { const v = storeGet()[id]; return v == null ? d : v; } catch (e) { return d; } };
/* een geheel getal met duizendtallen, in de taal van de pagina (nl-NL groepeert 1957 als 1.957, en dat
   leest lkNumIn() in het Engels als een decimale punt) */
const nl = x => Math.round(x).toLocaleString(LANG === 'en' ? 'en-US' : 'nl-NL');

export default {
  name: 'Centrifuge',
  data() {
    return {r: stored('z-r', '8,4'), rpm: stored('z-rpm', '13000'), g: stored('z-g', ''), last: 'rpm',
      rotors: jget(RKEY, []), sel: '', name: '', n: '12', k: '5'};
  },
  created() { this.sync(); },
  computed: {
    /* rpm en g na het doorrekenen; NaN als iets ontbreekt */
    val() {
      const r = num(this.r); let rpm = num(this.rpm), g = num(this.g);
      if (this.last === 'rpm' && isFinite(rpm) && isFinite(r)) g = K * r * rpm * rpm;
      else if (this.last === 'g' && isFinite(g) && isFinite(r)) rpm = Math.sqrt(g / (K * r));
      return {r, rpm, g};
    },
    /* balans: de posities, of null met een voorstel voor een blanco buis; null als de invoer ontbreekt */
    bal() {
      const n = num(this.n), k = num(this.k);
      if (!(n >= 2 && n <= 48) || !(k >= 1 && k <= n) || n !== Math.round(n) || k !== Math.round(k)) return null;
      const set = balanceSet(n, k);
      return {set, next: set ? 0 : balanceNext(n, k)};
    },
    dots() {
      const n = num(this.n), on = new Set(this.bal.set);
      return [...Array(n).keys()].map(i => ({i, on: on.has(i), x: 40 * Math.sin(2 * Math.PI * i / n), y: -40 * Math.cos(2 * Math.PI * i / n)}));
    },
    /* S96 deel 3: rotorstraal en de invoer, de uitkomst als formule (machtsverheffen in plaats van WORTEL, zie sheet.js) */
    sheet() {
      const t = this.t, {r, rpm, g} = this.val, R = {k: 'r', label: t('Rotorstraal r'), value: r, unit: 'cm'};
      return this.last === 'rpm'
        ? [R, {k: 'n', label: t('Toerental'), value: rpm, unit: 'rpm'}, {label: t('g-kracht'), value: '=' + K + '*{r}*{n}^2', unit: '× g'}]
        : [R, {k: 'g', label: t('g-kracht'), value: g, unit: '× g'}, {label: t('Toerental'), value: '=({g}/(' + K + '*{r}))^0.5', unit: 'rpm'}];
    },
    /* S96: de methodezin */
    method() {
      const {r, rpm, g} = this.val; if (!isFinite(rpm) || !isFinite(g) || !isFinite(r)) return '';
      return esc(this.t('Er werd gecentrifugeerd bij ' + uv(nl(g)) + ' × g (' + uv(nl(rpm)) + ' rpm, rotorstraal ' + uv(lkNumIn(fmt(r, 1))) + ' cm; RCF berekend uit rpm en rotorstraal).'));
    },
    res() {
      const t = this.t, {r, rpm, g} = this.val, byRpm = this.last === 'rpm';
      if (!isFinite(rpm) || !isFinite(g) || !isFinite(r)) return null;
      return {label: t(byRpm ? 'g-kracht' : 'Toerental'), big: nl(byRpm ? g : rpm), unit: byRpm ? '× g' : 'rpm',
        rows: [[t('Rotorstraal'), lkNumIn(fmt(r, 1)) + ' cm'], ['rpm', nl(rpm)], ['RCF', nl(g) + ' × g']]};
    }
  },
  methods: {
    /* het andere veld invullen, behalve als de cursor daar staat */
    sync() {
      const {rpm, g} = this.val;
      const act = typeof document !== 'undefined' && document.activeElement ? document.activeElement.id : '';
      if (this.last === 'rpm' && isFinite(g) && isFinite(rpm) && act !== 'z-g') this.g = String(Math.round(g));
      else if (this.last === 'g' && isFinite(rpm) && isFinite(g) && act !== 'z-rpm') this.rpm = String(Math.round(rpm));
    },
    pick(name) {
      this.sel = name;
      const o = this.rotors.find(x => x.name === name);
      if (!o) return;
      this.name = o.name; this.n = String(o.n);
      this.r = String(o.r).replace('.', LANG === 'en' ? '.' : ',');
      this.sync();
    },
    save() {
      const name = this.name.trim(), r = num(this.r), n = num(this.n);
      if (!name || !isFinite(r) || !(n >= 2)) return;
      const o = {name, r, n}, i = this.rotors.findIndex(x => x.name === name);
      if (i < 0) this.rotors.push(o); else this.rotors.splice(i, 1, o);
      this.sel = name; jset(RKEY, this.rotors);
    },
    del() {
      this.rotors = this.rotors.filter(x => x.name !== this.sel);
      this.sel = ''; jset(RKEY, this.rotors);
    },
    onIn(id, e) {
      const v = e.target.value;
      if (id === 'z-r') this.r = v;
      else if (id === 'z-rpm') { this.rpm = v; this.last = 'rpm'; }
      else { this.g = v; this.last = 'g'; }
      this.sync();
    }
  }
};
</script>
