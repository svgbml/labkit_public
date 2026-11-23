<!-- ================= GELFOTO-EDITOR: ONGEDAAN MAKEN EN GESCHIEDENIS (S74) =================
     Onder de foto: ongedaan maken, opnieuw en de lijst van stappen. De geschiedenis zelf (gfHist,
     gfUndo, gfRedo, gfHistGo) staat in src/engines/gelfoto.js; een klik op een stap springt
     ernaartoe. Stappen na de huidige zijn grijs: die komen terug met Opnieuw doen, tot je iets nieuws doet. -->
<template>
  <div class="row" style="margin-top:8px;gap:6px;align-items:flex-start">
    <button type="button" id="gf-undo" :disabled="h.i < 1" :title="t('Ongedaan maken (Ctrl+Z)')" @click="undo">↶ {{ t('Ongedaan maken') }}</button>
    <button type="button" id="gf-redo" :disabled="h.i >= h.n - 1" :title="t('Opnieuw doen (Ctrl+Y)')" @click="redo">↷ {{ t('Opnieuw doen') }}</button>
    <details id="gf-hist" style="flex:1;min-width:180px">
      <summary>{{ t('Geschiedenis (' + h.n + ' stappen)') }}</summary>
      <ol style="margin:6px 0 0;padding-left:22px;max-height:200px;overflow-y:auto;font-size:13px">
        <li v-for="(s, k) in h.list" :key="k" :style="{color: k > h.i ? 'var(--muted)' : ''}">
          <button type="button" class="ghost" style="padding:1px 6px;font-weight:inherit;color:inherit"
                  :class="{on: k === h.i}" :aria-current="k === h.i ? 'step' : null" @click="go(k)">{{ t(s) }}</button>
        </li>
      </ol>
    </details>
  </div>
</template>

<script>
import {gfMix} from './tick.js';

export default {
  mixins: [gfMix],
  computed: {
    h() { this.tick; return {i: gfHist.i, n: gfHist.list.length, list: gfHist.list.map(s => s.lab)}; }
  },
  methods: {
    undo() { gfUndo(); },
    redo() { gfRedo(); },
    go(k) { gfHistGo(k); }
  }
};
</script>
