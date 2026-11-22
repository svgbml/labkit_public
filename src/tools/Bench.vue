<!-- ================= BENCH-MODUS (S48) =================
     Eén stap per scherm, groot en in hoog contrast, voor aan de labtafel met handschoenen aan.
     Geen tool met een eigen sectie maar een laag over de hele app: een tool opent hem met
     openBench({title, steps}). Een stap is HTML die de tool zelf al vertaald en ge-escaped heeft
     (dezelfde afspraak als <lk-steps>), of {html, timer: [naam, seconden]} voor een wachtstap.
     Vegen of de grote knop gaat naar de volgende stap; het scherm blijft aan via de Wake Lock.
     De vinkjes blijven bewaard per run: dezelfde titel met dezelfde stappen (S49). -->
<template>
  <div v-if="on" class="bench" role="dialog" aria-modal="true" :aria-label="title" ref="root" tabindex="-1">
    <header class="bench-top">
      <span class="bench-title">{{ title }}</span>
      <button v-if="list && done.some(Boolean)" type="button" class="bench-tg" @click="reset">{{ t('Opnieuw') }}</button>
      <button type="button" class="bench-tg" @click="nOpen = !nOpen">{{ t('Notities') }}<span v-if="notes.length"> ({{ notes.length }})</span></button>
      <button type="button" class="bench-tg" @click="list = !list">{{ list ? t('Kaarten') : t('Lijst') }}</button>
      <button type="button" class="bench-x" :aria-label="t('Sluiten')" @click="close">✕</button>
    </header>
    <div class="bench-prog" role="progressbar" :aria-valuemin="0" :aria-valuemax="steps.length" :aria-valuenow="nDone">
      <span>{{ t(nDone + ' van ' + steps.length + ' klaar') }}</span><i><b :style="{width: 100 * nDone / steps.length + '%'}"></b></i>
    </div>
    <div class="bench-dots" aria-hidden="true">
      <span v-for="(s, k) in steps" :key="k" :class="{done: done[k], cur: k === i}" @click="i = k; list = false"></span>
    </div>
    <div v-if="nOpen" class="bench-notes">
      <textarea v-model="nText" rows="3" :placeholder="t('Notitie bij stap') + ' ' + (i + 1)"></textarea>
      <div class="bench-nrow">
        <label class="bench-photo"><input type="file" accept="image/*" capture="environment" @change="photo">{{ nImg ? t('Foto gekozen') : t('Foto toevoegen') }}</label>
        <label><input type="checkbox" v-model="nDev"> {{ t('Afwijking') }}</label>
        <button type="button" :disabled="!nText.trim() && !nImg" @click="addNote">{{ t('Bewaar notitie') }}</button>
      </div>
      <p v-if="nErr" class="bench-err">{{ nErr }}</p>
      <ul class="bench-nlist">
        <li v-for="(n, k) in notes" :key="k" :class="{dev: n.dev}">
          <b>{{ n.dev ? t('Afwijking') + ' · ' : '' }}{{ t('Stap') }} {{ n.step }} · {{ new Date(n.t).toLocaleString() }}</b>
          <span>{{ n.text }}</span><img v-if="n.img" :src="n.img" alt="">
          <button type="button" :aria-label="t('Verwijderen')" @click="delNote(k)">✕</button>
        </li>
      </ul>
    </div>
    <ol v-else-if="list" class="bench-list">
      <li v-for="(s, k) in steps" :key="k" :class="{done: done[k]}">
        <label><input type="checkbox" :checked="!!done[k]" @change="tick(k)"><span v-html="s.html"></span></label>
      </li>
    </ol>
    <div v-else class="bench-card" :class="{done: done[i]}" @pointerdown="sx = $event.clientX" @pointerup="swipe($event.clientX)">
      <div class="bench-n">{{ t('Stap ' + (i + 1) + ' van ' + steps.length) }}<span v-if="done[i]"> ✓</span></div>
      <div class="bench-text" v-html="cur.html"></div>
      <button v-if="cur.timer" type="button" class="bench-timer" @click="timer">{{ t('Start timer') }} · {{ mmss(cur.timer[1]) }}</button>
    </div>
    <footer class="bench-nav">
      <button type="button" :disabled="i === 0" @click="go(-1)">← {{ t('Vorige') }}</button>
      <button type="button" class="bench-ok" @click="ok">{{ done[i] ? t('Volgende') : t('Klaar') + ' ✓' }}</button>
    </footer>
    <p class="bench-wake">{{ wake ? t('Het scherm blijft aan.') : t('Deze browser kan het scherm niet aan houden.') }}</p>
  </div>
</template>

