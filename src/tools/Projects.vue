<!-- ================= PROJECTEN EN MIJN WERKSTROMEN (S118) =================
     De knop met de projectnaam in de bovenbalk, het paneel met projecten en runs, en het
     venster om een werkstroom te starten. Het werk zelf (inpakken, uitpakken, herladen) doet
     src/engines/projects.js. Zie docs/W1.md. -->
<template>
  <button type="button" id="proj-chip" class="ghost lk-proj-chip" :title="t('Projecten en werkstromen')" @click="show">{{ cur ? cur.name : t('Project') }}</button>
  <!-- de vensters naar <body>: in de zijbalk zou de hoofdkolom eroverheen liggen -->
  <Teleport to="body">
  <div v-if="open" class="lk-modal lk-proj-ov" @mousedown.self="open = false" @keydown.esc="open = false">
    <div role="dialog" aria-modal="true" :aria-label="t('Projecten')" class="lk-proj-box">
      <div class="lk-proj-head"><h3>{{ t('Projecten') }}</h3><button type="button" class="ghost" id="proj-close" @click="open = false">{{ t('Sluiten') }}</button></div>
      <ul class="lk-proj-list" id="proj-list">
        <li v-for="p in list" :key="p.id" :class="{on: p.id === active}">
          <template v-if="ren === p.id">
            <input class="txt" v-model="renName" @keydown.enter="doRename(p.id)" :aria-label="t('Nieuwe naam')">
            <button type="button" @click="doRename(p.id)">{{ t('Bewaren') }}</button>
          </template>
          <template v-else>
            <span class="nm">{{ p.name }}</span><small>{{ size[p.id] || '' }}</small>
            <span v-if="p.id === active" class="chip ok">{{ t('open') }}</span>
            <button v-else type="button" class="proj-open" @click="busy(() => switchProject(p.id))">{{ t('Openen') }}</button>
            <button type="button" class="ghost" @click="ren = p.id; renName = p.name">{{ t('Naam') }}</button>
            <button type="button" class="ghost proj-export" @click="busy(() => downloadProject(p.id))">{{ t('Exporteren') }}</button>
            <button v-if="p.id !== active" type="button" :class="['ghost', {bad: del === p.id}]" @click="del === p.id ? busy(() => remove(p.id)) : del = p.id">{{ del === p.id ? t('Zeker? Verwijderen') : t('Verwijderen') }}</button>
          </template>
        </li>
      </ul>
      <form class="row lk-proj-new" @submit.prevent="create">
        <input class="txt" id="proj-new" v-model="newName" :placeholder="t('Naam van een nieuw project')">
        <button type="submit" :disabled="!newName.trim()">{{ t('Nieuw project') }}</button>
      </form>
      <h3 style="margin-top:16px">{{ t('Mijn werkstromen') }}</h3>
      <p v-if="!runs.list.length" class="note-s">{{ t('Nog geen werkstroom in dit project. Start er een op de startpagina.') }}</p>
      <ul v-else class="lk-proj-list" id="run-list">
        <li v-for="r in runs.list" :key="r.id" :class="{on: r.id === runs.active}">
          <template v-if="ren === r.id">
            <input class="txt" v-model="renName" @keydown.enter="doRenameRun(r.id)" :aria-label="t('Nieuwe naam')">
            <button type="button" @click="doRenameRun(r.id)">{{ t('Bewaren') }}</button>
          </template>
          <template v-else>
            <span class="nm">{{ r.name }}</span><small>{{ t(wfName(r.wf)) }}</small>
            <template v-if="r.id === runs.active">
              <span class="chip ok">{{ t('open') }}</span>
              <button type="button" class="ghost run-stop" @click="busy(stopRun)">{{ t('Stoppen') }}</button>
            </template>
            <button v-else type="button" class="run-open" @click="busy(() => switchRun(r.id))">{{ t('Openen') }}</button>
            <button type="button" class="ghost" @click="ren = r.id; renName = r.name">{{ t('Naam') }}</button>
            <button v-if="r.id !== runs.active" type="button" :class="['ghost', {bad: del === r.id}]" @click="del === r.id ? delRun(r.id) : del = r.id">{{ del === r.id ? t('Zeker? Verwijderen') : t('Verwijderen') }}</button>
          </template>
        </li>
      </ul>
      <h3 style="margin-top:16px">{{ t('Notities') }}</h3>
      <ul v-if="notes.length" class="lk-proj-notes" id="proj-notes">
        <li v-for="n in notes" :key="n.t"><small>{{ when(n.t) }}<template v-if="n.run"> · {{ n.run }}</template></small>
          <span>{{ n.text }}</span><button type="button" class="ghost" :aria-label="t('Verwijderen')" @click="P.delNote(n.t); refresh()">✕</button></li>
      </ul>
      <div class="row lk-proj-new">
        <textarea id="proj-note" rows="2" v-model="note" :placeholder="t('Notitie bij dit project')"></textarea>
        <button type="button" id="proj-note-add" :disabled="!note.trim()" @click="P.addNote(note); note = ''; refresh()">{{ t('Toevoegen') }}</button>
      </div>
      <h3 style="margin-top:16px">{{ t('Bestanden') }}</h3>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <button type="button" id="proj-import" @click="$refs.file.click()">{{ t('Project importeren') }}</button>
        <button type="button" class="ghost" id="proj-backup" @click="busy(P.backupAll)">{{ t('Alles back-uppen') }}</button>
        <input ref="file" type="file" id="proj-file" accept=".json,application/json" hidden @change="pickFile">
      </div>
      <lk-note v-if="msg" :kind="msg.kind">{{ msg.text }}</lk-note>
      <div v-if="restore" class="lk-proj-confirm">
        <lk-note kind="warn">{{ t('Dit is een back-up van een heel apparaat. Terugzetten vervangt alle projecten, werkstromen en gels hier.') }}</lk-note>
        <div class="row" style="gap:8px"><button type="button" class="primary" id="proj-restore" @click="busy(() => P.restoreBackup(restore))">{{ t('Alles vervangen') }}</button>
          <button type="button" class="ghost" @click="restore = null">{{ t('Annuleren') }}</button></div>
      </div>
      <p class="note-s" id="proj-space">{{ spaceTxt }}</p>
    </div>
  </div>
  <!-- een werkstroom starten: naam, leeg of als kopie van een eerdere run -->
  <div v-if="st" class="lk-modal lk-proj-ov" @mousedown.self="st = null">
    <div role="dialog" aria-modal="true" :aria-label="t('Werkstroom starten')" class="lk-proj-box">
      <h3>{{ t(wfName(st.wf)) }}</h3>
      <div class="fields">
        <div class="f"><label for="run-name">{{ t('Naam') }}</label><input id="run-name" class="txt" v-model="st.name"></div>
        <div class="f" v-if="same.length"><label for="run-copy">{{ t('Beginnen met') }}</label>
          <select id="run-copy" v-model="st.copy" style="width:100%">
            <option value="">{{ t('Lege invoer') }}</option>
            <option v-for="r in same" :key="r.id" :value="r.id">{{ t('Kopie van') }} {{ r.name }}</option>
          </select></div>
      </div>
      <div class="row" style="gap:8px;margin-top:12px">
        <button type="button" class="primary" id="run-start" @click="busy(() => startRun(st.wf, st.name.trim(), st.copy))">{{ t('Starten') }}</button>
        <button type="button" class="ghost" @click="st = null">{{ t('Annuleren') }}</button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script>
