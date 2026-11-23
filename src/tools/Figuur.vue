<!-- ================= FIGUURMAKER (S89) =================
     Uitkomsten van tools (de knop "→ Figuur" onder een grafiek en in de Gelfoto-editor) komen in de
     bak (src/tools/figuur/store.js, IndexedDB). Hier kies je een raster en zet je ze in de panelen:
     slepen uit de bak naar een paneel, of een item aanklikken en dan het paneel. De indeling staat in
     localStorage `lkFig` ({lay, slots, o}). S90: letters, uitlijnen, breedte en dpi, voorbeeld en export (PNG, PDF, SVG; figuur/compose.js). -->
<template>
  <div class="grid2" style="grid-template-columns:minmax(0,320px) minmax(0,1fr)">
    <div class="panel">
      <h3>{{ t('Uitkomsten') }}</h3>
      <p v-if="!items.length" style="font-size:13px;color:var(--muted);margin:0" id="fig-empty">{{ t('Nog niets toegevoegd.') }} {{ t('Kies → Figuur onder een grafiek of in de Gelfoto-editor (paneel Exporteren).') }}</p>
      <ul id="fig-tray" style="list-style:none;margin:0;padding:0;display:grid;grid-template-columns:minmax(0,1fr);gap:8px">
        <li v-for="e in items" :key="e.id" class="fig-item" :data-id="e.id" draggable="true" @dragstart="drag($event, e.id)" @click="pick(e.id)"
            :style="{display: 'flex', gap: '8px', alignItems: 'center', padding: '6px', borderRadius: '8px', cursor: 'grab', background: 'var(--surface)', outline: sel === e.id ? '2px solid var(--accent)' : '1px solid var(--line)'}">
          <img :src="url(e)" :alt="e.name" style="width:72px;height:54px;object-fit:contain;background:#fff;border-radius:4px;flex:none">
          <span style="flex:1;min-width:0;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" data-notr>{{ e.name }}</span>
          <button type="button" class="ghost" :aria-label="t('Verwijderen')" @click.stop="del(e.id)">✕</button>
        </li>
      </ul>
      <p v-if="sel" style="font-size:12.5px;color:var(--accent);margin:8px 0 0">{{ t('Klik nu op een paneel om het daar te zetten.') }}</p>
    </div>
    <div class="panel">
      <div class="row" style="gap:10px;align-items:flex-end">
        <div class="f">
          <label for="fig-lay">{{ t('Indeling') }}</label>
          <select id="fig-lay" v-model="lay">
            <option v-for="(v, k) in LAYS" :key="k" :value="k">{{ v.c }} × {{ v.r }}</option>
          </select>
        </div>
        <button type="button" id="fig-clear" @click="clear">{{ t('Panelen leegmaken') }}</button>
      </div>
      <div id="fig-grid" :style="{display: 'grid', gridTemplateColumns: 'repeat(' + L.c + ', minmax(0,1fr))', gap: '10px', marginTop: '12px'}">
        <div v-for="(id, i) in cells" :key="i" class="fig-slot" :data-slot="i" @dragover.prevent @drop="drop($event, i)" @click="place(i)"
             :style="{position: 'relative', aspectRatio: '4 / 3', border: '2px dashed var(--line)', borderRadius: '8px', background: id ? '#fff' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: sel ? 'copy' : 'default'}">
          <img v-if="id && byId[id]" :src="url(byId[id])" :alt="byId[id].name" style="max-width:100%;max-height:100%;object-fit:contain">
          <span v-else style="font-size:13px;color:var(--muted)">{{ t('Paneel ' + (i + 1)) }}</span>
          <button v-if="id" type="button" class="ghost" style="position:absolute;top:4px;right:4px" :aria-label="t('Paneel leegmaken')" @click.stop="empty(i)">✕</button>
        </div>
      </div>
      <p style="font-size:12.5px;color:var(--muted);margin:8px 0 0">{{ t('Sleep een uitkomst naar een paneel, of klik eerst de uitkomst en dan het paneel.') }}</p>
      <h3 style="margin-top:16px">{{ t('Figuur') }}</h3>
      <div class="row" style="gap:10px;align-items:flex-end;flex-wrap:wrap">
        <div class="f"><label for="fig-w">{{ t('Breedte') }}</label>
          <select id="fig-w" v-model="o.wmm"><option value="89">{{ t('89 mm (één kolom)') }}</option><option value="120">120 mm</option><option value="183">{{ t('183 mm (twee kolommen)') }}</option></select></div>
        <div class="f"><label for="fig-dpi">{{ t('Resolutie') }}</label>
          <select id="fig-dpi" v-model="o.dpi"><option value="300">300 dpi</option><option value="600">600 dpi</option></select></div>
        <div class="f"><label for="fig-let">{{ t('Letters') }}</label>
          <select id="fig-let" v-model="o.let"><option value="A">A, B, C</option><option value="a">a, b, c</option><option value="pA">(A), (B)</option><option value="Ad">A., B.</option><option value="">{{ t('geen') }}</option></select></div>
        <div class="f"><label for="fig-lpt">{{ t('Lettergrootte') }}</label>
          <select id="fig-lpt" v-model="o.lpt"><option value="8">8 pt</option><option value="10">10 pt</option><option value="12">12 pt</option><option value="14">14 pt</option></select></div>
        <div class="f"><label for="fig-va">{{ t('Uitlijnen') }}</label>
          <select id="fig-va" v-model="o.va"><option value="top">{{ t('boven') }}</option><option value="mid">{{ t('midden') }}</option></select></div>
        <div class="f"><label for="fig-gap">{{ t('Tussenruimte') }}</label>
          <select id="fig-gap" v-model="o.gap"><option value="1">1 mm</option><option value="2">2 mm</option><option value="4">4 mm</option></select></div>
      </div>
      <canvas id="fig-cv" style="display:block;max-width:100%;margin-top:12px;border:1px solid var(--line);background:#fff"></canvas>
      <div class="row" style="margin-top:10px;gap:6px">
        <button type="button" class="primary" id="fig-png" :disabled="!filled" @click="exp('png')">PNG</button>
        <button type="button" id="fig-pdf" :disabled="!filled" @click="exp('pdf')">PDF</button>
        <button type="button" id="fig-svg" :disabled="!filled" @click="exp('svg')">SVG</button>
        <span style="font-size:12.5px;color:var(--muted);align-self:center">{{ msg }}</span>
      </div>
      <p style="font-size:12.5px;color:var(--muted);margin:6px 0 0">{{ t('Kolombreedtes zoals Nature ze vraagt (89 en 183 mm); de PNG heeft de gekozen resolutie in het bestand, de SVG houdt grafieken als vector, de PDF is één pagina zo groot als de figuur.') }}</p>
    </div>
  </div>
