<!-- ================= VERDUNNINGSREEKS & KVE =================
     Een decimale reeks plannen en uit plaattellingen de KVE/mL terugrekenen (FDA BAM hfst. 3,
     NEN-EN-ISO 7218). Het rekenwerk is dat van de oude calc.reeks() in web/index.html, alleen
     de weergave is opnieuw opgebouwd.

     De tellingen per buis blijven in de globale `reeksCounts` staan ({buis: [plaat 1, plaat 2]}):
     tblSnap()/tblRestore() bewaren ze daar en tests/validate.py zet ze daar. buildReeks() in
     web/index.html laadt ze daarna in deze component (load()), en een invoer hier schrijft ze
     terug. Een fototelling (KolonieFoto.vue, S59) komt via edit() in de tabel. De id's r-f, r-n, r-v, r-plan, r-pv, r-range, r-tbl en r-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="stack">
      <div class="panel">
        <h3>{{ t('1 · Reeks maken') }}</h3>
        <div class="fields">
          <div class="f">
            <label for="r-f">{{ t('Factor per stap') }}</label>
            <div class="inu">
              <span class="u" style="border-left:1px solid var(--line);border-radius:8px 0 0 8px;border-right:0">1 :</span>
              <input id="r-f" inputmode="decimal" v-model="f" style="border-radius:0 8px 8px 0">
            </div>
          </div>
          <lk-field v-model="n" :label="t('Aantal buizen')" for-id="r-n" inputmode="numeric"/>
          <lk-field v-model="v" :label="t('Volume per buis')" for-id="r-v" unit="µL"/>
        </div>
        <p class="mono" id="r-plan" style="margin:12px 0 0;font-size:14px">{{ plan }}</p>
      </div>
      <div class="panel">
        <h3 v-html="tHtml('2 · Tellingen invullen &lt;span class=&quot;example&quot;&gt;voorbeeld&lt;/span&gt;')"></h3>
        <div class="fields">
          <lk-field v-model="pv" :label="t('Uitgeplaat volume')" for-id="r-pv" unit="mL"/>
          <div class="f" data-expert="">
            <label for="r-range">{{ t('Telbaar bereik per plaat') }}</label>
            <select id="r-range" v-model="range">
              <option value="30-300">{{ t('30–300 (AOAC / USDA)') }}</option>
              <option value="25-250">{{ t('25–250 (APHA)') }}</option>
              <option value="15-300">{{ t('15–300 (BAM 2025)') }}</option>
              <option value="10-300-iso">{{ t('10–300 (NEN-EN-ISO 7218, twee opeenvolgende verdunningen)') }}</option>
            </select>
          </div>
        </div>
        <div class="tbl-wrap" style="margin-top:12px">
          <table id="r-tbl">
            <thead><tr>
              <th>{{ t('Buis') }}</th><th class="num">{{ t('Verdunning') }}</th>
              <th class="num">{{ t('Plaat 1') }}</th><th class="num">{{ t('Plaat 2') }}</th><th>{{ t('Status') }}</th>
            </tr></thead>
            <tbody>
              <tr v-for="r in m.rows" :key="r.i" :data-i="r.i" :class="r.cls">
                <td>{{ r.i }}</td>
                <td class="num" v-html="r.dil"></td>
                <td v-for="p in [0, 1]" :key="p">
                  <input :data-p="p" :value="cell(r.i, p)" @input="edit(r.i, p, $event.target.value)"
                    style="width:90px;text-align:right">
                </td>
                <td data-st><span v-if="r.chip" :class="'chip ' + r.chip.kind">{{ r.chip.text }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:8px 0 0"
          v-html="tHtml('Leeg laten = niet uitgeplaat. Typ &lt;span class=&quot;mono&quot;&gt;&amp;gt;&lt;/span&gt; of &lt;span class=&quot;mono&quot;&gt;TNTC&lt;/span&gt; voor ontelbaar.')"></p>
        <kolonie-foto :tubes="m.rows.map(r => r.i)" @fill="edit"/>
      </div>
    </div>
    <div class="result" id="r-out">
      <lk-note v-if="out.bad" kind="bad">{{ out.bad }}</lk-note>
      <template v-else-if="out.N != null">
        <lk-big :label="t('Concentratie in onverdunde suspensie')" :html="sci(out.N, 2)" :sub="t('KVE/mL')"/>
        <lk-kv :rows="out.kv"/>
        <lk-formula :html="out.formula"/>
        <lk-note v-for="(x, k) in out.extra" :key="k" :kind="x.kind">{{ x.text }}</lk-note>
        <lk-note kind="info">{{ t('Rond af op twee significante cijfers bij rapporteren.') }}</lk-note>
      </template>
      <template v-else-if="out.est != null">
        <lk-big :label="t('Geschat (EAPC)')" :html="out.est" :sub="t('KVE/mL')"/>
        <lk-note kind="warn">{{ out.warn }}</lk-note>
      </template>
      <lk-note v-else-if="out.warn" kind="warn">{{ out.warn }}</lk-note>
      <template v-else>
        <div class="lbl">{{ t('Resultaat') }}</div>
        <lk-note kind="info">{{ t('Vul tellingen in om de KVE/mL te berekenen.') }}</lk-note>
      </template>
      <div v-if="plates.length" id="r-plates" style="margin-top:12px">
        <div class="lbl">{{ t('Platen') }}</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <div v-for="d in plates" :key="d.key" :data-used="d.used ? 1 : 0" style="min-width:72px;text-align:center;font-size:12px">
            <svg viewBox="-30 -30 60 60" width="64" height="64" role="img" :aria-label="d.n + ' ' + d.label">
              <circle r="27" fill="var(--surface)" :stroke="d.used ? 'var(--accent)' : 'var(--line)'" :stroke-width="d.used ? 3 : 1.5"/>
              <circle v-for="(c, k) in d.dots" :key="k" :cx="c[0]" :cy="c[1]" r="1.7" :fill="d.used ? 'var(--accent)' : 'var(--muted)'"/>
            </svg>
            <div class="mono">{{ d.n }}</div>
            <div v-html="d.dil"></div>
            <span :class="d.used ? 'chip ok' : 'chip'" style="font-size:11px">{{ d.label }}</span>
          </div>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('Elke plaat is getekend met hooguit honderdvijftig stippen; ontelbaar staat als TNTC. Gebruikt voor de KVE/mL: platen binnen het telbare bereik (' + m.lo + '–' + m.hi + ').') }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import KolonieFoto from './KolonieFoto.vue';

