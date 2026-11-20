<!-- ================= LICHAAMSLENGTE UIT BOTTEN =================
     De regressietabellen SLF, SLN en SLR blijven onveranderd in tools/nt/71_stature.js staan
     (als globals). Deze component beheert de velden, de uitkomst en de tekening; het
     rekenwerk is hetzelfde als in de oude calc.stature(), regel voor regel.

     De id's sl-sex, sl-pop, sl-age, sl-fem, sl-tib, sl-fib, sl-hum, sl-rad, sl-uln, sl-cv en
     sl-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="sl-sex">{{ t('Geslacht') }}</label>
          <select id="sl-sex" v-model="sex">
            <option value="m">{{ t('man') }}</option>
            <option value="v">{{ t('vrouw') }}</option>
          </select>
        </div>
        <div class="f">
          <label for="sl-pop">{{ t('Referentiegroep') }}</label>
          <select id="sl-pop" v-model="pop">
            <option value="w">{{ t('Europese afkomst (White)') }}</option>
            <option value="b">{{ t('Afrikaanse afkomst (Black)') }}</option>
          </select>
        </div>
        <lk-field v-model="age" :label="t('Leeftijd (optioneel)')" for-id="sl-age" :unit="t('jaar')"/>
        <lk-field v-model="fem" :label="t('Femur')" for-id="sl-fem" unit="cm"/>
        <lk-field v-model="tib" :label="t('Tibia')" for-id="sl-tib" unit="cm"/>
        <lk-field v-model="fib" :label="t('Fibula')" for-id="sl-fib" unit="cm"/>
        <lk-field v-model="hum" :label="t('Humerus')" for-id="sl-hum" unit="cm"/>
        <lk-field v-model="rad" :label="t('Radius')" for-id="sl-rad" unit="cm"/>
        <lk-field v-model="uln" :label="t('Ulna')" for-id="sl-uln" unit="cm"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Maximale lengte op een osteometrische plank. Vul alleen de botten in die je hebt. De formules komen uit een Amerikaanse referentiegroep van rond 1950; voor de huidige Nederlandse bevolking zijn ze minder nauwkeurig. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="sl-cv" v-show="R.length"></canvas>
      <div id="sl-out">
        <lk-note v-if="!R.length" kind="info">{{ t('Vul de lengte van minstens één bot in.') }}</lk-note>
        <template v-else>
          <lk-big :label="t('Beste schatting (' + best.n + ')')" :value="F(best.est, 1)" :sub="'cm ± ' + F(best.se, 2)"/>
          <lk-kv :rows="rows"/>
          <lk-note v-for="(w, i) in warns" :key="i" kind="warn">{{ w }}</lk-note>
          <lk-table :cols="cols" :rows="tblRows"/>
          <lk-note v-if="apart" kind="warn">{{ t('De schattingen per bot lopen ver uiteen; controleer of de botten van hetzelfde individu zijn en goed gemeten.') }}</lk-note>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Stature',
  data() {
    return {sex: 'm', pop: 'w', age: '', fem: lkNumIn('47,2'), tib: lkNumIn('38,6'), fib: '',
      hum: lkNumIn('33,4'), rad: '', uln: ''};
  },
  computed: {
    /* de regressieformule bij het gekozen geslacht en de gekozen referentiegroep */
    coef() { return SLF[this.sex + this.pop]; },
    /* de leeftijdscorrectie geldt alleen boven 30 jaar */
    corr() {
      const age = num(this.age);
      return age > 30 && age < 120 ? -0.06 * (age - 30) : 0;
    },
    /* per ingevuld bot: de schatting en de standaardfout */
    R() {
      const F_ = this.coef, corr = this.corr;
      return Object.keys(SLN).map(k => {
        const L = num(this[k]);
        if (!(L > 0)) return null;
        const [a, b, se] = F_[k];
        return {k, n: SLN[k], L, est: a * L + b + corr, se, out: L < SLR[k][0] || L > SLR[k][1]};
      }).filter(Boolean);
    },
    best() { return this.R.reduce((a, b) => b.se < a.se ? b : a); },
    warns() {
      return this.R.filter(r => r.out)
        .map(r => this.t(`${r.n} ${fmt(r.L, 1)} cm valt buiten het gebruikelijke bereik voor volwassenen; controleer de eenheid (cm).`));
    },
    rows() {
      const t = this.t, b = this.best, c = this.corr;
      return [[t('95%-interval'), `${F(b.est - 1.96 * b.se, 1)} – ${F(b.est + 1.96 * b.se, 1)} cm`],
        [t('Leeftijdscorrectie'), c ? F(c, 1) + ' cm' : t('geen')]];
    },
    cols() {
      const t = this.t;
      return [{h: t('Bot')}, {h: t('Lengte (cm)'), num: true}, {h: t('Formule')},
        {h: t('Schatting (cm)'), num: true}, {h: t('95%-interval'), num: true}];
    },
    tblRows() {
      return this.R.map(r => {
        const [a, b] = this.coef[r.k];
        return [this.t(r.n), F(r.L, 1), `${F(a, 2)} × L + ${F(b, 2)}`, F(r.est, 1),
          `${F(r.est - 1.96 * r.se, 1)} – ${F(r.est + 1.96 * r.se, 1)}`];
      });
    },
    /* de schattingen per bot wijken meer af dan twee keer de grootste standaardfout */
    apart() {
      const R = this.R;
      return R.length > 1 && Math.max(...R.map(r => r.est)) - Math.min(...R.map(r => r.est))
        > 2 * Math.max(...R.map(r => r.se));
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    F,
    /* het intervaldiagram per bot; pShow() tekent zoals voorheen */
    draw() {
      const cv = document.getElementById('sl-cv'), R = this.R;
      if (!cv || !R.length) return;
      const best = this.best, t = this.t;
      const lo = Math.min(...R.map(r => r.est - 2 * r.se)) - 3,
        hi = Math.max(...R.map(r => r.est + 2 * r.se)) + 3, W = 480, H = 64 + R.length * 30;
      pShow(cv, W, H, (x) => {
        const L = 90, X = v => L + (v - lo) / (hi - lo) * (W - L - 20);
        x.font = '12px ' + PFONT(); x.textBaseline = 'middle';
        const st = niceStep(hi - lo, 6);
        for (let tk = Math.ceil(lo / st) * st; tk <= hi; tk += st) {
          x.strokeStyle = PCOL.line; x.beginPath(); x.moveTo(X(tk), 10); x.lineTo(X(tk), H - 40); x.stroke();
          x.fillStyle = PCOL.muted; x.textAlign = 'center'; x.fillText(fmt(tk, 0), X(tk), H - 28);
        }
        R.forEach((r, i) => {
          const y = 24 + i * 30;
          x.fillStyle = PCOL.ink; x.textAlign = 'right'; x.fillText(t(r.n), L - 10, y);
          x.strokeStyle = r === best ? PCOL.acc : PCOL.muted; x.lineWidth = 2; x.beginPath();
          x.moveTo(X(r.est - 1.96 * r.se), y); x.lineTo(X(r.est + 1.96 * r.se), y); x.stroke();
          x.fillStyle = r === best ? PCOL.acc : PCOL.ink; x.beginPath(); x.arc(X(r.est), y, 4, 0, 7); x.fill();
        });
        x.lineWidth = 1; x.fillStyle = PCOL.muted; x.textAlign = 'left';
        x.fillText(t('lichaamslengte (cm), 95%-interval'), L, H - 8);
      });
    }
  }
};
</script>
