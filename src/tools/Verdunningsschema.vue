<!-- ================= VERDUNNINGSSCHEMA =================
     Een seriële verdunningsreeks met buizen, overdrachtsvolumes en concentraties op #pv-cv,
     eventueel met uitplaten. De id's (pv-cv, pv-out, pv-title, pv-c0, …) blijven zoals ze waren.
     Het rekenwerk (computed `m`) en de tekening (draw()) zijn ongewijzigd uit calc.pverd
     overgenomen; de hulpfuncties pTube, pArrow, pNum, pNotes en pAuto blijven in web/index.html. -->
<template>
  <div class="picwrap">
    <div class="pic-prev">
      <div class="result">
        <canvas id="pv-cv"></canvas>
        <div class="pic-bar" data-picbar="pv">
          <button type="button" data-png="pv">{{ t('PNG') }}</button>
          <button type="button" data-svg="pv">{{ t('SVG') }}</button>
          <button type="button" data-copy="pv">{{ t('Kopieer afbeelding') }}</button>
          <button type="button" data-picprint="pv">{{ t('Afdrukken') }}</button>
        </div>
        <div id="pv-out">
          <lk-note v-if="m.bad" kind="bad">{{ t('Factor moet groter dan 1 zijn en het volume groter dan 0.') }}</lk-note>
          <lk-kv v-else :rows="rows"/>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="fields">
        <div class="f" style="grid-column:1/-1">
          <label for="pv-title">{{ t('Titel') }}</label>
          <input id="pv-title" class="txt" v-model="title">
        </div>
        <lk-field v-model="c0" :label="t('Concentratie stock')" for-id="pv-c0"/>
        <div class="f">
          <label for="pv-cu">{{ t('Eenheid') }}</label>
          <input id="pv-cu" class="txt" v-model="cu">
        </div>
        <div class="f">
          <label for="pv-f">{{ t('Factor per stap') }}</label>
          <div class="inu">
            <span class="u" style="border-left:1px solid var(--line);border-radius:4px 0 0 4px;border-right:0">1 :</span>
            <input id="pv-f" inputmode="decimal" v-model="f" style="border-radius:0 4px 4px 0">
          </div>
        </div>
        <lk-field v-model="n" :label="t('Aantal buizen')" for-id="pv-n" inputmode="numeric"/>
        <lk-field v-model="v" :label="t('Volume per buis')" for-id="pv-v" unit="µL"/>
        <div class="f">
          <label for="pv-dil">{{ t('Verdunningsmiddel') }}</label>
          <input id="pv-dil" class="txt" v-model="dil">
        </div>
        <div class="f">
          <label for="pv-lab">{{ t('Buislabels') }}</label>
          <select id="pv-lab" style="width:100%" v-model="lab">
            <option value="exp">10⁻¹, 10⁻² …</option>
            <option value="ratio">1:10, 1:100 …</option>
            <option value="num">1, 2, 3 …</option>
          </select>
        </div>
        <lk-field v-model="plate" :label="t('Uitplaten uit laatste')" for-id="pv-plate" inputmode="numeric" :unit="t('buizen')"/>
        <lk-field v-model="pv" :label="t('Uitplaatvolume')" for-id="pv-pv" unit="µL"/>
        <div class="f" style="grid-column:1/-1">
          <label for="pv-labels">{{ t('Eigen buislabels (komma-gescheiden, leeg = automatisch)') }}</label>
          <input id="pv-labels" class="txt" v-model="labels" :placeholder="t('bijv. stock, A, B, C, D, E, F')">
        </div>
        <div class="f" style="grid-column:1/-1">
          <label for="pv-note">{{ t('Eigen tekst onder het schema') }}</label>
          <textarea id="pv-note" rows="2" v-model="note"
                    :placeholder="t('Bijv. incubatie, opmerkingen of verwijzing naar het protocol')"></textarea>
        </div>
        <div class="f">
          <label for="pv-col">{{ t('Kleur van de reeks') }}</label>
          <input type="color" id="pv-col" v-model="col" style="width:100%;height:32px;padding:2px">
        </div>
        <label class="chk" for="pv-auto" style="grid-column:1/-1">
          <input type="checkbox" id="pv-auto" v-model="auto"> {{ t('Standaardtoelichting tonen') }}
        </label>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('De kleur in de buizen vervaagt per stap, maar niet op schaal: bij een factor 10 zou de kleur na twee stappen al onzichtbaar zijn. Lees de concentratie dus onder de buis, niet uit de kleur. Zet "Uitplaten" op 0 als je geen platen wilt tekenen. Uit de laatste buis houd je het overdrachtsvolume over; dat staat als opmerking onder het schema.') }}</p>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
/* tekst uit een sjabloon in de taal van de gebruiker; de oude versie deed dit met i18nValue()
   op de invoervelden, wat binnen een Vue-boom niet meer gebeurt */
const loc = v => (LANG === 'en' ? trPlain(v, true) : v);

/* de invoer die storeGet() eerder bewaarde onder de id's van deze velden */
const stored = (id, d) => { try { const v = storeGet()[id]; return v == null ? d : v; } catch (e) { return d; } };

