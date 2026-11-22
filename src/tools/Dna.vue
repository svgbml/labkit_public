<!-- ================= DNA-KWANTIFICATIE =================
     Het rekenwerk is overgenomen uit calc.dna() en fqCalc() zoals het was; alleen de weergave is
     opnieuw opgebouwd. De forensische qPCR-kwantificatie (fqCalc, eerst een aparte functie die
     calc.dna met een wrapper aanriep) hoorde al in dezelfde sectie en is nu het vierde paneel van
     deze component. De id's n-*, m-*, p-* en fq-* blijven zoals ze waren; SEND.dna (Doorsturen
     naar een vervolgtool) leest nog #n-out .big en #m-ng. -->
<template>
  <div class="stack">
    <div class="grid2">
      <div class="panel">
        <h3>{{ t('A₂₆₀ → concentratie') }}</h3>
        <div class="fields">
          <lk-field v-model="a260" label="A₂₆₀" for-id="n-a260"/>
          <lk-field v-model="a280" label="A₂₈₀" for-id="n-a280"/>
          <lk-field v-model="a230" label="A₂₃₀" for-id="n-a230"/>
          <div class="f" data-expert=""><label for="n-a320">{{ t('A₃₂₀ (achtergrond)') }}</label>
            <input id="n-a320" v-model="a320" inputmode="decimal" :placeholder="t('optioneel')"></div>
          <div class="f"><label for="n-type">{{ t('Type') }}</label>
            <select id="n-type" v-model="type" style="width:100%">
              <option value="50">{{ t('dsDNA (50)') }}</option>
              <option value="33">{{ t('ssDNA (33)') }}</option>
              <option value="40">{{ t('RNA (40)') }}</option>
            </select></div>
          <lk-field v-model="df" :label="t('Verdunningsfactor')" for-id="n-df"/>
          <lk-field v-model="pl" :label="t('Weglengte')" for-id="n-pl" unit="cm" data-expert=""/>
          <lk-field v-model="vol" :label="t('Elutievolume')" for-id="n-vol" unit="µL"/>
        </div>
      </div>
      <div class="result" id="n-out">
        <lk-note v-if="a.note" :kind="a.note[0]">{{ t(a.note[1]) }}</lk-note>
        <template v-else>
          <lk-big :label="t('Concentratie')" :value="G(a.c, 3)" sub="ng/µL"/>
          <lk-kv :rows="a.rows"/>
          <lk-note v-for="(x, i) in a.notes" :key="i" :kind="x[0]">{{ t(x[1]) }}</lk-note>
          <lk-formula :html="a.formula"/>
          <div v-if="a.c > 0" class="lk-send"><span>{{ t('Stuur door naar') }}</span>
            <button v-for="(x, i) in sendTo" :key="i" type="button" :data-send="'dna:' + i">{{ t(x) }}</button></div>
        </template>
      </div>
    </div>
    <div class="grid2">
      <div class="panel">
        <h3>{{ t('Normaliseren naar vaste input') }}</h3>
        <div class="fields">
          <lk-field v-model="mc" :label="t('Concentratie extract')" for-id="m-c" unit="ng/µL"/>
          <lk-field v-model="mng" :label="t('Gewenste input')" for-id="m-ng" unit="ng"/>
          <lk-field v-model="mv" :label="t('In totaal volume')" for-id="m-v" unit="µL"/>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Concentratie in ng/µL, bijvoorbeeld uit de berekening hierboven of uit qPCR-kwantificatie.') }}</p>
      </div>
      <div class="result" id="m-out">
        <lk-note v-if="!nm" kind="info">{{ t('Vul concentratie, gewenste input en volume in.') }}</lk-note>
        <template v-else>
          <lk-big :label="t('Pipetteer')" :html="t(nm.vd) + nm.vdPip" :sub="t('DNA')"/>
          <lk-kv :rows="nm.rows"/>
          <lk-note v-for="(x, i) in nm.notes" :key="i" :kind="x[0]">{{ t(x[1]) }}</lk-note>
        </template>
      </div>
    </div>
    <div class="grid2">
      <div class="panel">
        <h3>{{ t('ng ↔ pmol ↔ kopieën') }}</h3>
        <div class="fields">
          <lk-field v-model="png" :label="t('Massa')" for-id="p-ng" unit="ng"/>
          <lk-field v-model="bp" :label="t('Lengte')" for-id="p-bp" unit="bp / nt"/>
          <div class="f"><label for="p-t">{{ t('Type') }}</label>
            <select id="p-t" v-model="pt" style="width:100%">
              <option value="660">{{ t('dsDNA (≈ 660 g/mol per bp)') }}</option>
              <option value="330">{{ t('ssDNA (≈ 330 g/mol per nt)') }}</option>
            </select></div>
          <lk-field v-model="pvol" :label="t('In volume (optioneel)')" for-id="p-vol" unit="µL"/>
        </div>
      </div>
      <div class="result" id="p-out">
        <lk-note v-if="!pm" kind="info">{{ t('Vul massa en lengte in.') }}</lk-note>
        <template v-else>
          <lk-big :label="t('Hoeveelheid')" :value="G(pm.pmol, 3)" sub="pmol"/>
          <lk-kv :rows="pm.rows"/>
          <lk-formula :html="t('pmol = ng × 1000 / (lengte × ' + pt + ')')"/>
        </template>
      </div>
    </div>
    <div class="grid2">
      <div class="panel">
        <h3 v-html="tHtml('Forensische qPCR-kwantificatie <span class=&quot;example&quot;>voorbeeld</span>')"></h3>
        <div class="fields">
          <lk-field v-model="fqS" :label="t('Klein autosomaal doel')" for-id="fq-s" unit="ng/µL"/>
          <lk-field v-model="fqL" :label="t('Groot autosomaal doel')" for-id="fq-l" unit="ng/µL"/>
          <lk-field v-model="fqY" :label="t('Y-doel (mannelijk)')" for-id="fq-y" unit="ng/µL"/>
          <lk-field v-model="fqNg" :label="t('Gewenste STR-input')" for-id="fq-ng" unit="ng"/>
          <lk-field v-model="fqV" :label="t('Max. volume in PCR')" for-id="fq-v" unit="µL"/>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Concentraties zoals een kwantificatiekit met een kort en een lang autosomaal doel en een Y-doel ze geeft (bijvoorbeeld Quantifiler Trio).') }}</p>
      </div>
      <div class="result" id="fq-out">
        <lk-note v-if="!fq" kind="info">{{ t('Vul minstens de concentratie van het kleine autosomale doel in.') }}</lk-note>
        <template v-else>
          <lk-big v-if="fq.cls" :label="t('Degradatie-index')" :html="tHtml(fq.dis + ' <span class=&quot;chip ' + fq.cls[0] + '&quot; style=&quot;vertical-align:middle&quot;>' + fq.cls[1] + '</span>')"/>
          <lk-big v-else :label="t('Degradatie-index')" value="–"/>
          <lk-note v-for="(x, i) in fq.notes" :key="i" :kind="x[0]">{{ t(x[1]) }}</lk-note>
          <lk-kv :rows="fq.rows"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {pipHtml} from '../lib/pip.js';
