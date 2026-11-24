import {h, onMounted, onUnmounted, watch, ref} from 'vue';
import {pipHtml} from './pip.js';
import {sheetTSV} from './sheet.js';

/* ================= GEDEELDE VUE-COMPONENTEN =================
   De eerste omgezette tools bouwden hun uitkomst nog als een string HTML en zetten die met
   v-html in de pagina. Dat werkt, maar het is geen Vue: je raakt het declaratieve renderen
   kwijt, je bouwt opmaak met plakwerk en elke tool herhaalt dezelfde stukjes.

   Hieronder staan die stukjes één keer, als echte componenten. Ze zijn met h() geschreven in
   plaats van met een template, zodat ze geen compilatie per gebruik kosten.

     <lk-note kind="warn">tekst</lk-note>        een melding (info, warn, bad, ok)
     <lk-kv :rows="[[label, waarde], …]">        de definitielijst met uitkomsten
     <lk-field label="…" for="x-id" unit="µL">   een veld met label en eenheid
     <lk-overage v-model="ov" for-id="x-ov" :why="…">   overmaat: % marge, +1 reactie of geen
     <lk-table :cols="…" :rows="…" table-id>     een tabel met koppen en getalkolommen
     <lk-etable table-id="os-tbl" v-model:rows>   een bewerkbare tabel (in plaats van ET())
     <lk-big :value="…" sub="per reactie">       het grote getal bovenaan een uitkomst

   Afspraken die hier gelden:
   - Een label of kop die een gewone tekst is, gaat door t(). Geef je een waarde door die al
     opgemaakt is (een getal uit fmt(), vol() of sig()), dan blijft die staan zoals hij is.
   - Een waarde mag HTML zijn, want de tools maken die zelf; dat is dezelfde afspraak als bij
     de oude kv()-helper. Tekst van de gebruiker hoort daarom door esc() voordat hij hier
     binnenkomt.
   - De klassen zijn precies die van de bestaande opmaak (note, kv, big, mini, f, inu), zodat
     alle thema's en tests/layout_audit.py blijven werken. */

export const LKUI = {};

/* een melding: info (neutraal), warn (let op), bad (fout), ok (in orde) */
LKUI.note = {
  props: {kind: {type: String, default: 'info'}, html: {type: String, default: ''}},
  setup(props, {slots}) {
    return () => h('div', {class: 'note ' + props.kind},
      props.html ? [h('span', {innerHTML: props.html})] : (slots.default ? slots.default() : []));
  }
};

/* de uitkomstenlijst: rows is [[label, waarde], …]. Een waarde mag HTML bevatten. */
LKUI.kv = {
  props: {rows: {type: Array, default: () => []}},
  setup(props) {
    return () => h('dl', {class: 'kv'}, props.rows.filter(Boolean).flatMap(([k, v]) => [
      h('dt', {innerHTML: String(k)}),
      h('dd', {innerHTML: v == null ? '–' : String(v)})
    ]));
  }
};

/* pipetadvies naast een volume in µL: <lk-pip :v="2.5"/> geeft "P10", onder 1 µL ook de waarschuwing */
LKUI.pip = {
  props: {v: [Number, String]},
  setup(props) {
    return () => h('span', {innerHTML: pipHtml(parseFloat(props.v))});
  }
};

/* het grote getal bovenaan, met een label erboven en eventueel een klein woord erachter */
LKUI.big = {
  props: {label: String, value: [String, Number], sub: String, chip: String, chipKind: String,
    cls: String, top: String,
    /* html in plaats van value als het getal opmaak bevat, zoals de exponent uit sci():
       "1,33 × 10<sup>-5</sup>". Dezelfde afspraak als bij lk-note en lk-formula. */
    html: String},
  setup(props) {
    return () => h('div', null, [
      props.label ? h('div', {class: 'lbl', style: props.top ? 'margin-top:' + props.top : null}, props.label) : null,
      h('div', {class: 'big' + (props.cls ? ' ' + props.cls : '')}, [
        props.html ? h('span', {innerHTML: props.html}) : String(props.value == null ? '–' : props.value),
        props.sub ? h('small', null, ' ' + props.sub) : null,
        props.chip ? h('span', {class: 'chip ' + (props.chipKind || 'ok'),
          style: 'vertical-align:middle;margin-left:6px'}, props.chip) : null
      ])
    ]);
  }
};

