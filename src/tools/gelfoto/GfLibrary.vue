<!-- Recente gels: de bibliotheek in IndexedDB (library.js). De motor (gfLibSave) schrijft,
     dit paneel leest de lijst opnieuw via window.__gfLibRefresh. -->
<template>
  <div class="panel">
    <h3>{{ t('Recente gels') }}</h3>
    <div class="row">
      <button type="button" id="gf-libsave" @click="save">{{ t('Bewaar in bibliotheek') }}</button>
    </div>
    <p v-if="items === null" style="font-size:12.5px;color:var(--muted);margin:8px 0 0">
      {{ t('De bibliotheek is niet beschikbaar in deze browser.') }}</p>
    <p v-else-if="!items.length" style="font-size:12.5px;color:var(--muted);margin:8px 0 0">
      {{ t('Nog geen gels bewaard.') }}</p>
    <ul v-else id="gf-lib" style="list-style:none;margin:8px 0 0;padding:0;display:grid;gap:8px">
      <li v-for="e in items" :key="e.id" class="gf-lib-i"
          style="display:flex;gap:8px;align-items:center;background:var(--surface);border-radius:8px;padding:6px;min-width:0">
        <img :src="e.thumb" :alt="e.name" style="width:64px;height:48px;object-fit:cover;border-radius:4px;flex:none">
        <span style="flex:1;min-width:0;overflow:hidden">
          <b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ e.name }}</b>
          <span style="font-size:12px;color:var(--muted)">{{ when(e.date) }}</span>
        </span>
        <button type="button" class="gf-lib-open" @click="open(e)">{{ t('Openen') }}</button>
        <button type="button" class="ghost" :aria-label="t('Verwijderen')" @click="del(e)">✕</button>
      </li>
    </ul>
  </div>
</template>

<script>
import {libList, libDelete} from './library.js';

export default {
  data() { return {items: []}; },
  created() { window.__gfLibRefresh = () => this.load(); this.load(); },
  methods: {
    async load() { this.items = await libList(); },
    save() { gfLibSave(false); },
    open(e) { gfLibOpen(e); },
    del(e) { libDelete(e.id); },
    when(d) { return new Date(d).toLocaleString(LANG === 'en' ? 'en-GB' : 'nl-NL', {dateStyle: 'short', timeStyle: 'short'}); }
  }
};
</script>
