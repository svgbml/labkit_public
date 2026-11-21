<!-- ================= RAPPORT / LABJOURNAAL =================
     De bediening (titel, naam, bronnen/invoer, de lijst tools met data-rp, de knoppen) en de
     melding "In het rapport" staan hier. Het verzamelen van wat andere tools laten zien
     (rpSection) en het opbouwen van het losse document (rpDoc, rpPrint) blijven globaal in
     tools/nt/62_report.js: de knoppen "Afdrukken" onder de tekeningen en bij elke tool roepen
     rpDoc/rpPrint ook aan. De id's (rp-title, rp-who, rp-src, rp-in, rp-recent, rp-none,
     rp-list, rp-print, rp-docx, rp-dl, rp-out) en de data-rp-attributen blijven zoals ze waren. -->
<template>
  <div class="stack">
    <div class="panel">
      <div class="fields">
        <div class="f"><label for="rp-title">{{ t('Titel') }}</label><input id="rp-title" class="txt" v-model="title"></div>
        <div class="f"><label for="rp-who">{{ t('Naam') }}</label><input id="rp-who" class="txt" :placeholder="t('optioneel')" v-model="who"></div>
        <label class="chk" for="rp-src"><input type="checkbox" id="rp-src" v-model="withSrc"> {{ t('Bronnen opnemen') }}</label>
        <label class="chk" for="rp-in"><input type="checkbox" id="rp-in" v-model="withIn"> {{ t('Invoer opnemen') }}</label>
      </div>
      <div class="row" style="margin-top:10px;gap:8px">
        <button type="button" id="rp-recent" @click="recent">{{ t('Laatst gebruikt') }}</button>
        <button type="button" id="rp-none" @click="sel = []">{{ t('Niets') }}</button>
      </div>
      <div id="rp-list" style="margin-top:10px;columns:3 220px;column-gap:18px">
        <label v-for="tl in tools" :key="tl.id" class="chk" style="display:flex;break-inside:avoid;margin:2px 0">
          <input type="checkbox" :data-rp="tl.id" :value="tl.id" v-model="sel"> {{ t(tl.name) }}
        </label>
      </div>
      <div class="row" style="margin-top:12px;gap:8px">
        <button type="button" id="rp-print" class="primary" @click="print">{{ t('Afdrukken / PDF') }}</button>
        <button type="button" id="rp-docx" @click="docx">{{ t('Download Word (.docx)') }}</button>
        <button type="button" id="rp-dl" @click="dl">{{ t('Download HTML') }}</button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Kies "Opslaan als PDF" in het afdrukvenster voor een PDF. Het Word-bestand opent in Word, LibreOffice en Google Docs. Het rapport gebruikt de huidige invoer van elke tool; alles blijft op je eigen apparaat.') }}</p>
    </div>
    <div class="result" id="rp-out">
      <template v-if="ids.length">
        <lk-big :label="t('In het rapport')" :html="tHtml(ids.length + ' <small>tools</small>')"/>
        <lk-steps :steps="stepNames"/>
      </template>
      <lk-note v-else kind="info">{{ t('Vink de tools aan die in het rapport moeten.') }}</lk-note>
    </div>
  </div>
</template>

<script>
/* de invoer die storeGet() eerder bewaarde onder de id's van deze velden */
const stored = (id, d) => { try { const v = storeGet()[id]; return v == null ? d : v; } catch (e) { return d; } };

export default {
  name: 'Rapport',
  data() {
    return {
      title: stored('rp-title', 'Labjournaal'), who: stored('rp-who', ''),
      withSrc: !!stored('rp-src', true), withIn: !!stored('rp-in', true),
      tools: rpTools(), sel: jget(RKEY, []).slice(0, 4)
    };
  },
  computed: {
    /* de aangevinkte tools in de volgorde van de lijst, zoals de DOM ze eerder gaf */
    ids() { return this.tools.map(t => t.id).filter(id => this.sel.includes(id)); },
    stepNames() { return this.ids.map(id => esc(this.t((this.tools.find(t => t.id === id) || {}).name || id))); }
  },
  methods: {
    recent() { this.sel = jget(RKEY, []).slice(0, 6); },
    html() { return rpDoc(this.ids, this.withIn, this.withSrc, this.title, this.who); },
    print() { rpPrint(this.html()); },
    dl() {
      const b = new Blob([this.html()], {type: 'text/html'}), a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = (this.title || 'labjournaal').replace(/[^\w\- ]+/g, '') + '.html';
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    },
    docx() {
      const html = this.html(), d = new DOMParser().parseFromString(html, 'text/html'), t = this.title || 'Labjournaal';
      d.querySelectorAll('style').forEach(x => x.remove());
      const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:-99999px;top:0'; host.setAttribute('data-notr', ''); host.innerHTML = d.body.innerHTML; document.body.appendChild(host);
      const imgs = [...host.querySelectorAll('img')];
      Promise.all(imgs.map(im => im.complete ? 1 : new Promise(r => { im.onload = im.onerror = r; }))).then(() => {
        try { saveBlob((t.replace(/[^\w\- ]+/g, '').trim() || 'labjournaal') + '.docx', htmlToDocx(host, t)).catch(() => {}); } finally { host.remove(); }
      });
    }
  }
};
</script>