/* een invoerveld met label en, als je die meegeeft, een eenheid erachter.
   Gebruik het met v-model: <lk-field v-model="v" label="…" for-id="dg-v" unit="µL"/> */
LKUI.field = {
  props: {modelValue: [String, Number], label: String, forId: String, unit: String,
    inputmode: {type: String, default: 'decimal'}, span: [String, Number], cls: String,
    /* labelHtml voor een label met opmaak erin, zoals K<sub>sp</sub>; geef het al vertaald mee */
    labelHtml: String},
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const input = () => h('input', {
      id: props.forId, inputmode: props.inputmode, class: props.cls,
      value: props.modelValue,
      onInput: e => emit('update:modelValue', e.target.value)
    });
    return () => h('div', {class: 'f', style: props.span ? 'grid-column:span ' + props.span : null}, [
      props.labelHtml
        ? h('label', {for: props.forId, innerHTML: props.labelHtml})
        : h('label', {for: props.forId}, props.label),
      props.unit
        ? h('div', {class: 'inu'}, [input(), h('span', {class: 'u'}, props.unit)])
        : input()
    ]);
  }
};

/* de overmaatkeuze bij een mastermix: % marge, +1 reactie of geen. why is de uitleg eronder. */
LKUI.overage = {
  props: {modelValue: {type: String, default: 'pct'}, forId: String, why: String},
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const tr = s => (typeof trPlain === 'function' ? trPlain(s) : s);
    const opts = [['pct', '% marge (veld hieronder/ernaast)'], ['plus1', '+1 reactie'], ['none', 'geen']];
    const pick = e => emit('update:modelValue', e.target.value);
    return () => h('div', {class: 'f'}, [
      h('label', {for: props.forId}, tr('Overmaat')),
      h('select', {id: props.forId, style: 'width:100%', value: props.modelValue, onChange: pick, onInput: pick},
        opts.map(([v, l]) => h('option', {value: v, selected: v === props.modelValue}, tr(l)))),
      props.why ? h('p', {style: 'font-size:12px;color:var(--muted);margin:4px 0 0'}, tr(props.why)) : null
    ]);
  }
};

/* een tabel. cols is [{h:'kop', num:true}, …] en rows is [[cel, …], …] of
   {cells:[…], cls:'hl'}. Een cel mag HTML zijn. */
LKUI.table = {
  props: {cols: {type: Array, default: () => []}, rows: {type: Array, default: () => []},
    wrap: {type: Boolean, default: true},
    /* de id van de tabel zelf; tests/validate.py zoekt een tabel soms op id op (#st-tukey) */
    tableId: String},
  setup(props) {
    const table = () => h('table', {class: 'mini', id: props.tableId}, [
      h('thead', null, h('tr', null, props.cols.map(c =>
        h('th', {class: c.num ? 'num' : null, innerHTML: String(c.h == null ? '' : c.h)})))),
      h('tbody', null, props.rows.filter(Boolean).map(r => {
        const cells = Array.isArray(r) ? r : r.cells;
        return h('tr', {class: Array.isArray(r) ? null : r.cls}, cells.map((v, i) =>
          h('td', {class: props.cols[i] && props.cols[i].num ? 'num' : null,
            innerHTML: v == null ? '–' : String(v)})));
      }))
    ]);
    return () => props.wrap
      ? h('div', {class: 'tbl-wrap', style: 'margin-top:12px'}, table())
      : table();
  }
};

