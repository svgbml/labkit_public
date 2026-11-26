<!-- ================= STARTPAGINA (S263, de app-schil) =================
     Eerst bouwde bentoRender() in web/index.html de tegels als HTML-string, en twee modules
     plakten er later iets aan vast: tools/nt/99y_stage.js filterde op de gekozen fase en
     tools/nt/99z_ux.js zette de werkstroomtegel achter de tweede tegel. Die drie lagen staan nu
     in deze ene component.

     Wat in web/index.html en de modules blijft: toolIndex() (leest de navigatie), TAGS/
     tagList()/curTag(), de fasen (stageCur, stageHas), de werkstromen (WF, wfCur, WFKEY) en de
     sleutels FKEY/RKEY/UKEY met jget/jset. Het klikken op een werkstroomkaart (data-wf-start) en op
     het kruimelpad (zoekt '#bento-rest > .tile') blijft daar ook; daarom houdt deze component de
     structuur #bento > .hero + #bento-rest > .tile aan, en de id bento-q voor de rondleiding.

     Vue bezit zijn eigen DOM (data-notr), dus alle tekst gaat door t(). Namen en beschrijvingen
     komen uit de navigatie en de koppen van de tools; t() zoekt ze op en laat een tekst die al
     vertaald is gewoon staan. -->
<template>
  <div class="tile hero wide">
    <h2>Labkit BML</h2>
    <p>{{ t(all.length + ' tools voor rekenen, analyseren en vastleggen in het lab. Alles blijft op je eigen apparaat.') }}</p>
    <input id="bento-q" v-model="q" class="txt" type="search" :placeholder="t('Zoek een tool, bijvoorbeeld PCR, verdunning of ANOVA…')"
      :aria-label="t('Zoek een tool')" autocomplete="off" @keydown.enter="openFirst">
    <div class="tags" id="bento-tags" :aria-label="t('Tags')">
      <a v-for="g in tags" :key="g[0]" :class="['tag', {on: g[0] === tag}]" :href="g[0] === tag ? '#start' : tagHref(g[0])">{{ t(g[0]) }} <small>{{ g[1] }}</small></a>
    </div>
  </div>
  <div id="bento-rest" style="display:contents">
    <div v-for="(b, bi) in blocks" :key="b.key" :class="['tile', b.cls]" :style="b.style">
      <!-- de werkstroomtegel heeft een eigen opbouw -->
      <template v-if="b.wf">
        <h3>{{ t('Werkstromen') }} <span>{{ wf.length }}</span></h3>
        <p class="lk-wf-intro">{{ t('Doorloop de tools van een heel experiment op volgorde. Je invoer blijft per tool bewaard.') }}</p>
        <!-- S118: de runs van dit project, met de naam die de student gaf -->
        <div v-if="runs.length" class="lk-wf-runs" id="wf-runs">
          <span class="lbl">{{ t('Mijn werkstromen') }}</span>
          <button v-for="r in runs" :key="r.id" type="button" :class="['lk-btn', {primary: r.on}]" :data-run-open="r.id">{{ r.name }}</button>
        </div>
        <div class="lk-wf-list">
          <button v-for="w in wf" :key="w.id" type="button" :class="['lk-wf-card', {on: w.on}]" :data-wf-start="w.id">
            <b>{{ t(w.n) }}</b><small><template v-for="(s, si) in w.steps" :key="s"><template v-if="si"> → </template><span>{{ s }}</span></template></small>
          </button>
        </div>
      </template>
      <template v-else>
        <h3 v-if="b.tagHead"><span class="tags" style="margin:0"><a class="tag on" href="#start">{{ t(b.tagHead) }}</a></span><span>{{ b.list.length }}</span></h3>
        <h3 v-else>{{ b.title }} <span v-if="b.count != null">{{ b.count }}</span></h3>
        <div class="tlist" :style="b.listStyle">
          <div v-for="x in b.list" :key="x.id" class="tl">
            <a :href="'#' + x.id">{{ x.name }}<small v-if="b.desc">{{ x.desc }}</small><span v-if="b.tagsOn && x.tags.length" class="tl-tags"><span v-for="g in x.tags.slice(0, 4)" :key="g">{{ g }}</span></span></a>
            <button type="button" :class="{on: fav.includes(x.id)}" :data-fav="x.id" :title="t('Favoriet')" :aria-label="t('Favoriet')" @click="toggleFav(x.id)">★</button>
          </div>
          <div v-if="!b.list.length" class="empty">{{ b.empty }}</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
const WIDE = 'grid-template-columns:repeat(auto-fit,minmax(200px,1fr));column-gap:14px';