import * as P from '../engines/projects.js';

const kB = n => (n < 1e6 ? Math.max(1, Math.round(n / 1024)) + ' kB' : n < 1e9 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.round(n / 1073741824) + ' GB');

export default {
  name: 'Projects',
  data() { return {open: false, m: P.meta(), runs: P.runsMeta(), size: {}, ren: '', renName: '', del: '', newName: '', st: null, est: null, notes: P.notes(), note: '', msg: null, restore: null}; },
  computed: {
    P() { return P; },
    list() { return this.m ? this.m.list : []; },
    active() { return this.m ? this.m.active : ''; },
    cur() { return this.list.find(p => p.id === this.active) || null; },
    same() { return this.st ? this.runs.list.filter(r => r.wf === this.st.wf) : []; },
    spaceTxt() {
      const e = this.est; if (!e || !e.quota) return '';
      return this.t('Opslag in deze browser: ' + kB(e.usage || 0) + ' gebruikt, ' + kB(e.quota - (e.usage || 0)) + ' vrij.');
    }
  },
  methods: {
    switchProject: P.switchProject, downloadProject: P.downloadProject, switchRun: P.switchRun, stopRun: P.stopRun, startRun: P.startRun, wfName: P.wfName,
    refresh() { this.m = P.meta(); this.runs = P.runsMeta(); this.notes = P.notes(); const n = document.getElementById('sess-name'); if (n && this.cur) n.value = this.cur.name; },
    when(d) { return new Date(d).toLocaleString(LANG === 'en' ? 'en-GB' : 'nl-NL', {dateStyle: 'short', timeStyle: 'short'}); },
    pickFile(e) { const f = e.target.files[0]; e.target.value = ''; if (f) this.importFile(f); },
    /* ook voor "Importeren" in de zijbalk (app.js) */
    async importFile(f) {
      const r = await P.importFile(f); this.open = true; this.restore = null;
      if (!r) this.msg = {kind: 'bad', text: this.t('Dit bestand is geen Labkit-project, -sessie of -back-up.')};
      else if (r.kind === 'backup') { this.msg = null; this.restore = r.j; }
      else { this.msg = {kind: 'ok', text: this.t('Toegevoegd als project: ' + this.uv(r.name) + '. Open het in de lijst hierboven.')}; this.refresh(); }
    },
    async show() {
      this.refresh(); this.open = true; this.del = ''; this.ren = '';
      this.est = await P.estimate();
      for (const p of this.list) this.size = {...this.size, [p.id]: kB(await P.projectSize(p.id).catch(() => 0))};
    },
    /* alles wat herlaadt: dubbel klikken mag niets twee keer doen */
    async busy(f) { if (this._busy) return; this._busy = true; try { await f(); } finally { this._busy = false; } },
    create() { const n = this.newName.trim(); if (n) this.busy(() => P.newProject(n)); },
    doRename(id) { const n = this.renName.trim(); if (n) P.renameProject(id, n); this.ren = ''; this.refresh(); },
    doRenameRun(id) { const n = this.renName.trim(); if (n) P.renameRun(id, n); this.ren = ''; this.refresh(); if (window.wfRender) window.wfRender(); },
    async remove(id) { await P.deleteProject(id); if (window.__gfDeleteProject) await window.__gfDeleteProject(id); this.del = ''; this.refresh(); },
    async delRun(id) { await P.deleteRun(id); this.del = ''; this.refresh(); },
    /* van de startpagina: een werkstroomkaart (data-wf-start) */
    startDialog(wf) {
      this.refresh();
      const n = P.wfName(wf), k = this.runs.list.filter(r => r.wf === wf).length;
      this.st = {wf, name: this.t(n) + (k ? ' (' + (k + 1) + ')' : ''), copy: ''};
    }
  },
  mounted() {
    P.migrate(this.t('Mijn project')); this.refresh();
    P.persist();
    window.__projVm = this;
  }
};
</script>