/* de formuleregel onderaan een uitkomst */
LKUI.formula = {
  props: {html: String},
  setup(props, {slots}) {
    return () => h('div', {class: 'formula'},
      props.html ? [h('span', {innerHTML: props.html})] : (slots.default ? slots.default() : []));
  }
};

/* een genummerde werkwijze; steps is een lijst strings die HTML mogen bevatten */
LKUI.steps = {
  props: {steps: {type: Array, default: () => []}},
  setup(props) {
    return () => h('ol', {class: 'steps'},
      props.steps.filter(Boolean).map(s => h('li', {innerHTML: String(s)})));
  }
};

/* ---------- methodezin, naar het rapport en antwoordcontrole (S96) ----------
   <lk-report tool="verdunning" :sentence="html" :answer="getal" unit="mL" :digits="3">
   - de methodezin staat als tekst in het resultaat, dus het rapport (rpSection kopieert .result) neemt hem
     mee; Kopieer zet hem op het klembord;
   - "→ Rapport" zet deze tool vooraan in de keuze van het rapport en opent het (window.__rpVm, Rapport.vue);
   - "Controleer je antwoord": je eigen uitkomst; goed binnen 1 % of binnen een halve eenheid van het laatste
     cijfer dat je gaf. De knoppen en het invoerveld staan in een .row, die het rapport weglaat.
   - de regel Uitkomst (S96 deel 2): standaard :digits significante cijfers met "Meer cijfers" (#146), en met
     :units="[[eenheid, factor], …]" (waarde in die eenheid = answer × factor) een keuze van de eenheid (#145);
     de antwoordcontrole rekent dan in de gekozen eenheid.
   - :sheet (S96 deel 3, #149): de invoer en de uitkomst als rijen voor sheetTSV() (src/lib/sheet.js);
     "Kopieer met formules" zet ze op het klembord, met de uitkomst als Excel-formule op de invoercellen. */