</template>

<script>
import {figList, figDel} from './figuur/store.js';
import {figLayout, figCanvas, figSvg, figPdf} from './figuur/compose.js';

const LAYS = {'1x2': {c: 2, r: 1}, '2x1': {c: 1, r: 2}, '2x2': {c: 2, r: 2}, '1x3': {c: 3, r: 1}, '3x1': {c: 1, r: 3}, '2x3': {c: 3, r: 2}};

export default {
  data() { const s = jget('lkFig', {}); return {items: [], sel: null, lay: LAYS[s.lay] ? s.lay : '2x2', slots: Array.isArray(s.slots) ? s.slots : [], LAYS, msg: '',
    o: {wmm: '183', dpi: '600', let: 'A', lpt: '10', va: 'top', gap: '2', ...(s.o || {})}}; },
  computed: {
    L() { return LAYS[this.lay]; },
    cells() { const n = this.L.c * this.L.r; return Array.from({length: n}, (_, i) => this.slots[i] || null); },
    byId() { return Object.fromEntries(this.items.map(e => [e.id, e])); },
    filled() { return this.cells.some(id => id && this.byId[id]); }
  },
  watch: { lay() { this.save(); }, o: {deep: true, handler() { this.save(); this.preview(); }}, cells() { this.preview(); }, items() { this.preview(); } },
  created() { this.urls = new Map(); window.__figRefresh = () => this.load(); window.__figVm = this; this.load(); },
  mounted() { this.preview(); },
  methods: {
    async load() { this.items = await figList(); const ids = new Set(this.items.map(e => e.id)); this.slots = this.slots.map(id => (ids.has(id) ? id : null)); },
    /* één object-URL per item, hergebruikt zolang het item bestaat */
    url(e) { if (!this.urls.has(e.id)) this.urls.set(e.id, URL.createObjectURL(e.png)); return this.urls.get(e.id); },
    save() { jset('lkFig', {lay: this.lay, slots: this.slots, o: this.o}); },
    /* de opties als getallen voor figLayout; dpi apart (voorbeeld of export) */
    opts(dpi) { const L = this.L; return {cols: L.c, rows: L.r, cells: this.cells.map(id => (id && this.byId[id] ? {w: this.byId[id].w, h: this.byId[id].h} : null)), wmm: +this.o.wmm, dpi, gapmm: +this.o.gap, va: this.o.va, let: this.o.let, lpt: +this.o.lpt}; },
    async bitmaps() { this.bm = this.bm || new Map(); return Promise.all(this.cells.map(async id => { const e = id && this.byId[id]; if (!e) return null; if (!this.bm.has(id)) this.bm.set(id, await createImageBitmap(e.png)); return this.bm.get(id); })); },
    /* voorbeeld op ongeveer 700 beeldpunten breed */
    async preview() { await this.$nextTick(); const cv = document.getElementById('fig-cv'); if (!cv) return;
      const L = figLayout(this.opts(700 / (+this.o.wmm / 25.4))), c = figCanvas(L, await this.bitmaps()); cv.width = c.width; cv.height = c.height; cv.getContext('2d').drawImage(c, 0, 0); this.lay_ = L; },
    /* de export op de gekozen resolutie */
    async build() { const L = figLayout(this.opts(+this.o.dpi)); return {L, c: figCanvas(L, await this.bitmaps())}; },
    async exp(kind) {
      if (!this.filled) return; this.msg = this.t('Bezig…');
      try {
        const {L, c} = await this.build(), name = 'figuur';
        let blob;
        if (kind === 'png') { const b = await new Promise(r => c.toBlob(r, 'image/png')); blob = new Blob([pngDpi(new Uint8Array(await b.arrayBuffer()), +this.o.dpi)], {type: 'image/png'}); }
        else if (kind === 'pdf') blob = await figPdf(c, +this.o.wmm);
        else { const svgs = this.cells.map(id => (id && this.byId[id] && this.byId[id].svg) || null);
          const pngs = await Promise.all(this.cells.map(async id => { const e = id && this.byId[id]; if (!e || e.svg) return null; return new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(e.png); }); }));
          blob = new Blob([figSvg(L, svgs, pngs, +this.o.wmm)], {type: 'image/svg+xml'}); }
        this.last = blob; await saveBlob(name + '.' + kind, blob); this.msg = this.t('Opgeslagen.');
      } catch (err) { this.msg = this.t(err && err.code === 'declined' ? 'Download geannuleerd.' : 'Downloaden lukte niet hier.'); }
    },
    set(i, id) { const s = this.slots.slice(); while (s.length <= i) s.push(null); s[i] = id; this.slots = s; this.save(); },
    drag(ev, id) { ev.dataTransfer.setData('text/plain', id); ev.dataTransfer.effectAllowed = 'copy'; },
    drop(ev, i) { const id = ev.dataTransfer.getData('text/plain'); if (this.byId[id]) this.set(i, id); },
    pick(id) { this.sel = this.sel === id ? null : id; },
    place(i) { if (this.sel) { this.set(i, this.sel); this.sel = null; } },
    empty(i) { this.set(i, null); },
    clear() { this.slots = []; this.save(); },
    async del(id) { await figDel(id); const u = this.urls.get(id); if (u) { URL.revokeObjectURL(u); this.urls.delete(id); } }
  }
};
</script>