export default {
  name: 'Start',
  data() { return {q: '', hash: location.hash, tick: 0}; },
  computed: {
    /* alle tools, vertaald; tick laat dit opnieuw lezen na calc.start() (fase, favorieten, werkstroom) */
    all() {
      void this.tick; const t = this.t;
      return toolIndex().map(x => ({
        id: x.id, raw: x.name, grp: x.grp, name: t(x.name), desc: this.descOf(x), grpT: t(x.grp),
        tagsRaw: x.tags, tags: x.tags.map(g => t(g)),
      }));
    },
    /* de gekozen fase (Voorbereiden · Uitvoeren · Analyseren) filtert de tegels, niet de tellers in de kop */
    shown() { void this.tick; const st = stageCur(); return st ? this.all.filter(x => stageHas(x.id, st)) : this.all; },
    fav() { void this.tick; return jget(FKEY, []); },
    tag() { void this.hash; return curTag(); },
    tags() { void this.tick; return tagList(); },
    runs() {
      void this.tick; const r = jget('labkit:v1:runs', {});
      return (r.list || []).map(x => ({id: x.id, name: x.name, on: x.id === r.active}));
    },
    wf() {
      void this.tick; if (typeof WF === 'undefined') return [];
      const cur = wfCur(), N = {}; this.all.forEach(x => { N[x.id] = x.name; });
      return WF.map(w => ({id: w.id, n: w.n, on: !!(cur && cur.id === w.id), steps: w.steps.map(id => N[id] || id)}));
    },
    blocks() {
      const t = this.t, T = this.shown, ql = this.q.trim().toLowerCase(), by = id => T.find(x => x.id === id);
      if (ql) {
        /* zoeken op de Nederlandse en de vertaalde naam, beschrijving, groep en tags */
        const hits = T.filter(x => [x.raw, x.name, x.desc, x.grp, x.grpT, ...x.tagsRaw, ...x.tags].join(' ').toLowerCase().includes(ql));
        return [{key: 'q', cls: 'wide', title: t('Zoekresultaten'), count: hits.length, list: hits, desc: true, tagsOn: true, empty: t('Geen tool gevonden.')}];
      }
      if (this.tag) {
        const L = T.filter(x => x.tagsRaw.includes(this.tag));
        return [{key: 'tag', style: 'grid-column:1/-1', tagHead: this.tag, list: L, desc: true, listStyle: 'grid-template-columns:repeat(auto-fit,minmax(220px,1fr));column-gap:14px', empty: t('Geen tool gevonden.')}];
      }
      const rec = jget(RKEY, []).map(by).filter(Boolean).slice(0, 6);
      const out = [
        {key: 'fav', title: t('Favorieten'), list: this.fav.map(by).filter(Boolean), empty: t('Klik op de ster bij een tool om hem hier vast te zetten.')},
        {key: 'rec', title: t('Laatst gebruikt'), list: rec, empty: t('Nog niets geopend.')},
      ];
      /* meest gebruikt: de top 6 uit de lokale teller (UKEY); gelijke stand houdt de volgorde van de tools */
      const U = jget(UKEY, {}), top = T.filter(x => U[x.id] > 0).sort((a, b) => U[b.id] - U[a.id]).slice(0, 6).map(x => ({...x, desc: U[x.id] + '×'}));
      out.push({key: 'use', title: t('Meest gebruikt'), list: top, desc: true, empty: t('Nog niets geteld. De teller blijft op dit apparaat; er gaat niets naar buiten.')});
      if (this.wf.length) out.push({key: 'wf', cls: 'wide lk-wf-tile', wf: true});
      [...new Set(T.map(x => x.grp))].forEach(g => {
        const L = T.filter(x => x.grp === g), w = L.length > 6;
        out.push({key: 'g:' + g, cls: w ? 'wide' : '', title: t(g), count: L.length, list: L, desc: true, listStyle: w ? WIDE : ''});
      });
      return out;
    },
  },
  mounted() { this._h = () => { this.hash = location.hash; this.tick++; }; window.addEventListener('hashchange', this._h); },
  unmounted() { window.removeEventListener('hashchange', this._h); },
  methods: {
    refresh() { this.tick++; },
    /* De eerste zin van de inleiding van een tool. Alleen de hele inleiding is een vertaalsleutel
       (de DOM-laag zoekt het hele <p> op), dus eerst die vertalen en dan pas de zin eruit halen. */
    descOf(x) {
      const p = document.querySelector('#t-' + x.id + ' .tool-head p'); if (!p) return x.desc || '';
      const d = document.createElement('div'); d.innerHTML = this.tHtml(p.innerHTML.trim());
      return d.textContent.split(/(?<=[.:])\s/)[0].replace(/[.:]$/, '');
    },
    tagHref(g) { return tagHref(g); },
    openFirst() { const b = this.blocks[0]; const x = b && b.list && b.list[0]; if (x) location.hash = '#' + x.id; },
    toggleFav(id) {
      let f = jget(FKEY, []); f = f.includes(id) ? f.filter(x => x !== id) : [...f, id]; jset(FKEY, f);
      this.tick++; if (typeof navFavs === 'function') navFavs();
    },
  },
};
</script>