/* getallen in de notatie van de gebruiker (zoals lkNumIn in bridge.js; die importeert dit bestand zelf) */
const lkn = v => (LANG === 'en' && typeof i18nNum === 'function' ? String(v).replace(/\d+(?:[.,]\d+)*/g, m => i18nNum(m)) : String(v));
LKUI.report = {
  props: {tool: String, sentence: {type: String, default: ''}, answer: {type: Number, default: NaN}, unit: {type: String, default: ''}, digits: {type: Number, default: 3},
    units: {type: Array, default: () => []}, sheet: {type: Array, default: () => []}},
  setup(props) {
    const mine = ref(''), copied = ref(false), more = ref(false), pick = ref(''), xl = ref(false);
    const copyXl = async () => { try { await navigator.clipboard.writeText(sheetTSV(props.sheet, LANG, [trPlain('Grootheid'), trPlain('Waarde'), trPlain('Eenheid')]));
      xl.value = true; setTimeout(() => { xl.value = false; }, 1500); } catch (e) {} };
    /* het antwoord in de gekozen eenheid; een keuze die niet meer in de lijst staat valt terug op unit */
    const shown = () => { const k = props.units.find(x => x[0] === pick.value);
      return k ? {a: props.answer * k[1], u: k[0]} : {a: props.answer, u: props.unit}; };
    const verdict = () => {
      const t = mine.value.trim(), A = shown().a; if (!t || !isFinite(A)) return null;
      const u = num(t); if (!isFinite(u)) return null;
      const dec = (t.replace(/^[^\d]*/, '').split(/[.,]/)[1] || '').replace(/[^\d]/g, '').length, half = 0.5 * 10 ** -dec;
      const ok = Math.abs(u - A) <= Math.max(Math.abs(A) * 0.01, half);
      return {ok, dev: A ? (u - A) / Math.abs(A) * 100 : 0};
    };
    const copy = async () => { const d = document.createElement('div'); d.innerHTML = props.sentence; try { await navigator.clipboard.writeText(d.textContent); copied.value = true; setTimeout(() => { copied.value = false; }, 1500); } catch (e) {} };
    const toRep = () => { try { const r = jget('labkit:v1:recent', []).filter(x => x !== props.tool); r.unshift(props.tool); jset('labkit:v1:recent', r.slice(0, 8)); } catch (e) {}
      const vm = window.__rpVm; if (vm) vm.sel = [props.tool, ...vm.sel.filter(x => x !== props.tool)]; location.hash = '#report'; };
    const clean = x => lkn(String(x).replace(/<[^>]+>/g, ''));
    return () => {
      const v = verdict(), S = shown(), U = S.u ? ' ' + S.u : '';
      return h('div', {class: 'lk-report', style: 'margin-top:10px'}, [
        isFinite(S.a) ? h('p', {class: 'lk-answer', style: 'font-size:13px;margin:0 0 6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap'}, [
          h('b', trPlain('Uitkomst') + ':'), h('span', {'data-answer': ''}, clean(sig(S.a, more.value ? 10 : props.digits))),
          props.units.length > 1 ? h('select', {'data-unit': '', 'aria-label': trPlain('Eenheid van de uitkomst'), value: S.u, onChange: e => { pick.value = e.target.value; }},
            props.units.map(x => h('option', {value: x[0]}, x[0]))) : (S.u ? h('span', S.u) : null),
          h('button', {type: 'button', class: 'xlbtn', 'data-more': '', 'aria-pressed': String(more.value), onClick: () => { more.value = !more.value; }},
            trPlain(more.value ? 'Minder cijfers' : 'Meer cijfers'))
        ]) : null,
        props.sentence ? h('p', {class: 'lk-method', style: 'font-size:13px;margin:0 0 6px'}, [h('b', trPlain('Methode') + ': '), h('span', {innerHTML: props.sentence})]) : null,
        h('div', {class: 'row', style: 'gap:6px;align-items:center;flex-wrap:wrap'}, [
          props.sentence ? h('button', {type: 'button', class: 'xlbtn', 'data-method-copy': '', onClick: copy}, trPlain(copied.value ? 'Gekopieerd' : 'Kopieer methodezin')) : null,
          h('button', {type: 'button', class: 'xlbtn', 'data-torep': '', onClick: toRep}, '→ ' + trPlain('Rapport')),
          props.sheet.length ? h('button', {type: 'button', class: 'xlbtn', 'data-xl-formula': '', title: trPlain('Plak in Excel: de uitkomst staat er als formule op de invoercellen'), onClick: copyXl},
            trPlain(xl.value ? 'Gekopieerd' : 'Kopieer met formules')) : null,
          isFinite(props.answer) ? h('label', {style: 'display:flex;gap:6px;align-items:center;font-size:13px;margin-left:auto'}, [
            trPlain('Controleer je antwoord:'),
            h('input', {class: 'txt', inputmode: 'decimal', style: 'width:110px', 'data-check': '', 'aria-label': trPlain('Je eigen antwoord'), value: mine.value, onInput: e => { mine.value = e.target.value; }}),
            S.u ? h('span', S.u) : null,
            v ? h('span', {'data-verdict': v.ok ? 'ok' : 'bad', style: 'font-weight:600;color:var(--' + (v.ok ? 'ok' : 'bad') + ')'},
              v.ok ? '✓ ' + trPlain('Goed') : '✗ ' + trPlain('Niet goed: het antwoord is ' + uv(clean(sig(S.a, props.digits)) + U) + '.')) : null
          ]) : null
        ])
      ]);
    };
  }
};