/* wat als ontelbaar telt (TNTC); ongewijzigd uit de oude calc.reeks() */
/* een getal dat de component zelf opmaakt (sci, fmt, sig) in de taal van de gebruiker */
const L = lkNumIn;
const TNTC = /^(>|≥|\+{2,}|∞)|tntc|tmtc|ontelbaar|te\s*veel|overgroei|confluent/i;

export default {
  name: 'Reeks',
  components: {KolonieFoto},
  data() {
    return {f: '10', n: '7', v: '1000', pv: lkNumIn('0,1'), range: '30-300', counts: {}};
  },
  created() { this.load(typeof reeksCounts === 'object' && reeksCounts ? reeksCounts : {}); },
  methods: {
    sci(x, s) { return L(sci(x, s)); },
    /* zet de tellingen van buiten (bewaarde sessie, test) in de component */
    load(obj) {
      const c = {};
      Object.entries(obj || {}).forEach(([i, p]) => { c[i] = [String(p && p[0] != null ? p[0] : ''), String(p && p[1] != null ? p[1] : '')]; });
      this.counts = c;
    },
    cell(i, p) { const c = this.counts[i]; return c ? c[p] : ''; },
    edit(i, p, val) {
      const c = this.counts[i] ? this.counts[i].slice() : ['', ''];
      c[p] = val;
      this.counts = Object.assign({}, this.counts, {[i]: c});
      /* terug naar de globale toestand, die tblSnap() bewaart */
      if (typeof reeksCounts === 'object' && reeksCounts) reeksCounts[i] = c.slice();
    }
  },
  computed: {
    plan() {
      const f = num(this.f), V = num(this.v), tr = V / f, dil = V - tr;
      return isFinite(tr) && f > 1
        ? this.t('Per buis: ' + vol(dil) + ' verdunningsvloeistof (bijv. fysiologisch zout) + ' + vol(tr) + ' uit de vorige buis. Meng goed en wissel van tip na elke stap.')
        : this.t('Factor moet groter dan 1 zijn.');
    },
    /* de rijen van de tabel met hun status, en de telbare platen; zelfde regels als vroeger */
    m() {
      const t = this.t, f = num(this.f);
      const n = Math.max(1, Math.min(12, Math.round(num(this.n) || 1)));
      const [lo, hi] = this.range.split('-').map(Number);
      const rows = [], used = [], allCounts = [];
      let sumC = 0, sumND = 0;
      for (let i = 1; i <= n; i++) {
        const d = f ** -i, tags = [], c = this.counts[i] || ['', ''];
        c.forEach(v => {
          const raw = String(v).trim(); if (raw === '') return;
          if (TNTC.test(raw)) { tags.push('TNTC'); allCounts.push({d, c: Infinity}); return; }
          if (!/^\d+([.,]\d+)?$/.test(raw)) { tags.push('?'); return; }
          const cc = num(raw); if (!isFinite(cc)) return;
          allCounts.push({d, c: cc});
          if (cc >= lo && cc <= hi) { sumC += cc; sumND += d; used.push({i, c: cc, d}); tags.push('ok'); }
          else tags.push(cc < lo ? 'laag' : 'hoog');
        });
        const okN = tags.filter(x => x === 'ok').length;
        const chip = !tags.length ? null
          : tags.includes('?') && !okN ? {kind: 'warn', text: t('niet herkend')}
          : okN ? {kind: 'ok', text: t(okN + '× telbaar')}
          : tags.includes('TNTC') || tags.includes('hoog') ? {kind: 'warn', text: t('te vol')}
          : {kind: 'warn', text: '< ' + lo};
        rows.push({i, d, chip, cls: !tags.length ? 'dim' : tags.includes('ok') ? 'hl' : '',
          dil: f === 10 ? '10<sup>−' + i + '</sup>' : '1 : ' + L(sig(f ** i, 4))});
      }
      return {rows, used, allCounts, sumC, sumND, lo, hi, f};
    },
    /* een rondje per ingevulde plaat; getekend wordt wat de berekening gebruikt (out.keep) */
    plates() {
      const t = this.t, {rows, lo, hi} = this.m, keep = this.out.keep || [], P = [];
      rows.forEach(r => (this.counts[r.i] || []).forEach((v, p) => {
        const raw = String(v).trim(), tn = raw !== '' && TNTC.test(raw), c = tn ? Infinity : num(raw);
        if (raw === '' || (!tn && !/^\d+([.,]\d+)?$/.test(raw))) return;
        const inR = c >= lo && c <= hi, used = inR && keep.includes(r.i), n = Math.min(tn ? 150 : c, 150);
        const dots = Array.from({length: n}, (_, k) => { const a = k * 2.39996, q = 24 * Math.sqrt((k + 0.5) / n); return [q * Math.cos(a), q * Math.sin(a)]; });
        P.push({key: r.i + '-' + p, n: tn ? 'TNTC' : String(raw), dil: r.dil, dots, used,
          label: used ? t('in berekening') : inR ? t('niet gebruikt') : c < lo ? t('te weinig') : t('te veel')});
      }));
      return P;
    },
    /* de uitkomst: ofwel N, ofwel een schatting, ofwel een melding */
    out() {
      const t = this.t, {allCounts, lo, hi, f} = this.m;
      let {used, sumC, sumND} = this.m;
      const pv = num(this.pv), iso = this.range === '10-300-iso';
      if (!isFinite(pv) || pv <= 0) return {bad: t('Vul het uitgeplate volume in (bijv. 0,1 mL bij spreiden).')};
      const extra = [];
      /* ISO 7218: gewogen gemiddelde over twee opeenvolgende verdunningen */
      if (iso && used.length) {
        const steps = [...new Set(used.map(u => u.i))].sort((a, b) => a - b); let keep = steps.slice(0, 2);
        if (keep.length === 2 && keep[1] !== keep[0] + 1) {
          extra.push({kind: 'warn', text: t('De telbare verdunningen (stap ' + keep[0] + ' en ' + keep[1] + ') zijn niet opeenvolgend; alleen stap ' + keep[0] + ' is gebruikt.')});
          keep = [keep[0]];
        }
        if (steps.length > keep.length && steps.length > 2)
          extra.push({kind: 'info', text: t('Meer dan twee telbare verdunningen; volgens ISO 7218 zijn alleen stap ' + keep.join(' en ') + ' gebruikt.')});
        used = used.filter(u => keep.includes(u.i)); sumC = used.reduce((a, u) => a + u.c, 0); sumND = used.reduce((a, u) => a + u.d, 0);
      }
      {
        const by = {};
        allCounts.filter(x => isFinite(x.c) && x.c > 0).forEach(x => { const k = Math.round(-Math.log(x.d) / Math.log(f)); (by[k] = by[k] || []).push(x.c); });
        const ks = Object.keys(by).map(Number).sort((a, b) => a - b);
        for (let q = 0; q < ks.length - 1; q++) {
          if (ks[q + 1] !== ks[q] + 1) continue;
          const av = a => a.reduce((x, y) => x + y, 0) / a.length, m1 = av(by[ks[q]]), m2 = av(by[ks[q + 1]]), r = m1 / m2;
          if (Math.min(m1, m2) >= 10 && f > 1 && (r > f * 2.5 || r < f / 2.5))
            extra.push({kind: 'warn', text: t('Stap ' + ks[q] + ' en ' + ks[q + 1] + ': de tellingen verschillen een factor ' + sig(r, 2) + ' in plaats van ongeveer ' + sig(f, 3) + '. Controleer de verdunningsstap (pipetteren, mengen) of de telling.')});
        }
      }
      if (sumND > 0) {
        const N = sumC / (pv * sumND);
        return {N, extra, keep: used.map(u => u.i),
          kv: [[t('Telbare platen'), used.length], [t('Som kolonies ΣC'), L(fmt(sumC, 0))], ['Σ nᵢ·dᵢ', L(sci(sumND, 3))], [t('Uitgeplaat'), L(fmt(pv, 3)) + ' mL']],
          formula: L('N = ΣC / (V × Σ nᵢ·dᵢ) = ' + fmt(sumC, 0) + ' / (' + fmt(pv, 3) + ' × ' + sci(sumND, 3) + ')')};
      }
      if (allCounts.length) {
        const fin = allCounts.filter(x => isFinite(x.c));
        if (fin.length) {
          const above = fin.filter(x => x.c > hi), below = fin.filter(x => x.c < lo);
          if (below.length && !above.length) {
            const b = below.sort((a, z) => z.d - a.d)[0];
            return {est: '&lt; ' + L(sci(lo / (pv * b.d), 2)),
              warn: t('Alle platen onder ' + lo + ' kolonies. Rapporteer als kleiner dan ' + lo + ' × 1/d bij de minst verdunde plaat (BAM).')};
          }
          const a = fin.sort((p, q) => Math.abs(p.c - hi) - Math.abs(q.c - hi))[0];
          return {est: '≈ ' + L(sci(a.c / (pv * a.d), 2)),
            warn: t('Geen plaat binnen ' + lo + '–' + hi + '. Schatting op basis van de plaat die het dichtst bij ' + hi + ' ligt; markeer als geschat.')};
        }
        return {warn: t('Alle platen zijn ontelbaar (TNTC). Plaat hogere verdunningen uit.')};
      }
      return {};
    }
  }
};
</script>
