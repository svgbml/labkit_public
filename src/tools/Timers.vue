<!-- ================= TIMERS =================
     Het formulier, de snelle timers en het rooster van timers. De timers zelf blijven buiten de
     component: `timers`, `tid`, addTimer(), tmAct(), mmss(), het interval dat tikt en piept, de
     melding en het bewaren in localStorage staan in web/index.html, omdat timers doorlopen en
     piepen terwijl je in een andere tool werkt, en omdat de Experimentplanner addTimer() aanroept.

     De component leest die lijst bij elke `tick`: renderTimers() in index.html verhoogt hem
     (via window.__tmVm), bij elke wijziging en elke 250 ms zolang een timer loopt.
     De id's tm-name, tm-min, tm-sec, tm-add, tm-presets en tm-grid blijven zoals ze waren. -->
<template>
  <div>
    <div class="panel" style="margin-bottom:14px">
      <div class="row">
        <div class="f"><label for="tm-name">{{ t('Naam') }}</label>
          <input id="tm-name" class="txt" v-model="name" style="width:180px"></div>
        <div class="f"><label for="tm-min">{{ t('Minuten') }}</label>
          <input id="tm-min" inputmode="numeric" v-model="min" style="width:90px"></div>
        <div class="f"><label for="tm-sec">{{ t('Seconden') }}</label>
          <input id="tm-sec" inputmode="numeric" v-model="sec" style="width:90px"></div>
        <div class="f"><label>&nbsp;</label>
          <button type="button" class="primary" id="tm-add" @click="add">{{ t('Timer toevoegen') }}</button></div>
      </div>
      <div class="row" style="margin-top:12px" id="tm-presets">
        <span style="font-size:13px;color:var(--muted)">{{ t('Snel:') }}</span>
        <button type="button" v-for="(p, i) in presets" :key="i" :data-tp="i" @click="preset(i)">{{ p.label }}</button>
      </div>
    </div>
    <div class="tgrid" id="tm-grid">
      <p v-if="!list.length" style="color:var(--muted)">{{ t('Nog geen timers. Voeg er een toe of kies een snelle timer.') }}</p>
      <div v-for="x in list" :key="x.id" class="timer" :class="x.cls" :data-t="x.id">
        <div class="tn">
          <input class="txt" :value="x.name" data-tname :aria-label="t('Naam timer')" @input="rename(x.id, $event)">
          <button type="button" class="ghost" data-tx :aria-label="t('Verwijder timer')" @click="act(x.id, 'x')">✕</button>
        </div>
        <div class="tt" data-tt>{{ x.tt }}</div>
        <div class="progress"><i :style="{width: x.pct + '%'}"></i></div>
        <div class="row">
          <button type="button" class="primary" data-ts @click="act(x.id, 's')">{{ x.go }}</button>
          <button type="button" data-tr @click="act(x.id, 'r')">{{ t('Reset') }}</button>
          <button type="button" data-tp1 @click="act(x.id, 'p1')">{{ t('+1 min') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* de invoer die storeGet() eerder bewaarde onder de id's van deze velden */
const stored = (id, d) => { try { const v = storeGet()[id]; return v == null ? d : v; } catch (e) { return d; } };

export default {
  name: 'Timers',
  data() {
    return {name: stored('tm-name', 'Incubatie'), min: stored('tm-min', '15'), sec: stored('tm-sec', '0'),
      tick: 0};
  },
  computed: {
    presets() {
      return TPRE.map(p => ({label: this.t(p[0]) + ' · ' + p[1] + ':' + String(p[2]).padStart(2, '0')}));
    },
    /* een weergaveregel per timer; `tick` is de enige afhankelijkheid, de timers zelf zijn gewone
       objecten die de engine in index.html bijwerkt */
    list() {
      this.tick;
      const t = this.t;
      return timers.map(x => ({id: x.id, name: x.name, tt: mmss(x.rem),
        cls: x.done ? 'done' : x.run ? 'running' : '', pct: (1 - x.rem / x.total) * 100,
        go: x.done ? t('Stop alarm') : x.run ? t('Pauze') : x.rem < x.total ? t('Hervat') : t('Start')}));
    }
  },
  mounted() { window.__tmVm = this; },
  methods: {
    add() {
      unlockAudio(); askNotify();
      const s = (num(this.min) || 0) * 60 + (num(this.sec) || 0);
      if (s > 0) addTimer(this.name || 'Timer', s);
    },
    preset(i) {
      unlockAudio(); askNotify();
      const p = TPRE[i]; addTimer(p[0], p[1] * 60 + p[2]);
    },
    act(id, what) { tmAct(id, what); },
    /* een nieuwe naam gaat meteen naar de timer; er hoeft niet opnieuw getekend te worden */
    rename(id, e) { const x = timers.find(y => y.id == id); if (x) x.name = e.target.value; }
  }
};
</script>