/* ---------- de bewerkbare tabel ----------
   ET() in tools/nt/00_lib.js bouwt zo'n tabel met strings HTML en leest hem met etGet() weer
   uit de DOM. In Vue kan dat niet: de volgende render gooit het terug. Deze component neemt
   dezelfde kolomopgave aan, zodat een tool die om gaat alleen ET(...) hoeft te ruilen voor
   <lk-etable>, en de tool houdt de rijen zelf bij.

     cols  [{h:'Stof', t:'txt'|'num'|'sel'|'col', w:110, o:[opties], d:'#1558b0'}, …]
           of een berekende kolom {h, t:'out', k:'m', num:true}: een alleen-lezen cel met
           data-m, waarvan de tool de inhoud in de slot #out zet ({ri, k, row}). Zo'n kolom heeft
           geen invoerveld en telt dus niet mee in inputCols; de rijen krijgen er wel een lege
           plaats voor, zodat de index van de kolommen gelijk blijft.
     rows  v-model: een lijst rijen, elke rij een lijst strings

   Drie dingen buiten de tool schrijven in zo'n tabel: tblRestore() zet een bewaarde tabel
   terug, addRow() laat een andere tool er een rij in duwen, en het plakken van een blok uit
   Excel vult cellen. Daarom zet deze component zijn haken op TBLDEF[id]:

     set(rows)  de hele tabel vervangen        get()    de rijen zoals ze nu zijn
     push(row)  een rij erbij                  blank()  een lege rij van de juiste breedte
     row()      bestaat alleen nog omdat oude code hem aanroept; hij geeft niets terug

   get() en blank() zijn er voor de plak-handler: die moet weten wat er staat en hoe breed een
   nieuwe rij is, want hij kan niet op de DOM wachten. */
