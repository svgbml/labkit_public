import {h} from 'vue';

/* ================= GEDEELDE VUE-COMPONENTEN =================
   De eerste omgezette tools bouwden hun uitkomst nog als een string HTML en zetten die met
   v-html in de pagina. Dat werkt, maar het is geen Vue: je raakt het declaratieve renderen
   kwijt, je bouwt opmaak met plakwerk en elke tool herhaalt dezelfde stukjes.

   Hieronder staan die stukjes één keer, als echte componenten. Ze zijn met h() geschreven in
   plaats van met een template, zodat ze geen compilatie per gebruik kosten.

     <lk-note kind="warn">tekst</lk-note>        een melding (info, warn, bad, ok)
     <lk-kv :rows="[[label, waarde], …]">        de definitielijst met uitkomsten
     <lk-field label="…" for="x-id" unit="µL">   een veld met label en eenheid
     <lk-table :cols="…" :rows="…">              een tabel met koppen en getalkolommen
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

/* het grote getal bovenaan, met een label erboven en eventueel een klein woord erachter */
LKUI.big = {
  props: {label: String, value: [String, Number], sub: String, chip: String, chipKind: String,
    cls: String, top: String},
  setup(props) {
    return () => h('div', null, [
      props.label ? h('div', {class: 'lbl', style: props.top ? 'margin-top:' + props.top : null}, props.label) : null,
      h('div', {class: 'big' + (props.cls ? ' ' + props.cls : '')}, [
        String(props.value == null ? '–' : props.value),
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
    inputmode: {type: String, default: 'decimal'}, span: [String, Number], cls: String},
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const input = () => h('input', {
      id: props.forId, inputmode: props.inputmode, class: props.cls,
      value: props.modelValue,
      onInput: e => emit('update:modelValue', e.target.value)
    });
    return () => h('div', {class: 'f', style: props.span ? 'grid-column:span ' + props.span : null}, [
      h('label', {for: props.forId}, props.label),
      props.unit
        ? h('div', {class: 'inu'}, [input(), h('span', {class: 'u'}, props.unit)])
        : input()
    ]);
  }
};

/* een tabel. cols is [{h:'kop', num:true}, …] en rows is [[cel, …], …] of
   {cells:[…], cls:'hl'}. Een cel mag HTML zijn. */
LKUI.table = {
  props: {cols: {type: Array, default: () => []}, rows: {type: Array, default: () => []}, wrap: {type: Boolean, default: true}},
  setup(props) {
    const table = () => h('table', {class: 'mini'}, [
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

/* Zet de gedeelde componenten op een app. lkVueMount() doet dit zelf, dus een tool hoeft er
   niets voor te doen. */
export function lkUiInstall(app) {
  app.component('lk-note', LKUI.note);
  app.component('lk-kv', LKUI.kv);
  app.component('lk-big', LKUI.big);
  app.component('lk-field', LKUI.field);
  app.component('lk-table', LKUI.table);
  app.component('lk-formula', LKUI.formula);
  app.component('lk-steps', LKUI.steps);
}
