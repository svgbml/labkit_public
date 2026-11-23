<!-- ================= FIGUURMAKER (S89) =================
     Uitkomsten van tools (de knop "→ Figuur" onder een grafiek en in de Gelfoto-editor) komen in de
     bak (src/tools/figuur/store.js, IndexedDB). Hier kies je een raster en zet je ze in de panelen:
     slepen uit de bak naar een paneel, of een item aanklikken en dan het paneel. De indeling staat in
     localStorage `lkFig` ({lay, slots: [id|null…]}). Letters A–D, uitlijnen en exporteren: S90. -->
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
    </div>
  </div>
</template>

<script>
import {figList, figDel} from './figuur/store.js';

const LAYS = {'1x2': {c: 2, r: 1}, '2x1': {c: 1, r: 2}, '2x2': {c: 2, r: 2}, '1x3': {c: 3, r: 1}, '3x1': {c: 1, r: 3}, '2x3': {c: 3, r: 2}};

export default {
  data() { const s = jget('lkFig', {}); return {items: [], sel: null, lay: LAYS[s.lay] ? s.lay : '2x2', slots: Array.isArray(s.slots) ? s.slots : [], LAYS}; },
  computed: {
    L() { return LAYS[this.lay]; },
    cells() { const n = this.L.c * this.L.r; return Array.from({length: n}, (_, i) => this.slots[i] || null); },
    byId() { return Object.fromEntries(this.items.map(e => [e.id, e])); }
  },
  watch: { lay() { this.save(); } },
  created() { this.urls = new Map(); window.__figRefresh = () => this.load(); window.__figVm = this; this.load(); },
  methods: {
    async load() { this.items = await figList(); const ids = new Set(this.items.map(e => e.id)); this.slots = this.slots.map(id => (ids.has(id) ? id : null)); },
    /* één object-URL per item, hergebruikt zolang het item bestaat */
    url(e) { if (!this.urls.has(e.id)) this.urls.set(e.id, URL.createObjectURL(e.png)); return this.urls.get(e.id); },
    save() { jset('lkFig', {lay: this.lay, slots: this.slots}); },
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