LKUI.etable = {
  props: {
    tableId: {type: String, required: true},
    cols: {type: Array, default: () => []},
    rows: {type: Array, default: () => []},
    /* de id van de knop die een rij toevoegt; daarmee blijft het plakken van een blok werken */
    addId: String,
    cls: {type: String, default: 'mini'},
    wrap: {type: Boolean, default: true},
    /* een kolom # vooraan met het rijnummer (geen invoerveld, dus tblSnap() en plakken merken er niets van) */
    numbered: {type: Boolean, default: false}
  },
  emits: ['update:rows'],
  setup(props, {emit, slots}) {
    const blank = () => props.cols.map(c =>
      c.t === 'sel' ? (c.o && c.o[0]) || '' : c.t === 'col' ? (c.d || '#1558b0') : '');
    /* een waarde die van buiten komt is een getal of een string met een punt erin; in de
       tabel staat hij met een komma, net als bij inp() in de oude versie */
    const dec = v => (v == null || v === '' || (typeof v === 'number' && !isFinite(v))
      ? '' : (typeof LANG !== 'undefined' && LANG === 'en' ? String(v) : String(v).replace('.', ',')));
    const norm = r => props.cols.map((c, i) => (c.t === 'num' ? dec(r[i]) : (r[i] == null ? '' : String(r[i]))));
    const put = rows => emit('update:rows', rows);
    const optText = o => (typeof trPlain === 'function' ? trPlain(o, true) : o);

    const setRows = rows => put((rows || []).map(norm));
    const pushRow = r => {
      const next = props.rows.map(x => x.slice());
      const empty = next.findIndex(x => x.every((v, i) => props.cols[i].t === 'sel' || props.cols[i].t === 'col' || !String(v).trim()));
      if (empty >= 0) next.splice(empty, 1);
      next.push(norm(r));
      put(next);
    };

    const hooks = () => {
      if (typeof TBLDEF === 'undefined') return;
      TBLDEF[props.tableId] = {
        row: () => '',
        num: props.cols.map((c, i) => (c.t === 'num' ? i : -1)).filter(i => i >= 0),
        set: setRows, push: pushRow, blank,
        get: () => props.rows.map(r => r.slice()),
        /* welke kolom bij het hoeveelste invoerveld van een rij hoort. De plak-handler telt in
           invoervelden en een keuzelijst is er geen, dus zonder deze lijst zou hij een kolom
           opschuiven bij een tabel die met een keuzelijst begint. */
        inputCols: props.cols.map((c, i) => (c.t === 'sel' || c.t === 'out' ? -1 : i)).filter(i => i >= 0)
      };
      if (props.addId && typeof ADDBTN !== 'undefined') ADDBTN[props.tableId] = '#' + props.addId;
    };
    onMounted(hooks);
    /* de kolommen kunnen van vorm veranderen (een tool met een keuzelijst erboven), dus de
       haken worden opnieuw gezet als dat gebeurt */
    watch(() => props.cols, hooks);
    onUnmounted(() => {
      if (typeof TBLDEF !== 'undefined' && TBLDEF[props.tableId]
        && TBLDEF[props.tableId].get) delete TBLDEF[props.tableId];
    });

    const cell = (c, r, ri, ci) => {
      const set = val => {
        const next = props.rows.map(x => x.slice());
        next[ri][ci] = val;
        put(next);
      };
      const v = r[ci] == null ? '' : String(r[ci]);
      if (c.t === 'sel') {
        /* de waarde blijft de Nederlandse naam, want de tool zoekt daarmee op (OSMI, CHEM);
           alleen het label gaat door de vertaling, net als de DOM-laag eerder deed */
        return h('select', {value: v, 'aria-label': c.h,
          onChange: e => set(e.target.value)},
          (c.o || []).map(o => h('option', {value: o}, optText(o))));
      }
      if (c.t === 'col') {
        return h('input', {type: 'color', value: /^#[0-9a-f]{6}$/i.test(v) ? v : (c.d || '#1558b0'),
          'aria-label': 'Kleur', style: 'width:' + (c.w || 44) + 'px;height:28px;padding:1px',
          onInput: e => set(e.target.value)});
      }
      if (c.t === 'txt') {
        return h('input', {class: 'txt', value: v, style: 'width:' + (c.w || 110) + 'px',
          onInput: e => set(e.target.value)});
      }
      return h('input', {inputmode: 'decimal', value: v,
        style: 'text-align:right;width:' + (c.w || 80) + 'px',
        onInput: e => set(e.target.value)});
    };

    return () => {
      const table = h('table', {id: props.tableId, class: props.cls}, [
        h('thead', null, h('tr', null, [
          props.numbered ? h('th', {class: 'num'}, '#') : null,
          ...props.cols.map(c => h('th', {class: c.t === 'num' || c.num ? 'num' : null, innerHTML: String(c.h == null ? '' : c.h)})),
          h('th')
        ])),
        h('tbody', null, props.rows.map((r, ri) => h('tr', {key: ri}, [
          props.numbered ? h('td', {class: 'num'}, String(ri + 1)) : null,
          ...props.cols.map((c, ci) => (c.t === 'out'
            /* een berekende cel: alleen-lezen, met data-<k> zodat tests en andere code hem vinden;
               de inhoud komt uit de slot #out van de tool */
            ? h('td', {class: c.num ? 'num' : null, ['data-' + c.k]: ''},
              slots.out ? slots.out({ri, ci, k: c.k, row: r}) : null)
            : h('td', null, cell(c, r, ri, ci)))),
          h('td', null, h('button', {type: 'button', class: 'ghost', 'data-del': '',
            'aria-label': trPlain('Verwijder'),
            onClick: () => put(props.rows.filter((_, i) => i !== ri))}, '\u2715'))
        ])))
      ]);
      return props.wrap ? h('div', {class: 'tbl-wrap'}, table) : table;
    };
  }
};

/* Zet de gedeelde componenten op een app. lkVueMount() doet dit zelf, dus een tool hoeft er
   niets voor te doen. */
export function lkUiInstall(app) {
  app.component('lk-note', LKUI.note);
  app.component('lk-kv', LKUI.kv);
  app.component('lk-big', LKUI.big);
  app.component('lk-pip', LKUI.pip);
  app.component('lk-field', LKUI.field);
  app.component('lk-table', LKUI.table);
  app.component('lk-overage', LKUI.overage);
  app.component('lk-formula', LKUI.formula);
  app.component('lk-steps', LKUI.steps);
  app.component('lk-report', LKUI.report);
  app.component('lk-etable', LKUI.etable);
}