<script>
/* de vinkjes per run, de nieuwste 30 runs: {sleutel: [nummers van de afgevinkte stappen]} */
const BKEY = 'labkit:v1:bench';
export const benchGet = key => jget(BKEY, {})[key] || [];
export const benchPut = (key, ticks) => {
  const all = jget(BKEY, {}); delete all[key]; all[key] = ticks;
  const ks = Object.keys(all); ks.slice(0, Math.max(0, ks.length - 30)).forEach(k => delete all[k]);
  jset(BKEY, all);
};
/* run-notities en afwijkingen (S53): {sleutel: {title, notes: [{t, step, text, dev, img}]}}, de nieuwste 30 runs;
   het Rapport leest deze sleutel ook (rpNotes in 62_report.js) */
const NKEY = 'labkit:v1:benchnotes';
const runKey = (title, S) => { let h = 0; for (const c of title + '' + S.map(s => s.html).join('')) h = (h * 31 + c.codePointAt(0)) | 0; return String(h); };

export default {
  name: 'Bench',
  data() { return {on: false, title: '', steps: [], i: 0, done: [], list: false, wake: false, sx: null, nOpen: false, notes: [], nText: '', nImg: '', nDev: false, nErr: ''}; },
  computed: { nDone() { return this.done.filter(Boolean).length; }, cur() { return this.steps[this.i] || {html: ''}; } },
  methods: {
    mmss: s => mmss(s),
    open({title = '', steps = []}) {
      const S = steps.filter(Boolean).map(s => typeof s === 'string' ? {html: s} : s);
      if (!S.length) return;
      this.key_ = runKey(title, S);
      const got = benchGet(this.key_), done = S.map((s, k) => got.includes(k));
      Object.assign(this, {on: true, title, steps: S, i: Math.max(0, done.indexOf(false)), done, list: false, nOpen: false, nText: '', nImg: '', nDev: false, nErr: '', notes: (jget(NKEY, {})[this.key_] || {}).notes || []});
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', this.key);
      document.addEventListener('visibilitychange', this.lock);
      window.addEventListener('hashchange', this.close);
      this.lock();
      this.$nextTick(() => this.$refs.root && this.$refs.root.focus());
    },
    close() {
      if (!this.on) return;
      this.on = false;
      document.body.style.overflow = '';
      document.removeEventListener('keydown', this.key);
      document.removeEventListener('visibilitychange', this.lock);
      window.removeEventListener('hashchange', this.close);
      try { if (this.wl) this.wl.release(); } catch (e) {}
      this.wl = null;
    },
    /* de Wake Lock vervalt als het tabblad verborgen raakt, dus bij terugkomen opnieuw vragen */
    async lock() {
      if (!this.on || document.visibilityState !== 'visible') return;
      try { this.wl = await navigator.wakeLock.request('screen'); this.wake = true; } catch (e) { this.wake = false; }
    },
    /* foto verkleinen tot een JPEG van hooguit 800 px, zodat localStorage niet volloopt */
    photo(e) {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      const im = new Image(), u = URL.createObjectURL(f);
      im.onload = () => {
        const r = Math.min(1, 800 / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        this.nImg = c.toDataURL('image/jpeg', 0.6); URL.revokeObjectURL(u);
      };
      im.src = u;
    },
    addNote() {
      this.notes.push({t: Date.now(), step: this.i + 1, text: this.nText.trim(), dev: this.nDev, img: this.nImg});
      if (this.saveNotes()) Object.assign(this, {nText: '', nImg: '', nDev: false});
      else this.notes.pop();
    },
    delNote(k) { this.notes.splice(k, 1); this.saveNotes(); },
    saveNotes() {
      const all = jget(NKEY, {}); delete all[this.key_];
      if (this.notes.length) all[this.key_] = {title: this.title, notes: this.notes};
      const ks = Object.keys(all); ks.slice(0, Math.max(0, ks.length - 30)).forEach(k => delete all[k]);
      try { localStorage.setItem(NKEY, JSON.stringify(all)); this.nErr = ''; return true; }
      catch (e) { this.nErr = this.t('De notitie is niet bewaard: de opslag van de browser is vol. Verwijder oude notities of laat de foto weg.'); return false; }
    },
    go(d) { this.i = Math.max(0, Math.min(this.steps.length - 1, this.i + d)); },
    tick(k) { this.done.splice(k, 1, !this.done[k]); this.save(); },
    reset() { this.done = this.done.map(() => false); this.i = 0; this.save(); },
    save() { benchPut(this.key_, this.done.map((d, k) => d ? k : -1).filter(k => k >= 0)); },
    ok() { if (!this.done[this.i]) this.tick(this.i); this.go(1); },
    swipe(x) { const dx = x - this.sx; this.sx = null; if (Math.abs(dx) > 60) this.go(dx < 0 ? 1 : -1); },
    timer() { const [n, s] = this.cur.timer; addTimer(n, s); tmAct(timers[timers.length - 1].id, 's'); },
    key(e) {
      if (e.key === 'Escape') this.close();
      else if (e.key === 'ArrowRight') this.go(1);
      else if (e.key === 'ArrowLeft') this.go(-1);
      else if ((e.key === ' ' || e.key === 'Enter') && !/^(BUTTON|INPUT)$/.test(e.target.tagName)) { e.preventDefault(); this.ok(); }
    }
  }
};
</script>
