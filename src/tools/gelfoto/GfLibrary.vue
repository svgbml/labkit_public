<!-- Recente gels: de bibliotheek in IndexedDB (library.js). De motor (gfLibSave) schrijft,
     dit paneel leest de lijst opnieuw via window.__gfLibRefresh. S79: vink twee tot zes gels aan en
     gfMultiFig zet ze als panelen A, B, … in de Figuurmaker. De vinkjes hebben geen id, dan gaan
     ze niet mee in een project (gfProjFields). -->
<template>
  <div class="panel">
    <h3>{{ t('Recente gels') }}</h3>
    <div class="row">
      <button type="button" id="gf-libsave" @click="save">{{ t('Bewaar in bibliotheek') }}</button>
      <!-- S118: standaard alleen de gels van het actieve project -->
      <label class="chk" style="font-size:13px"><input type="checkbox" id="gf-liball" v-model="all" @change="load"> {{ t('Toon alle projecten') }}</label>
    </div>
    <p v-if="items === null" style="font-size:12.5px;color:var(--muted);margin:8px 0 0">
      {{ t('De bibliotheek is niet beschikbaar in deze browser.') }}</p>
    <p v-else-if="!items.length" style="font-size:12.5px;color:var(--muted);margin:8px 0 0">
      {{ t('Nog geen gels bewaard.') }}</p>
    <ul v-else id="gf-lib" style="list-style:none;margin:8px 0 0;padding:0;display:grid;gap:8px">
      <li v-for="e in items" :key="e.id" class="gf-lib-i"
          style="display:flex;gap:8px;align-items:center;background:var(--surface);border-radius:8px;padding:6px;min-width:0">
        <input type="checkbox" class="gf-lib-pick" :value="e.id" v-model="pick" :aria-label="t('Kiezen voor één figuur')">
        <img :src="e.thumb" :alt="e.name" style="width:64px;height:48px;object-fit:cover;border-radius:4px;flex:none">
        <span style="flex:1;min-width:0;overflow:hidden">
          <b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ e.name }}</b>
          <span style="font-size:12px;color:var(--muted)">{{ when(e.date) }}<template v-if="where(e)"> · {{ where(e) }}</template></span>
        </span>
        <button type="button" class="gf-lib-open" @click="open(e)">{{ t('Openen') }}</button>
        <button type="button" class="ghost" :aria-label="t('Verwijderen')" @click="del(e)">✕</button>
      </li>
    </ul>
    <template v-if="items && items.length > 1">
      <label style="display:flex;gap:6px;align-items:center;font-size:13px;margin-top:10px">
        <input type="checkbox" v-model="ladFirst"> {{ t('Ladderwaarden alleen bij het eerste paneel') }}</label>
      <div class="row" style="margin-top:8px">
        <button type="button" id="gf-libfig" :disabled="pick.length < 2 || busy" @click="fig">{{ t('Maak één figuur (A, B, …)') }}</button>
      </div>
      <p style="font-size:12.5px;color:var(--muted);margin:6px 0 0">{{ t('Vink twee tot zes gels aan. Ze krijgen de exportopmaak van de open gel en komen als panelen A, B, … in de Figuurmaker.') }}</p>
    </template>
  </div>
</template>

<script>
import {libList, libDelete, gelProject} from './library.js';

export default {
  data() { return {items: [], pick: [], ladFirst: true, busy: false, all: false}; },
  created() { window.__gfLibRefresh = () => this.load(); this.load(); },
  methods: {
    async load() { this.items = await libList(this.all);
      /* gegroepeerd per run: eerst de gels van de actieve run, dan per run, nieuwste eerst */
      if (this.items) { const r = jget('labkit:v1:runs', {}), act = r.active || ''; const k = e => (e.run === act ? '0' : '1' + (e.run || '~')); this.items.sort((a, b) => k(a).localeCompare(k(b)) || b.date - a.date); } const ids = new Set((this.items || []).map(e => e.id)); this.pick = this.pick.filter(id => ids.has(id)); },
    /* in de volgorde van de lijst (nieuwste eerst), hoogstens zes */
    async fig() {
      const sel = this.items.filter(e => this.pick.includes(e.id)).slice(0, 6);
      this.busy = true;
      try { if (await gfMultiFig(sel, this.ladFirst)) location.hash = '#figuur'; } finally { this.busy = false; }
    },
    save() { gfLibSave(false); },
    open(e) { gfLibOpen(e); },
    del(e) { libDelete(e.id); },
    /* bij welke run (en met "alle projecten" welk project) een gel hoort */
    where(e) {
      const r = (jget('labkit:v1:runs', {}).list || []).find(x => x.id === e.run), m = jget('labkit:v1:projects', {list: []});
      const p = this.all ? (m.list.find(x => x.id === gelProject(e)) || {}).name : '';
      return [p, r ? r.name : ''].filter(Boolean).join(' · ');
    },
    when(d) { return new Date(d).toLocaleString(LANG === 'en' ? 'en-GB' : 'nl-NL', {dateStyle: 'short', timeStyle: 'short'}); }
  }
};
</script>