export default {
  name: 'Verdunningsschema',
  data() {
    return {
      title: stored('pv-title', loc('Decimale verdunningsreeks')), c0: stored('pv-c0', '1e9'),
      cu: stored('pv-cu', 'KVE/mL'), f: stored('pv-f', '10'), n: stored('pv-n', '6'),
      v: stored('pv-v', '1000'), dil: stored('pv-dil', loc('fysiologisch zout')),
      lab: stored('pv-lab', 'exp'), plate: stored('pv-plate', '3'), pv: stored('pv-pv', '100'),
      labels: stored('pv-labels', ''), note: stored('pv-note', ''),
      col: stored('pv-col', '#1558b0'), auto: stored('pv-auto', true)
    };
  },
  computed: {
    /* dit is het rekenwerk van calc.pverd, letterlijk overgenomen */
    m() {
      const c0 = num(this.c0), cu = this.cu.trim(), f = num(this.f), n = Math.max(1, Math.min(10, Math.round(num(this.n) || 1))), V = num(this.v), dil = this.dil.trim() || 'verdunningsmiddel';
      const np = Math.max(0, Math.min(n, Math.round(num(this.plate) || 0))), pvol = num(this.pv), lab = this.lab, title = this.title.trim();
      if (!(f > 1) || !(V > 0)) return {bad: true};
      const tr = V / f, dv = V - tr;
      return {bad: false, c0, cu, f, n, V, dil, np, pvol, lab, title, tr, dv};
    },
    rows() {
      const {c0, cu, f, n, tr, dv} = this.m, t = this.t;
      return [[t('Overdracht per stap'), lkNumIn(vol(tr))], [t('Verdunningsmiddel per buis'), lkNumIn(vol(dv))],
        [t('Laatste buis'), `1 : ${lkNumIn(pNum(f ** n).replace(/ /g, ''))}${isFinite(c0) ? ' → ' + lkNumIn(sig(c0 * f ** -n, 3)) + ' ' + esc(cu) : ''}`],
        [t('Totaal verdunningsmiddel'), lkNumIn(vol(dv * n))]];
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    /* de tekening op #pv-cv; elke render en elke invoer-event roept dit aan */
    draw() {
      const cv = document.getElementById('pv-cv'); if (!cv) return;
      const m = this.m; if (m.bad) return;
      const {c0, cu, f, n, dil, np, pvol, lab, title, tr, dv} = m;
      const step = 118, W = Math.max(520, 70 + (n + 1) * step), NL_ = pNotes('pv', W), AU = pAuto('pv'), NH = NL_.length ? NL_.length * 17 + 10 : 0, H = (title ? 40 : 0) + (np ? 405 : 300) - (AU ? 0 : 20) + NH;
      const own = this.labels.split(',').map(t => t.trim()); const label = i => own[i] ? own[i] : i === 0 ? 'stock' : lab === 'exp' && f === 10 ? '10' + supNum(-i) : lab === 'num' ? String(i) : '1 : ' + pNum(f ** i).replace(/ /g, '');
      const colv = this.col, col = /^#[0-9a-f]{6}$/i.test(colv) ? colv : PCOL.liquid;
      pShow(cv, W, H, (x) => { const t0 = pTitle(x, title, W), top = t0 + 70, th = 110, tw = 40;
        for (let i = 0; i <= n; i++) { const cx = 50 + i * step + 20; const fillA = Math.max(0.06, 0.55 * Math.pow(1 / f, i * 0.45));
          pTube(x, cx, top, th, tw, 0.6, i === 0 ? 0.6 : fillA, col);
          x.fillStyle = PCOL.ink; x.textAlign = 'center'; x.font = '600 13px ' + PFONT(); x.fillText(label(i), cx, top - 22);
          x.font = '12px ' + PFONT(); x.fillStyle = PCOL.ink; x.fillText(isFinite(c0) ? pNum(c0 * f ** -i) : '', cx, top + th + 20); x.fillStyle = PCOL.muted; x.fillText(isFinite(c0) ? cu : '', cx, top + th + 36);
          if (i > 0) { x.fillStyle = PCOL.muted; x.font = '11.5px ' + PFONT(); x.fillText(vol(dv), cx, top + th + 58); (() => { const ws = dil.split(' '); let ln = '', yy = top + th + 73, k = 0; ws.forEach(w => { if ((ln + ' ' + w).trim().length > 14 && ln && k < 1) { x.fillText(ln, cx, yy); yy += 14; ln = w; k++; } else ln = (ln + ' ' + w).trim(); }); x.fillText(ln.length > 16 ? ln.slice(0, 15) + '…' : ln, cx, yy); })();
            pArrow(x, cx - step + 12, top - 34, cx - 10, top - 14, PCOL.acc); x.fillStyle = PCOL.acc; x.font = '600 12px ' + PFONT(); x.fillText(vol(tr), cx - step / 2, top - 58); }
          if (np && i > n - np) { const py = top + th + 130, r = 32; x.lineWidth = 1.6; x.strokeStyle = PCOL.ink; x.fillStyle = '#fbf7ec'; x.beginPath(); x.ellipse(cx, py, r, r * 0.42, 0, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.ellipse(cx, py - 5, r, r * 0.42, 0, Math.PI, 2 * Math.PI); x.stroke();
            x.strokeStyle = PCOL.acc; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(cx, top + th + 94); x.lineTo(cx, py - 20); x.stroke(); x.setLineDash([]);
            x.fillStyle = PCOL.ink; x.font = '11.5px ' + PFONT(); x.fillText(isFinite(pvol) ? vol(pvol) + ' uitplaten' : 'uitplaten', cx, py + 28); }
        }
        if (NL_.length) pDrawNotes(x, NL_, H - NH - (AU ? 14 : 0) + 2); if (!AU) return; x.textAlign = 'left'; x.fillStyle = PCOL.muted; x.font = '11.5px ' + PFONT(); x.fillText(`Per buis ${vol(dv)} ${uv(dil)} + ${vol(tr)} uit de vorige buis; meng goed en wissel van tip na elke stap. Uit de laatste buis blijft ${vol(tr)} over.`, 20, H - 14); });
    }
  }
};
</script>
