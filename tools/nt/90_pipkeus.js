/* ================= WELKE PIPET? =================
   Tweede tool op Vue 3 (zie 00a_vue.js): een tool waarvan de uitkomst een tabel is.
   Het rekenwerk is onveranderd. De grenzen komen uit ISO 8655-2 bij het nominale volume
   (ISOLIM); de absolute fout van het nominale volume wordt over het hele bereik aangenomen,
   dus bij een klein volume wordt de relatieve fout groter. Bij k keer pipetteren tellen
   systematische fouten op en toevallige fouten kwadratisch.

   De id's pk-v, pk-set en pk-out blijven zoals ze waren, zodat delen via een link, ongedaan
   maken, de invoeropslag en tests/validate.py blijven werken. */
function pkLim(nom){ let r=ISOLIM[0]; for(const x of ISOLIM) if(x[0]<=nom) r=x; return r; }

/* de pipetten uit de set, met per pipet hoe vaak je moet pipetteren en welke fout dat geeft */
function pkRows(V, set){
  return set.map(nom => { const [, sp, rp] = pkLim(nom), es = sp / 100 * nom, s = rp / 100 * nom;
    const k = V > nom ? Math.ceil(V / nom - 1e-9) : 1, sub = V / k, ok = sub >= nom * 0.1 - 1e-9;
    const ES = k * es, S = Math.sqrt(k) * s;
    return {nom, k, sub, ok, es: ES, s: S, rel: (ES + 2 * S) / V * 100}; });
}

const PK_TPL = `<div class="grid2">
  <div class="panel">
    <div class="fields">
      <div class="f"><label for="pk-v">{{ t('Te pipetteren volume') }}</label><div class="inu"><input id="pk-v" inputmode="decimal" v-model="v"><span class="u">µL</span></div></div>
      <div class="f" style="grid-column:span 2"><label for="pk-set">{{ t('Pipetten in je set (nominaal, µL)') }}</label><input id="pk-set" class="txt" v-model="set"></div>
    </div>
    <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Een pipet met variabel volume werkt tussen 10% en 100% van het nominale volume. Kalibreer je eigen pipetten met de Pipetkalibratie; de echte fouten zijn meestal kleiner dan de ISO-grenzen.') }}</p>
  </div>
  <div class="result"><div id="pk-out" v-html="out"></div></div>
</div>`;

const pkVue = lkVueMount('#pk-app', {
  template: PK_TPL,
  data() { return {v: lkNumIn('15'), set: '2 10 20 100 200 1000 5000'}; },
  computed: {
    out() {
      const t = this.t, tH = this.tHtml, V = num(this.v);
      /* fmt() en vol() geven altijd Nederlandse getallen; binnen een Vue-boom komt de
         vertaallaag niet, dus ze gaan hier zelf door lkNumIn() */
      const F = (x, d) => lkNumIn(fmt(x, d)), VL = x => lkNumIn(vol(x));
      const set = [...new Set(String(this.set).split(/[\s;,]+/).map(num).filter(x => x > 0 && x <= 1e5))].sort((a, b) => a - b);
      if (!(V > 0) || !set.length) return note('info', t('Vul een volume en minstens één pipet in.'));
      const R = pkRows(V, set), can = R.filter(r => r.ok && r.k <= 20);
      const best = can.length ? can.reduce((a, b) =>
        b.rel < a.rel - 1e-12 || (Math.abs(b.rel - a.rel) < 1e-12 && b.k < a.k) ? b : a) : null;
      const head = best
        ? `<div class="lbl">${t('Beste keuze')}</div><div class="big">P${F(best.nom, 0)}${
            best.k > 1 ? ` <small>${best.k} × ${VL(best.sub)}</small>` : ''}</div>`
          + kv([[t('Systematische fout (max.)'), `± ${VL(best.es)} (${F(best.es / V * 100, 2)}%)`],
            [t('Toevallige fout (max., SD)'), `${VL(best.s)} (${F(best.s / V * 100, 2)}%)`]])
        : note('warn', t('Geen pipet in je set kan dit volume binnen 10–100% van zijn bereik afmeten.'));
      const why = r => r.ok ? (r.k > 20 ? t('te vaak') : t('ja')) : t('onder 10% van bereik');
      return head + `<div class="tbl-wrap" style="margin-top:12px"><table class="mini"><thead><tr>`
        + `<th>${t('Pipet')}</th><th class="num">${t('Keer')}</th><th class="num">${t('Per keer')}</th>`
        + `<th class="num">${tH('e<sub>s</sub> max.')}</th><th class="num">${t('s max.')}</th>`
        + `<th class="num">${tH('Totaal (e<sub>s</sub> + 2s)')}</th><th>${t('Bruikbaar')}</th></tr></thead><tbody>`
        + R.map(r => `<tr><td>P${F(r.nom, 0)}</td><td class="num">${r.k}</td><td class="num">${VL(r.sub)}</td>`
          + `<td class="num">${VL(r.es)}</td><td class="num">${VL(r.s)}</td>`
          + `<td class="num">${F(r.rel, 2)}%</td><td>${why(r)}</td></tr>`).join('')
        + `</tbody></table></div><div class="formula">${tH('totaal = (k·e<sub>s</sub> + 2·√k·s) / V')}</div>`;
    }
  }
});
calc.pipkeus = () => {};