import {lkNumIn} from '../lib/bridge.js';

/* getallen uit fmt/sig/sci in de taal van de gebruiker; tekst met een eenheid gaat door t() */
const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d)), S = (x, d) => lkNumIn(sci(x, d));
const chip = (cls, txt) => `<span class="chip ${cls}">${txt}</span>`;

export default {
  name: 'Dna',
  data() {
    return {
      a260: lkNumIn('0,85'), a280: lkNumIn('0,46'), a230: lkNumIn('0,41'), a320: '', type: '50', df: '10', pl: '1', vol: '50',
      mc: lkNumIn('0,35'), mng: '1', mv: '15',
      png: '50', bp: '1000', pt: '660', pvol: '10',
      fqS: lkNumIn('0,25'), fqL: lkNumIn('0,05'), fqY: lkNumIn('0,02'), fqNg: '1', fqV: '15'
    };
  },
  computed: {
    /* de knoppen van "Stuur door naar"; SEND staat in tools/nt/99_app.js, de klik wordt daar afgehandeld */
    sendTo() { return SEND.dna.to.map(x => x[0]); },
    /* A260 → concentratie en zuiverheid */
    a() {
      const a260 = num(this.a260), a280 = num(this.a280), a230 = num(this.a230), a320 = num(this.a320) || 0;
      const f = num(this.type), df = num(this.df) || 1, pl = num(this.pl) || 1, v = num(this.vol);
      if (!isFinite(a260)) return {note: ['info', 'Vul A₂₆₀ in.']};
      const c = (a260 - a320) * f * df / pl;
      if (a260 - a320 < 0) return {note: ['warn', 'A₂₆₀ is lager dan A₃₂₀; controleer de blanco en de meting.']};
      const t = this.t, rows = [], notes = [];
      const isRNA = f === 40, lo = isRNA ? 1.9 : 1.8, hi = isRNA ? 2.2 : 2.0;
      if (isFinite(a280) && a280 > 0 && !(a280 - a320 > 0)) notes.push(['warn', 'A₂₈₀ is niet groter dan A₃₂₀: de verhouding 260/280 is niet te berekenen.']);
      if (isFinite(a280) && a280 - a320 > 0) {
        const r = (a260 - a320) / (a280 - a320), ok = r >= lo && r <= hi;
        rows.push(['A₂₆₀/A₂₈₀', chip(ok ? 'ok' : r < lo ? 'bad' : 'warn', F(r, 2))]);
        if (r < lo) notes.push(['bad', '260/280 te laag: wijst op eiwit- of fenolverontreiniging.']);
        else if (r > hi) notes.push(['warn', isRNA ? '260/280 hoger dan verwacht.' : '260/280 hoog: mogelijk RNA in je DNA-extract.']);
      }
      if (isFinite(a230) && a230 > 0 && !(a230 - a320 > 0)) notes.push(['warn', 'A₂₃₀ is niet groter dan A₃₂₀: de verhouding 260/230 is niet te berekenen.']);
      if (isFinite(a230) && a230 - a320 > 0) {
        const r = (a260 - a320) / (a230 - a320), ok = r >= 2.0;
        rows.push(['A₂₆₀/A₂₃₀', chip(ok ? 'ok' : r >= 1.8 ? 'warn' : 'bad', F(r, 2))]);
        if (!ok) notes.push([r >= 1.8 ? 'warn' : 'bad', '260/230 lager dan 2,0: mogelijk zouten (guanidine), koolhydraten of fenol van de extractie.']);
      }
      if (isFinite(v)) rows.push([t('Opbrengst in ' + fmt(v, 0) + ' µL'), t(sig(c * v / 1000, 3) + ' µg')]);
      return {c, rows, notes,
        formula: t(`c = (A₂₆₀ − A₃₂₀) × ${f} × ${fmt(df, 1)} / ${fmt(pl, 2)} cm · ratio's: (A₂₆₀ − A₃₂₀) / (A₂ₓ₀ − A₃₂₀)`)};
    },
    /* normaliseren naar een vaste input */
    nm() {
      const mc = num(this.mc), ng = num(this.mng), mv = num(this.mv), t = this.t;
      if (!(isFinite(mc) && isFinite(ng) && isFinite(mv) && mc > 0 && ng > 0 && mv > 0)) return null;
      const vd = ng / mc, w = mv - vd, notes = [];
      if (w < 0) notes.push(['bad', `Het extract is te verdund: ${vol(vd)} past niet in ${vol(mv)}. Maximaal haalbaar: ${sig(mc * mv, 3)} ng. Concentreer het extract of gebruik het maximale volume.`]);
      else if (vd < 1) {
        const sub = Math.pow(10, Math.ceil(Math.log10(1 / vd)));
        notes.push(['warn', `Minder dan 1 µL is onnauwkeurig. Verdun het extract eerst 1:${sub} (${sig(mc / sub, 3)} ng/µL); pipetteer dan ${vol(vd * sub)}.`]);
      }
      if (ng < 0.1) notes.push(['warn', 'Onder ca. 100 pg nemen stochastische effecten toe (allel-drop-out, onbalans).']);
      return {vd: vol(vd), vdPip: pipHtml(vd), notes, rows: [
        [t('Water / TE'), w >= 0 ? t(vol(w)) + pipHtml(w) : '–'], [t('Totaal'), t(vol(mv))],
        [t('Eindconcentratie'), t(sig(ng / mv, 3) + ' ng/µL')],
        [t('≈ diploïde genomen'), F(ng * 1000 / 6.6, 0)],
        [t('≈ kopieën per autosomaal locus'), F(ng * 1000 / 6.6 * 2, 0)]]};
    },
    /* ng ↔ pmol ↔ kopieën */
    pm() {
      const png = num(this.png), bp = num(this.bp), mwb = num(this.pt), pvol = num(this.pvol), t = this.t, th = this.tHtml;
      if (!(isFinite(png) && isFinite(bp) && bp > 0)) return null;
      const mw = bp * mwb, pmol = png * 1000 / mw, copies = pmol * 1e-12 * 6.02214076e23;
      const rows = [[t('Molmassa'), th(sci(mw, 3) + ' g/mol')], [t('Hoeveelheid'), t(sig(pmol * 1000, 3) + ' fmol')], [t('Kopieën'), S(copies, 3)]];
      if (isFinite(pvol) && pvol > 0) rows.push([t('Concentratie'), t(sig(pmol / pvol * 1000, 3) + ' nM')], [t('Kopieën per µL'), S(copies / pvol, 3)]);
      return {pmol, rows};
    },
    /* forensische qPCR-kwantificatie: degradatie-index, man/vrouw en het volume voor de STR-PCR */
    fq() {
      const S1 = num(this.fqS), L = num(this.fqL), Yc = num(this.fqY), ng = num(this.fqNg), V = num(this.fqV), t = this.t;
      if (!(S1 > 0)) return null;
      const notes = [], rows = []; let di = null, cls = null;
      if (L > 0) {
        di = S1 / L;
        cls = di <= 1 ? ['ok', 'intact'] : di <= 10 ? ['warn', 'matig gedegradeerd'] : ['bad', 'sterk gedegradeerd'];
        rows.push([t('DI = klein / groot'), F(di, 2)]);
        if (di > 1) notes.push([di > 10 ? 'bad' : 'warn', di > 10 ? 'Sterke degradatie: een volledig STR-profiel is onwaarschijnlijk; overweeg mini-STR\'s of andere methoden.' : 'Mogelijke degradatie. Grote STR-loci vallen eerder weg; meer input kan helpen. Remming geeft een vergelijkbaar patroon, dus kijk ook naar de IPC.']);
      } else notes.push(['info', 'Geen groot autosomaal doel ingevuld (of niet gedetecteerd): DI niet te berekenen.']);
      if (isFinite(Yc)) {
        if (Yc > 0) {
          const fem = Math.max(0, S1 - Yc);
          rows.push([t('Mannelijk DNA (Y)'), t(sig(Yc, 3) + ' ng/µL')], [t('Vrouwelijk deel (schatting)'), t(sig(fem, 3) + ' ng/µL')],
            [t('Man : vrouw'), fem > 0 ? '1 : ' + F(fem / Yc, 1) : t('alleen mannelijk')]);
          if (fem / Yc >= 100) notes.push(['warn', 'Mannelijk deel is 1:100 of kleiner: autosomale STR\'s tonen de man waarschijnlijk niet; overweeg Y-STR\'s.']);
        } else rows.push([t('Mannelijk DNA (Y)'), t('niet gedetecteerd')]);
      }
      if (isFinite(ng) && ng > 0) {
        const vd = ng / S1;
        rows.push([t('Extract voor ' + fmt(ng, 2) + ' ng'), isFinite(V) && vd > V ? t(`${vol(V)} (max., ${sig(S1 * V, 3)} ng)`) : t(vol(vd))]);
        if (isFinite(V) && vd <= V) rows.push([t('Aanvullen met water/TE'), t(vol(V - vd))]);
        if (vd < 1) notes.push(['warn', 'Minder dan 1 µL extract: maak eerst een verdunning.']);
      }
      return {di, cls, notes, rows, dis: di == null ? '' : fmt(di, 2)};
    }
  },
  methods: {F, G}
};
</script>
