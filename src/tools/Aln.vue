<!-- ================= ALIGNMENT BEKIJKEN =================
     Leest een meervoudige uitlijning (Clustal .aln, uitgelijnde FASTA, PHYLIP, NEXUS, MSF, PIR)
     in één model; het inlezen staat in src/lib/alignment.js. De id's al-in, al-file, al-col, al-cbs, al-out, al-view en al-ref
     blijven zoals ze zijn: delen, ongedaan maken, de invoeropslag en tests/validate.py werken
     daarop.
     De viewer (S171) tekent alleen de cellen die in beeld zijn: een laag met position:sticky
     blijft in het venster staan terwijl een lege 'sizer' de schuifbalken de volle maat geeft, en
     bij elk scrollen worden de zichtbare rijen opnieuw uitgesneden (één tekstregel per rij). Zo
     blijft een uitlijning van duizenden kolommen vloeiend. -->
<template>
  <div>
  <div class="grid2">
    <div class="panel">
      <div class="f"><label for="al-in">{{ t('Uitlijning (Clustal, FASTA, PHYLIP, NEXUS, MSF of PIR)') }}</label>
        <textarea id="al-in" class="mono" rows="8" v-model="txt" spellcheck="false" wrap="off"></textarea></div>
      <div class="row" style="margin-top:8px">
        <input type="file" id="al-file" accept=".aln,.clustal,.fa,.fasta,.fas,.afa,.phy,.phylip,.nex,.nexus,.msf,.pir,.txt" :aria-label="t('Bestand openen')" @change="onFile">
      </div>
      <div class="fields" style="margin-top:12px">
        <div class="f"><label for="al-col">{{ t('Kleuren') }}</label>
          <select id="al-col" v-model="col">
            <option value="auto">{{ t('Automatisch') }}</option>
            <option value="clustalx">{{ t('ClustalX (eiwit)') }}</option>
            <option value="nt">{{ t('Nucleotiden') }}</option>
            <option value="ident">{{ t('Identiteit') }}</option>
            <option value="none">{{ t('Geen') }}</option>
          </select></div>
        <label class="chk" for="al-cbs"><input type="checkbox" id="al-cbs" v-model="cbs"> {{ t('Kleurenblind-veilig') }}</label>
        <lk-field v-model="thr" :label="t('Drempel consensus')" for-id="al-thr" unit="%" inputmode="numeric"/>
        <lk-field v-model="motif" :label="t('Motief zoeken')" for-id="al-motif" cls="mono"/>
        <div class="f"><label for="al-ord">{{ t('Volgorde') }}</label>
          <select id="al-ord" v-model="ord">
            <option value="file">{{ t('Zoals in het bestand') }}</option>
            <option value="name">{{ t('Op naam') }}</option>
            <option value="ident">{{ t('Op identiteit met de eerste sequentie') }}</option>
            <option value="hand">{{ t('Met de hand (pijltjes in de tabel)') }}</option>
          </select></div>
        <div class="f"><label for="al-ref">{{ t('Verschil met') }}</label>
          <select id="al-ref" v-model="ref">
            <option value="">{{ t('Uit') }}</option>
            <option v-for="(n, i) in m.names" :key="i" :value="String(i)">{{ n }}</option>
          </select></div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Een motief is letters, [..] voor één van een paar letters en X of . voor elke letter; bij DNA ook IUPAC-codes zoals N, R en Y. Gaten worden overgeslagen.') }}</p>
      <details class="panel" id="al-more" style="margin-top:12px"><summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('Bijsnijden, vertalen en exporteren') }}</summary>
        <div class="fields" style="margin-top:12px">
          <div class="f"><label for="al-tr">{{ t('Vertalen naar eiwit') }}</label>
            <select id="al-tr" v-model="tr">
              <option value="0">{{ t('Uit') }}</option>
              <option value="1">{{ t('Leesraam') }} 1</option><option value="2">{{ t('Leesraam') }} 2</option><option value="3">{{ t('Leesraam') }} 3</option>
            </select></div>
          <div class="f" v-if="tr !== '0'"><label for="al-code">{{ t('Genetische code') }}</label>
            <select id="al-code" v-model="code"><option v-for="(c, k) in codes" :key="k" :value="String(k)">{{ t(c[0]) }}</option></select></div>
          <lk-field v-model="gap" :label="t('Kolommen met meer gaten weglaten')" for-id="al-gap" unit="%" inputmode="numeric"/>
          <lk-field v-model="from" :label="t('Vanaf kolom')" for-id="al-from" inputmode="numeric"/>
          <lk-field v-model="to" :label="t('Tot en met kolom')" for-id="al-to" inputmode="numeric"/>
          <div class="f"><label for="al-xf">{{ t('Opslaan als') }}</label>
            <select id="al-xf" v-model="xf"><option v-for="(f, k) in outFmts" :key="k" :value="k">{{ f[0] }}</option></select></div>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Bijsnijden en vertalen werken op wat de viewer toont; opslaan schrijft precies die kolommen weg.') }}</p>
        <div class="row" style="margin-top:10px"><button type="button" class="primary" id="al-exp" :disabled="!m.names.length" @click="exportAln">{{ t('Uitlijning opslaan') }}</button>
          <button type="button" id="al-cpy" :disabled="!m.names.length" @click="copyAln">{{ t('Kopieer') }}</button></div>
      </details>
      <!-- S189: alles in één projectbestand -->
      <details class="panel" id="al-proj-d" style="margin-top:12px"><summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('Project opslaan en openen') }}</summary>
        <p style="font-size:13px;color:var(--muted);margin:12px 0 0">{{ t('Eén bestand met de uitlijning, de boom (.dnd) en alle instellingen: kleuren, drempels, bijsnijden, vertaling, volgorde en figuur.') }}</p>
        <div class="row" style="margin-top:10px">
          <button type="button" class="primary" id="al-proj-save" :disabled="!txt.trim()" @click="projSave">{{ t('Project opslaan') }}</button>
          <input type="file" id="al-proj-file" accept=".json,.labkit-aln" :aria-label="t('Project openen')" @change="projOpen">
        </div>
        <lk-note v-if="projMsg" :kind="projMsg[0]">{{ t(projMsg[1]) }}</lk-note>
      </details>
      <!-- S188: figuur van de uitlijning of een stuk ervan, en een afdrukweergave -->
      <details class="panel" id="al-fig-d" style="margin-top:12px" @toggle="figOpen = $event.target.open"><summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('Figuur en afdrukken') }}</summary>
        <div class="fields" style="margin-top:12px">
          <lk-field v-model="fgFrom" :label="t('Vanaf kolom')" for-id="al-fg-from" inputmode="numeric"/>
          <lk-field v-model="fgTo" :label="t('Tot en met kolom')" for-id="al-fg-to" inputmode="numeric"/>
          <lk-field v-model="fgPer" :label="t('Residuen per regel')" for-id="al-fg-per" inputmode="numeric"/>
          <lk-field v-model="fgTitle" :label="t('Titel')" for-id="al-fg-title"/>
          <label class="chk" for="al-fg-cons"><input type="checkbox" id="al-fg-cons" v-model="fgCons"> {{ t('Conserveringsregel meenemen') }}</label>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('De figuur gebruikt het gekozen kleurenschema, de volgorde en het verschil met een referentie zoals de viewer ze nu toont; leeg bij Vanaf en Tot is alles.') }}</p>
        <lk-kv v-if="fig.W" :rows="figRows" style="margin-top:10px"/>
        <lk-note v-else kind="warn">{{ t('Er is niets om te tekenen; controleer de kolommen.') }}</lk-note>
        <div class="row" style="margin-top:10px">
          <button type="button" class="primary" id="al-fg-png" :disabled="!fig.W" @click="figPng">{{ t('PNG opslaan') }}</button>
          <button type="button" id="al-fg-svg" :disabled="!fig.W" @click="figSvgSave">{{ t('SVG opslaan') }}</button>
          <button type="button" id="al-fg-print" :disabled="!fig.W" @click="figPrint">{{ t('Afdrukken') }}</button>
        </div>
      </details>
      <!-- S186: reeksen controleren voordat ze naar Clustal Omega bij EBI gaan -->
      <details class="panel" id="al-prep-d" style="margin-top:12px"><summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('Invoer voor Clustal Omega klaarmaken') }}</summary>
        <div class="f" style="margin-top:12px"><label for="al-fb">{{ t('Reeksen (FASTA, nog niet uitgelijnd)') }}</label>
          <textarea id="al-fb" class="mono" rows="7" v-model="fb" spellcheck="false" wrap="off"></textarea></div>
        <div class="row" style="margin-top:8px"><input type="file" id="al-fb-file" accept=".fa,.fasta,.fas,.txt" :aria-label="t('Bestand openen')" @change="onFb"></div>
        <div class="fields" style="margin-top:8px">
          <div class="f"><label for="al-fbt">{{ t('Soort') }}</label>
            <select id="al-fbt" v-model="fbt"><option value="auto">{{ t('Automatisch') }}</option><option value="nt">{{ t('DNA/RNA') }}</option><option value="aa">{{ t('eiwit') }}</option></select></div>
        </div>
        <div id="al-fb-chk" style="margin-top:10px">
          <lk-note v-if="!fc.recs.length && !fc.issues.length" kind="info">{{ t('Plak hier de reeksen die je wilt uitlijnen.') }}</lk-note>
          <lk-note v-for="i in fc.issues" :key="i.id" :kind="i.kind" :data-chk="i.id">{{ t(i.msg) }} <b v-if="i.detail" style="overflow-wrap:anywhere">{{ i.detail }}</b></lk-note>
          <lk-note v-if="fc.recs.length && !fc.issues.some(i => i.kind === 'bad')" kind="ok">{{ t('Klaar voor Clustal Omega:') }} {{ fc.recs.length }} {{ t('sequenties') }}</lk-note>
        </div>
        <div class="f" v-if="fc.text" style="margin-top:10px"><label for="al-fb-out">{{ t('Schone FASTA') }}</label>
          <textarea id="al-fb-out" class="mono" rows="5" readonly :value="fc.text" spellcheck="false" wrap="off"></textarea></div>
        <div class="row" style="margin-top:10px">
          <button type="button" class="primary" id="al-fb-copy" :disabled="!fc.text" @click="copyFb">{{ t('Kopieer schone FASTA') }}</button>
          <a id="al-ebi" class="aln-lnk" :href="EBI_URL" target="_blank" rel="noopener">{{ t('Open Clustal Omega bij EBI') }}</a>
          <button type="button" id="al-fb-from" :disabled="!m.names.length" @click="fromAln">{{ t('Neem de uitlijning hierboven als losse reeksen') }}</button>
        </div>
        <!-- S187: wat je bij EBI terugkrijgt en waar het hier heen gaat -->
        <p style="font-size:13px;margin:12px 0 4px"><b>{{ t('Terugbrengen van EBI') }}</b></p>
        <lk-table id="al-back" data-xl="1" :cols="backCols" :rows="backRows"/>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Namen kunnen tot ' + NAMEMAX + ' tekens; de naam is het eerste woord van de kopregel.') }}</p>
      </details>
      <details class="panel" id="al-tree-d" style="margin-top:12px"><summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('Gidsboom (.dnd)') }}</summary>
        <div class="f" style="margin-top:12px"><label for="al-dnd">{{ t('Newick-tekst van de boom') }}</label>
          <textarea id="al-dnd" class="mono" rows="4" v-model="dnd" spellcheck="false" wrap="off"></textarea></div>
        <div class="row" style="margin-top:8px"><input type="file" id="al-dnd-file" accept=".dnd,.nwk,.newick,.tree,.txt" :aria-label="t('Bestand openen')" @change="onDnd"></div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('De boom wordt bewaard en gaat mee in het projectbestand; hier tekenen kan nog niet.') }}</p>
      </details>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Het formaat wordt aan de eerste regel herkend. Uitlijnen doe je met Clustal Omega bij EBI; download daar de uitkomst als .aln en open die hier.') }}</p>
    </div>
    <div class="result">
      <div id="al-out">
        <lk-note v-if="!txt.trim()" kind="info">{{ t('Plak een uitlijning of open een bestand.') }}</lk-note>
        <lk-note v-else-if="!m.format" kind="bad">{{ t('Dit formaat wordt niet herkend. Verwacht: Clustal, FASTA, PHYLIP, NEXUS, MSF of PIR.') }}</lk-note>
        <lk-note v-else-if="!m.names.length" kind="bad">{{ t('Geen sequenties gevonden.') }}</lk-note>
        <template v-else>
          <lk-kv :rows="rows"/>
          <lk-note v-for="(w, i) in m.warn" :key="i" kind="warn">{{ t(w) }}</lk-note>
          <lk-note v-if="tr !== '0' && !isNt" kind="warn">{{ t('Vertalen kan alleen bij een nucleotide-uitlijning.') }}</lk-note>
          <lk-note v-if="m.len === 0" kind="warn">{{ t('Er blijven geen kolommen over; maak de grenzen ruimer.') }}</lk-note>
          <lk-note v-if="motif.trim() && !mot" kind="bad">{{ t('Dit motief is niet geldig: gebruik letters, [..], X of .') }}</lk-note>
          <lk-note v-else-if="mot && mot.capped" kind="warn">{{ t('Meer dan 20.000 treffers: alleen de eerste worden getoond.') }}</lk-note>
        </template>
      </div>
    </div>
  </div>
  <!-- de sequenties over de volle breedte: met identiteit, motief en pijltjes is hij te breed voor het resultaatvak -->
  <div v-if="m.format && m.names.length" id="al-seqs" class="result" style="margin-top:16px" @click="onMove">
    <lk-table :cols="cols" :rows="seqRows"/>
  </div>
  <!-- identiteitsmatrix met heatmap (S178) en geconserveerde stukken (S179): ingeklapt, de matrix wordt pas berekend als hij open staat -->
  <details v-if="m.format && m.names.length" id="al-pim-d" class="panel" style="margin-top:12px" @toggle="pimOpen = $event.target.open"><summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('Identiteitsmatrix en paren') }}</summary>
    <div class="fields" style="margin-top:12px">
      <div class="f"><label for="al-gm">{{ t('Gaten tellen') }}</label>
        <select id="al-gm" v-model="gm">
          <option value="ign">{{ t('Niet meetellen (alleen kolommen met twee letters)') }}</option>
          <option value="mis">{{ t('Als verschil (gat tegenover een letter)') }}</option>
          <option value="len">{{ t('Alle kolommen in de noemer') }}</option>
        </select></div>
      <div class="f"><label for="al-pa">{{ t('Paar') }}</label>
        <select id="al-pa" v-model="pa"><option v-for="(n, i) in m.names" :key="i" :value="String(i)">{{ n }}</option></select></div>
      <div class="f"><label for="al-pb">{{ t('met') }}</label>
        <select id="al-pb" v-model="pb"><option v-for="(n, i) in m.names" :key="i" :value="String(i)">{{ n }}</option></select></div>
    </div>
    <template v-if="pimOpen">
      <lk-kv v-if="pair" :rows="pair" style="margin-top:12px"/>
      <lk-note v-if="m.names.length > PIMMAX" kind="warn">{{ t('Alleen de eerste ' + PIMMAX + ' sequenties staan in de matrix.') }}</lk-note>
      <div class="aln-hmw" style="margin-top:12px"><table id="al-hm" class="aln-hm">
        <thead><tr><th></th><th v-for="(n, j) in pimNames" :key="j" :title="n">{{ j + 1 }}</th></tr></thead>
        <tbody><tr v-for="(n, i) in pimNames" :key="i"><th :title="n">{{ i + 1 }}: {{ n }}</th>
          <td v-for="(v, j) in pim[i]" :key="j" :style="{background: heat(v)}">{{ pc(v) }}</td></tr></tbody>
      </table></div>
      <div class="row" style="margin-top:10px"><button type="button" id="al-pimx" @click="exportPim">{{ t('Matrix opslaan als .pim') }}</button></div>
    </template>
  </details>
  <details v-if="m.format && m.names.length" id="al-cons-d" class="panel" style="margin-top:12px"><summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('Geconserveerde stukken') }}</summary>
    <div class="fields" style="margin-top:12px">
      <lk-field v-model="ct" :label="t('Conservering minstens')" for-id="al-ct" unit="%" inputmode="numeric"/>
      <lk-field v-model="cl" :label="t('Lengte minstens')" for-id="al-cl" :unit="t('kolommen')" inputmode="numeric"/>
    </div>
    <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Het aandeel van de meest voorkomende letter per kolom (gaten tellen mee), over aaneengesloten kolommen. Bij DNA kun je een stuk naar de Primerkaart sturen.') }}</p>
    <div id="al-regs" class="result" style="margin-top:12px" @click="onReg">
      <lk-note v-if="!regs.length" kind="info">{{ t('Geen stukken gevonden; verlaag de drempel of de minimale lengte.') }}</lk-note>
      <lk-table v-else :cols="regCols" :rows="regRows"/>
    </div>
  </details>
  <!-- overzicht van de hele uitlijning: aandeel gaten per stukje, het kader is wat in beeld is; klikken springt erheen (S174) -->
  <canvas v-show="m.names.length" id="al-ovw" ref="ov" class="aln-ovw" data-xl="1" :title="t('Gaten over de hele uitlijning; klik om erheen te gaan')" @click="onOv"></canvas>
  <div v-show="m.names.length" id="al-view" ref="view" :class="['aln-view', {'aln-cbs': cbs}]" :style="{height: viewH + 'px'}" @scroll="onScroll">
    <span ref="probe" class="aln-mono aln-probe" aria-hidden="true">{{ 'M'.repeat(50) }}</span>
    <span ref="sw" class="aln-sw" aria-hidden="true"></span>
    <div class="aln-sizer" :style="{width: g.W + 'px', height: g.H + 'px'}">
      <div class="aln-pin" :style="{width: vw + 'px', height: vh + 'px'}" @click="onCell">
        <!-- de kleuren staan op één canvas onder de tekst: duizenden gekleurde <span>s per
             scrollstap kosten meer dan een frame (S172) -->
        <!-- data-xl: geen knoppen Kopieer grafiek/data, dit zijn geen grafieken -->
        <canvas ref="cv" id="al-bg" class="aln-bg" data-xl="1" :style="{width: vw + 'px', height: vh + 'px'}"></canvas>
        <div v-for="r in vis.rows" :key="r.i" class="aln-mono aln-seq" :style="{top: r.top + 'px', left: vis.left + 'px'}">{{ r.txt }}</div>
        <div class="aln-names" :style="{width: g.nameW + 'px'}">
          <div v-for="r in vis.rows" :key="r.i" :class="['aln-mono', 'aln-name', {'aln-extra': r.x}]" :style="{top: r.top + 'px'}" :title="r.name">{{ r.name }}</div>
          <div v-if="vis.plot != null" class="aln-mono aln-name aln-extra" :style="{top: vis.plot + 'px'}">{{ t('Conservering (%)') }}</div>
        </div>
        <div class="aln-ruler" :style="{height: RH + 'px'}">
          <span v-for="k in vis.ticks" :key="k.c" :style="{left: k.x + 'px'}">{{ k.c }}</span>
        </div>
        <div class="aln-corner" :style="{width: g.nameW + 'px', height: RH + 'px'}">{{ t('Positie') }}</div>
      </div>
    </div>
  </div>
  <div v-if="colInfo" id="al-coldet" class="result" style="margin-top:12px">
    <lk-kv :rows="colInfo.kv"/>
    <lk-table :cols="colCols" :rows="colInfo.rows"/>
  </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import {parseAlignment, alnType, alnColours, alnCls, alnConservation, alnProfile, alnConsensus, alnMotif, alnIdentity, alnDiff,
  alnTrim, alnWrite, ALN_OUT, alnPair, alnPim, pimWrite, alnConserved, alnTranslate} from '../lib/alignment.js';
import {CODES, SEQ_TO, seqSend} from '../lib/seq.js';
import {fastaCheck, NAMEMAX} from '../lib/alnprep.js';
import {alnUngapped, EBI_URL} from '../lib/alnhand.js';
import {alnFigure, figSvg, figPaint} from '../lib/alnfig.js';
import {alnProjectWrite, alnProjectRead, PROJ_KEYS} from '../lib/alnproj.js';

const FMT = {clustal: 'Clustal', fasta: 'FASTA', phylip: 'PHYLIP', nexus: 'NEXUS', msf: 'GCG MSF', pir: 'PIR/NBRF'};
const N = x => lkNumIn(fmt(x, 0)), P = f => lkNumIn(fmt(f * 100, 1)) + '%';
const PROJ_IDS = {txt: 'al-in', dnd: 'al-dnd', col: 'al-col', cbs: 'al-cbs', thr: 'al-thr', motif: 'al-motif', ord: 'al-ord', ref: 'al-ref', tr: 'al-tr', code: 'al-code',
  gap: 'al-gap', from: 'al-from', to: 'al-to', xf: 'al-xf', gm: 'al-gm', pa: 'al-pa', pb: 'al-pb', ct: 'al-ct', cl: 'al-cl',
  fgFrom: 'al-fg-from', fgTo: 'al-fg-to', fgPer: 'al-fg-per', fgTitle: 'al-fg-title', fgCons: 'al-fg-cons'};
const PIMMAX = 60;  /* sequenties in de matrix: 60 x 60 cellen is wat een scherm nog toont */
const CH = 18, RH = 22, PH = 32, MAXNAME = 24; /* rijhoogte, hoogte van de liniaal en van de plot, naamkolom in tekens */

export default {
  name: 'Aln',
  data() {
    const st = typeof storeGet === 'function' ? storeGet() : {};
    return {txt: st['al-in'] != null ? String(st['al-in']) : '', col: st['al-col'] != null ? String(st['al-col']) : 'auto',
      cbs: !!st['al-cbs'], sel: null, hand: null,
      motif: st['al-motif'] != null ? String(st['al-motif']) : '', ord: st['al-ord'] != null ? String(st['al-ord']) : 'file', ref: st['al-ref'] != null ? String(st['al-ref']) : '', thr: st['al-thr'] != null ? String(st['al-thr']) : '50',
      tr: st['al-tr'] != null ? String(st['al-tr']) : '0', code: st['al-code'] != null ? String(st['al-code']) : '1',
      gap: st['al-gap'] != null ? String(st['al-gap']) : '', from: st['al-from'] != null ? String(st['al-from']) : '', to: st['al-to'] != null ? String(st['al-to']) : '',
      xf: st['al-xf'] != null ? String(st['al-xf']) : 'fasta', gm: st['al-gm'] != null ? String(st['al-gm']) : 'ign',
      pa: st['al-pa'] != null ? String(st['al-pa']) : '0', pb: st['al-pb'] != null ? String(st['al-pb']) : '1', pimOpen: false, projMsg: null, figOpen: false, fgFrom: st['al-fg-from'] != null ? String(st['al-fg-from']) : '', fgTo: st['al-fg-to'] != null ? String(st['al-fg-to']) : '', fgPer: st['al-fg-per'] != null ? String(st['al-fg-per']) : '60',
      fgTitle: st['al-fg-title'] != null ? String(st['al-fg-title']) : '', fgCons: st['al-fg-cons'] != null ? !!st['al-fg-cons'] : true, dnd: st['al-dnd'] != null ? String(st['al-dnd']) : '',
      fb: st['al-fb'] != null ? String(st['al-fb']) : '', fbt: st['al-fbt'] != null ? String(st['al-fbt']) : 'auto', NAMEMAX, EBI_URL,
      ct: st['al-ct'] != null ? String(st['al-ct']) : '90', cl: st['al-cl'] != null ? String(st['al-cl']) : '20', PIMMAX, RH, sx: 0, sy: 0, vw: 0, vh: 0, cw: 8};
  },
  computed: {
    parsed() { return parseAlignment(this.txt); },
    isNt() { return alnType(this.parsed) === 'nt'; },
    /* wat de viewer toont: de uitlijning, eventueel vertaald (S181) en dan bijgesneden (S177); zonder dat is het het ingelezen model zelf */
    tl() { return this.tr !== '0' && this.isNt && this.parsed.names.length ? alnTranslate(this.parsed, +this.tr, +this.code) : this.parsed; },
    m() {
      const a = this.tl, g = num(this.gap), f = Math.round(num(this.from)), l = Math.round(num(this.to));
      const gOk = g >= 0 && g < 100;
      if (!a.names.length || (!gOk && !(f > 1) && !(l >= 1 && l < a.len))) return a;
      return alnTrim(a, {maxGap: gOk ? g : null, from: f > 1 ? f : 1, to: l >= 1 ? l : a.len});
    },
    fc() { return fastaCheck(this.fb, this.fbt === 'auto' ? undefined : this.fbt); },
    backCols() { const t = this.t; return [{h: t('Bestand')}, {h: t('Wat het is')}, {h: t('Waar je het laadt')}]; },
    backRows() {
      const t = this.t;
      return [['<span class="mono">.aln</span> / <span class="mono">.clustal_num</span>', t('de uitlijning'), t('Plak hem of open hem bij Uitlijning, bovenaan.')],
        ['<span class="mono">.pim</span>', t('identiteit per paar'), t('Niet nodig: de Identiteitsmatrix hieronder rekent hetzelfde uit en slaat hem op als .pim.')],
        ['<span class="mono">.dnd</span>', t('de gidsboom (Newick)'), t('Bij Gidsboom (.dnd), hieronder: hij wordt bewaard; tekenen kan nog niet.')]];
    },
    /* S188: de figuur van wat de viewer toont (bijgesneden, vertaald, in de gekozen volgorde en kleuren) */
    fig() { return this.figOpen ? this.makeFig() : {W: 0}; },
    figRows() {
      const f = this.fig;
      return [[this.t('Kolommen'), N(f.from) + ' – ' + N(f.to)], [this.t('Blokken'), N(f.blocks) + ' × ' + N(f.per) + ' ' + this.t('residuen')],
        [this.t('Afmeting'), N(f.W) + ' × ' + N(f.H) + ' px']];
    },
    codes() { return CODES; },

    outFmts() { return ALN_OUT; },
    outText() { return alnWrite(this.m, this.xf in ALN_OUT ? this.xf : 'fasta'); },
    /* S178: identiteit van alle paren; alleen als het blok open staat */
    pimNames() { return this.m.names.slice(0, PIMMAX); },
    pim() { return this.pimOpen ? alnPim({seqs: this.m.seqs.slice(0, PIMMAX)}, this.gm) : []; },
    pair() {
      const a = +this.pa, b = +this.pb, s = this.m.seqs, t = this.t;
      if (!(a >= 0 && a < s.length && b >= 0 && b < s.length)) return null;
      const r = alnPair(s[a], s[b], this.gm), aa = alnType(this.m) !== 'nt';
      return [[t('Identiteit'), P(r.id) + ' (' + N(r.same) + ' / ' + N(r.n) + ')'],
        aa && [t('Gelijkenis'), P(r.sm) + ' (' + N(r.sim) + ' / ' + N(r.n) + ')'],
        [t('Kolommen met een gat in één van beide'), N(r.gaps)]].filter(Boolean);
    },
    /* S179 */
    regs() { const th = num(this.ct), ml = num(this.cl); return alnConserved(this.m, this.prof, isFinite(th) ? th : 90, isFinite(ml) ? ml : 1); },
    regCols() { const t = this.t; return [{h: t('Van'), num: true}, {h: t('Tot'), num: true}, {h: t('Lengte'), num: true}, {h: t('Consensus')}, {h: ''}]; },
    regRows() {
      const nt = alnType(this.m) === 'nt', b = esc(trPlain('Naar Primerkaart'));
      return this.regs.slice(0, 50).map((r, i) => [N(r.from), N(r.to), N(r.len), '<span class="mono">' + esc(r.seq.length > 40 ? r.seq.slice(0, 40) + '…' : r.seq) + '</span>',
        nt ? '<button type="button" class="aln-mv" data-reg="' + i + '">' + b + '</button>' : '']);
    },
    /* het gekozen schema (Automatisch: nucleotiden of ClustalX naar het type) en zijn kolomtabel */
    sch() { return this.col === 'auto' ? (alnType(this.m) === 'nt' ? 'nt' : 'clustalx') : this.col; },
    tab() { return this.sch === 'none' ? undefined : alnColours(this.m, this.sch); },
    /* onder de sequenties: de * : . -regel, de consensus en een plot van het aandeel van de meest voorkomende letter (S173) */
    prof() { return alnProfile(this.m); },
    cons() { return alnConservation(this.m); },
    /* S175: treffers van het motief per sequentie, en de volgorde van de rijen (indexen in m) */
    mot() { return this.motif.trim() ? alnMotif(this.m, this.motif, alnType(this.m) === 'nt') : null; },
    ident() { return this.m.seqs.length ? alnIdentity(this.m, 0) : []; },
    order() {
      const m = this.m, ix = m.names.map((_, i) => i);
      if (this.ord === 'hand' && this.hand && this.hand.length === ix.length) return this.hand;
      if (this.ord === 'name') return ix.sort((a, b) => m.names[a].localeCompare(m.names[b], undefined, {numeric: true}));
      if (this.ord === 'ident') return ix.sort((a, b) => this.ident[b] - this.ident[a] || a - b);
      return ix;
    },
    /* S176: wat elke rij toont; met een referentie een punt waar de letter gelijk is */
    disp() {
      const s = this.m.seqs, r = this.ref === '' ? -1 : +this.ref;
      return r < 0 || r >= s.length ? s : s.map((x, i) => i === r ? x : alnDiff(x, s[r]));
    },
    consensus() { const v = num(this.thr); return alnConsensus(this.m, this.prof, isFinite(v) ? v : 50); },
    /* de volle maat van het raster */
    g() {
      const m = this.m, nameW = Math.ceil(Math.min(MAXNAME, Math.max(6, ...m.names.map(n => n.length))) * this.cw) + 14;
      return {nameW, W: nameW + m.len * this.cw, H: RH + (m.names.length + 2) * CH + PH};
    },
    viewH() { return Math.min(this.g.H + 18, 540); },
    /* alleen wat in beeld is: rijen r0..r1, kolommen c0..c1 (0-based, c1 exclusief) */
    vis() {
      const m = this.m, g = this.g, cw = this.cw;
      const c0 = Math.max(0, Math.floor(this.sx / cw)), c1 = Math.min(m.len, Math.ceil((this.sx + this.vw - g.nameW) / cw) + 1);
      const n = m.names.length, r0 = Math.max(0, Math.floor(this.sy / CH)), r1 = Math.min(n + 2, Math.ceil((this.sy + this.vh - RH) / CH) + 1);
      const rows = [], extra = [[this.t('Conservering'), this.cons], [this.t('Consensus'), this.consensus]];
      for (let i = r0; i < r1; i++) {
        const x = i >= n, k = x ? i : this.order[i], [name, s] = x ? extra[i - n] : [m.names[k], this.disp[k]];
        rows.push({i: k, x, name, top: RH + i * CH - this.sy, txt: s.slice(c0, c1)});
      }
      const pt = RH + (n + 2) * CH - this.sy, plot = pt < this.vh && pt + PH > RH ? pt : null;
      /* een getal boven elke tiende kolom, in het midden van die kolom */
      const ticks = [];
      for (let c = Math.ceil((c0 + 1) / 10) * 10; c <= c1; c += 10) ticks.push({c, x: g.nameW + (c - 0.5) * cw - this.sx});
      return {rows, ticks, plot, c0, c1, left: g.nameW + c0 * cw - this.sx};
    },
    rows() {
      const m = this.m, t = this.t, ty = alnType(m), base = this.tl.len;
      return [[t('Formaat'), FMT[m.format]], [t('Sequenties'), N(m.names.length)],
        [t('Lengte'), N(m.len) + ' ' + t('kolommen')],
        this.tl !== this.parsed && [t('Vertaald'), this.t('leesraam ' + this.tr)],
        m !== this.tl && [t('Bijgesneden'), N(base) + ' → ' + N(m.len) + ' ' + t('kolommen')],
        [t('Kolommen met gaten'), N(this.prof.gaps.filter(Boolean).length) + ' ' + t('kolommen')],
        this.mot && [t('Motief gevonden in'), this.t(this.mot.hits.filter(h => h.length).length + ' van ' + m.names.length + ' sequenties')],
        [t('Volledig geconserveerd (*)'), N(this.cons.split('*').length - 1) + ' ' + t('kolommen')],
        [t('Type'), ty === 'nt' ? t('DNA/RNA') : ty === 'aa' ? t('eiwit') : '–']].filter(Boolean);
    },
    cols() {
      const t = this.t;
      return [{h: t('Naam')}, {h: t('Zonder gaten'), num: true}, {h: t('Gaten'), num: true},
        {h: t('Identiteit met de eerste'), num: true}, this.mot && {h: t('Motief'), num: true}, {h: ''}].filter(Boolean);
    },
    seqRows() {
      const up = esc(trPlain('Omhoog')), dn = esc(trPlain('Omlaag')), last = this.order.length - 1;
      return this.order.map((i, p) => {
        const s = this.m.seqs[i], g = s.split('-').length - 1, h = this.mot && this.mot.hits[i];
        /* de pijltjes verschuiven de rij; onMove vangt de klik op */
        const mv = '<span class="aln-mvs">' + (p ? '<button type="button" class="aln-mv" data-mv="-1" data-p="' + p + '" title="' + up + '" aria-label="' + up + '">▲</button>' : '')
          + (p < last ? '<button type="button" class="aln-mv" data-mv="1" data-p="' + p + '" title="' + dn + '" aria-label="' + dn + '">▼</button>' : '') + '</span>';
        return [esc(this.m.names[i]), N(s.length - g), N(g) + ' (' + P(g / s.length) + ')', P(this.ident[i]),
          h && (h.length ? this.t(h.length + ' (kolom ' + (h[0][0] + 1) + ')') : '0'), mv].filter(x => x !== null && x !== undefined);
      });
    },
    /* de aangeklikte kolom: welke letters hoe vaak */
    colCols() { return [{h: this.t('Letter')}, {h: this.t('Aantal'), num: true}, {h: '%', num: true}]; },
    colInfo() {
      const c = this.sel, m = this.m, t = this.t;
      if (c == null || c >= m.len) return null;
      const cnt = {}, n = m.seqs.length;
      for (const s of m.seqs) { const r = s[c].toUpperCase(); if (r !== '-') cnt[r] = (cnt[r] || 0) + 1; }
      const g = this.prof.gaps[c];
      return {kv: [[t('Kolom'), N(c + 1)], [t('Gaten'), N(g) + ' (' + P(g / n) + ')'],
          [t('Conservering'), this.cons[c].trim() || '–'], [t('Consensus'), esc(this.consensus[c])]],
        rows: Object.entries(cnt).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([r, k]) => [esc(r), N(k), P(k / n)])};
    }
  },
  mounted() {
    window.__alnVm = this;
    /* de sectie is verborgen tot de tool opent; meet pas als het venster een maat heeft */
    this.ro = new ResizeObserver(() => this.measure());
    this.ro.observe(this.$refs.view);
    /* een ander thema geeft andere tinten */
    this.mo = new MutationObserver(() => this.paint());
    this.mo.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
  },
  beforeUnmount() { if (this.ro) this.ro.disconnect(); if (this.mo) this.mo.disconnect(); },
  watch: {
    /* een nieuwe uitlijning begint linksboven */
    m() { const v = this.$refs.view; if (v) { v.scrollLeft = 0; v.scrollTop = 0; } this.sx = this.sy = 0; this.sel = null; this.hand = null; if (+this.ref >= this.m.names.length) this.ref = ''; },
    /* na de render: dan staat de klasse aln-cbs al op het venster */
    vis: {handler() { this.paint(); }, flush: 'post'},
    tab: {handler() { this.paint(); }, flush: 'post'},
    cbs: {handler() { this.paint(); }, flush: 'post'},
    sel: {handler() { this.paint(); }, flush: 'post'},
    mot: {handler() { this.paint(); }, flush: 'post'}
  },
  methods: {
    measure() {
      const v = this.$refs.view, p = this.$refs.probe;
      if (!v || !v.clientWidth) return;
      const w = p.getBoundingClientRect().width / 50;
      if (w > 0) this.cw = w;
      this.vw = v.clientWidth; this.vh = v.clientHeight;
    },
    /* klasse van cel (rij i, kolom c), '' zonder kleur */
    cellCls(i, c) { return this.tab === undefined ? '' : alnCls(this.tab, c, this.m.seqs[i][c]); },
    /* de kleur van een klasse in het huidige thema, uit de CSS gelezen (per thema en palet onthouden) */
    shade(k) {
      const key = (document.documentElement.getAttribute('data-theme') || '') + this.cbs + k;
      const memo = this.memo || (this.memo = {});
      if (!(key in memo)) { const e = this.$refs.sw; e.className = 'aln-sw k-' + k; memo[key] = getComputedStyle(e).backgroundColor; }
      return memo[key];
    },
    /* de zichtbare cellen inkleuren, per run van dezelfde klasse één rechthoek */
    paint() {
      const cv = this.$refs.cv;
      if (!cv || !this.vw) return;
      const dpr = window.devicePixelRatio || 1, W = Math.round(this.vw * dpr), H = Math.round(this.vh * dpr);
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      const x = cv.getContext('2d'), v = this.vis, cw = this.cw;
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, this.vw, this.vh);
      if (v.plot != null) {
        x.fillStyle = this.shade('bar');
        for (let c = v.c0; c < v.c1; c++) { const h = this.prof.frac[c] * (PH - 6); x.fillRect(v.left + (c - v.c0) * cw + 1, v.plot + PH - 3 - h, Math.max(1, cw - 2), h); }
      }
      this.paintOv();
      if (this.sel != null && this.sel >= v.c0 && this.sel < v.c1) {
        x.strokeStyle = this.shade('bar'); x.lineWidth = 2;
        x.strokeRect(v.left + (this.sel - v.c0) * cw + 1, RH + 1, cw - 2, this.vh - RH - 2);
      }
      const tab = this.tab, seqs = this.disp, sh = {};  /* buiten de lus: elke reactieve lees kost tijd */
      for (const r of tab === undefined ? [] : v.rows) {
        if (r.x) continue;
        const s = seqs[r.i];
        let c = v.c0;
        while (c < v.c1) {
          const k = alnCls(tab, c, s[c]); let e = c + 1;
          while (e < v.c1 && alnCls(tab, e, s[e]) === k) e++;
          if (k) { x.fillStyle = sh[k] || (sh[k] = this.shade(k)); x.fillRect(v.left + (c - v.c0) * cw, r.top, (e - c) * cw, CH); }
          c = e;
        }
      }
      /* motieftreffers: een kader om de kolommen van elke treffer */
      const mot = this.mot;
      if (!mot) return;
      x.strokeStyle = this.shade('hit'); x.lineWidth = 2;
      for (const r of v.rows) {
        if (r.x) continue;
        for (const [a, b] of mot.hits[r.i]) if (b >= v.c0 && a < v.c1) x.strokeRect(v.left + (a - v.c0) * cw + 1, r.top + 1, (b - a + 1) * cw - 2, CH - 2);
      }
    },
    /* overzichtsstrook: per pixel het gemiddelde aandeel gaten, en een kader om wat in beeld is */
    paintOv() {
      const cv = this.$refs.ov, m = this.m, n = m.seqs.length;
      if (!cv || !cv.clientWidth || !m.len) return;
      const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      const x = cv.getContext('2d'), per = m.len / w, key = [w, h, dpr, this.shade('gap')].join();
      /* de balken veranderen alleen met de uitlijning, de maat of het thema: één keer tekenen, daarna kopiëren */
      if (this.ovKey !== key || this.ovProf !== this.prof) {
        const o = this.ovImg || (this.ovImg = document.createElement('canvas')), ox = o.getContext('2d'), gaps = this.prof.gaps;
        o.width = cv.width; o.height = cv.height;
        ox.setTransform(dpr, 0, 0, dpr, 0, 0); ox.fillStyle = this.shade('gap');
        for (let px = 0; px < w; px++) {
          const a = Math.floor(px * per), b = Math.max(a + 1, Math.floor((px + 1) * per));
          let s = 0; for (let c = a; c < b && c < m.len; c++) s += gaps[c];
          const f = s / ((Math.min(b, m.len) - a) * n);
          if (f > 0) ox.fillRect(px, 0, 1, f * h);
        }
        this.ovKey = key; this.ovProf = this.prof;
      }
      x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(this.ovImg, 0, 0);
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const v = this.vis;
      x.strokeStyle = this.shade('bar'); x.lineWidth = 2;
      x.strokeRect(v.c0 / per + 1, 1, Math.max(3, (v.c1 - v.c0) / per - 2), h - 2);
    },
    onOv(e) {
      const v = this.$refs.view, r = e.currentTarget.getBoundingClientRect();
      const c = (e.clientX - r.left) / r.width * this.m.len;
      v.scrollLeft = Math.max(0, c * this.cw - (this.vw - this.g.nameW) / 2);
    },
    /* ▲/▼ in de tabel: de rij een plek op of neer, en de volgorde wordt 'met de hand' */
    onMove(e) {
      const b = e.target.closest('[data-mv]');
      if (!b) return;
      const o = this.order.slice(), p = +b.dataset.p, q = p + +b.dataset.mv;
      [o[p], o[q]] = [o[q], o[p]];
      this.hand = o; this.ord = 'hand';
    },
    /* klik in het raster: welke kolom (niet in de naamkolom of de liniaal) */
    onCell(e) {
      const r = this.$refs.view.getBoundingClientRect(), x = e.clientX - r.left - this.$refs.view.clientLeft;
      const y = e.clientY - r.top - this.$refs.view.clientTop;
      if (x < this.g.nameW || y < RH) return;
      const c = Math.floor((x - this.g.nameW + this.sx) / this.cw);
      if (c >= 0 && c < this.m.len) this.sel = c;
    },
    /* synchroon: Vue rendert in een microtaak, dus nog vóór het scherm wordt getekend */
    onScroll(e) { this.sx = e.target.scrollLeft; this.sy = e.target.scrollTop; },
    /* heatmap: de kleur van --accent, gemengd met --surface zodat --ink leesbaar blijft */
    heat(v) { return 'color-mix(in srgb, var(--accent) ' + Math.round(v * 45) + '%, var(--surface))'; },
    pc(v) { return lkNumIn(fmt(v * 100, 1)); },
    /* de uitlijning zoals bij Opslaan als (bijgesneden, in het gekozen formaat) op het klembord */
    copyAln() { this.copy(this.outText); },
    fromAln() { this.fb = alnUngapped(this.m); },
    copyFb() { this.copy(this.fc.text); },
    copy(x) {
      const done = () => window.lkToast && window.lkToast(this.t('Gekopieerd.'));
      try { navigator.clipboard.writeText(x).then(done, () => window.lkToast && window.lkToast(this.t('Geblokkeerd'))); } catch (e) { if (window.lkToast) window.lkToast(this.t('Geblokkeerd')); }
    },
    /* S188: de figuur van wat de viewer toont (bijgesneden, vertaald, in de gekozen volgorde en kleuren); vers gebouwd, want de kleuren hangen aan het thema */
    makeFig() {
      const m = this.m, f = Math.round(num(this.fgFrom)), l = Math.round(num(this.fgTo)), per = Math.round(num(this.fgPer)), tab = this.tab;
      if (!m.names.length || !m.len) return {W: 0};
      return alnFigure(m, {from: f >= 1 ? f : 1, to: l >= 1 ? l : m.len, per: per >= 1 ? per : 60, order: this.order, seqs: this.disp, title: this.fgTitle.trim(),
        cls: tab === undefined ? null : (i, c) => alnCls(tab, c, this.disp[i][c]), fill: k => this.figFill(k),
        cons: this.fgCons ? this.cons : '', consName: this.t('Conservering')});
    },
    /* de kleur van een klasse op wit papier: de tint uit de viewer, in een donker thema opgelicht zodat zwarte letters leesbaar blijven */
    figFill(k) {
      const memo = this.fm || (this.fm = {}), key = (document.documentElement.getAttribute('data-theme') || '') + this.cbs + k;
      if (key in memo) return memo[key];
      const c = this.fcv || (this.fcv = document.createElement('canvas')), x = c.getContext('2d', {willReadFrequently: true});
      c.width = c.height = 1; x.clearRect(0, 0, 1, 1); x.fillStyle = this.shade(k); x.fillRect(0, 0, 1, 1);
      let [r, g, b] = x.getImageData(0, 0, 1, 1).data;
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      if (lum < 0.55) { const w = (0.8 - lum) / (1 - lum); r += (255 - r) * w; g += (255 - g) * w; b += (255 - b) * w; }
      return memo[key] = 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
    },
    figPng() {
      const f = this.makeFig(), cv = document.createElement('canvas');   /* alleen voor het bestand, nooit in de pagina */
      figPaint(cv, f, Math.min(2, 16000 / Math.max(f.W, f.H)));
      cv.toBlob(bl => { if (bl) saveBlob('uitlijning.png', bl).catch(() => {}); }, 'image/png');
    },
    figSvgSave() { saveBlob('uitlijning.svg', new Blob([figSvg(this.makeFig())], {type: 'image/svg+xml'})).catch(() => {}); },
    /* afdrukken: de figuur komt in een los vak op <body>, de rest van de pagina is dan verborgen (app.css, @media print) */
    printSetup() {
      let b = document.getElementById('al-printbox');
      if (!b) { b = document.createElement('div'); b.id = 'al-printbox'; b.setAttribute('data-notr', ''); document.body.appendChild(b); }
      b.innerHTML = figSvg(this.makeFig());
      document.body.classList.add('al-printing');
    },
    figPrint() {
      this.printSetup();
      const done = () => { document.body.classList.remove('al-printing'); window.removeEventListener('afterprint', done); };
      window.addEventListener('afterprint', done);
      window.print();
    },
    /* S189: projectbestand. Eerst wat de uitlijning verandert (tekst, vertaling, bijsnijden), dan na de watchers de rest: m() wist anders de
       handmatige volgorde en de referentie. Daarna krijgen de velden een input-gebeurtenis, zodat de invoeropslag de nieuwe waarden bewaart. */
    projState() { const o = {txt: this.txt, dnd: this.dnd}; for (const k of PROJ_KEYS) o[k] = this[k]; return o; },
    projSave() {
      const d = new Date(), z = n => String(n).padStart(2, '0');
      saveBlob('alignment-project-' + d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + '.json',
        new Blob([alnProjectWrite(this.projState(), typeof APPVER === 'string' ? APPVER : '')], {type: 'application/json'})).catch(() => {});
    },
    async projOpen(e) {
      const f = e.target.files[0]; e.target.value = '';
      if (!f) return;
      this.projApply(alnProjectRead(await f.text()));
    },
    async projApply(r) {
      if (r.error) { this.projMsg = ['bad', r.error]; return; }
      const S = r.settings, first = ['tr', 'code', 'gap', 'from', 'to'];
      this.txt = r.txt; this.dnd = r.dnd;
      for (const k of first) if (k in S) this[k] = S[k];
      await this.$nextTick();
      for (const k of PROJ_KEYS) if (!first.includes(k) && k in S) this[k] = S[k];
      await this.$nextTick();
      for (const [k, id] of Object.entries(PROJ_IDS)) {
        const el = document.getElementById(id);
        if (el) { el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); }
      }
      this.projMsg = ['ok', 'Project geopend.'];
    },
    exportAln() {
      const f = ALN_OUT[this.xf] || ALN_OUT.fasta;
      saveBlob('uitlijning.' + f[1], new Blob([this.outText], {type: 'text/plain'})).catch(() => {});
    },
    exportPim() { saveBlob('identiteit.pim', new Blob([pimWrite(this.pimNames, this.pim)], {type: 'text/plain'})).catch(() => {}); },
    /* een geconserveerd stuk (consensus, zonder gaten) als regel in de Primerkaart */
    onReg(e) {
      const b = e.target.closest('[data-reg]'), t = SEQ_TO.find(x => x.tool === 'oligo');
      if (!b || !t) return;
      const r = this.regs[+b.dataset.reg];
      seqSend(t, trPlain('Stuk', true) + '_' + r.from + '-' + r.to, r.seq);
    },
    /* een bestand houdt zijn regeleinden (CRLF, CR); een tekstvak zou ze al platslaan */
    onFb(e) { const f = e.target.files[0]; if (f) f.text().then(x => { this.fb = x; }); },
    onDnd(e) { const f = e.target.files[0]; if (f) f.text().then(x => { this.dnd = x.trim(); }); },
    onFile(e) {
      const f = e.target.files[0];
      if (f) f.text().then(x => { this.txt = x; });
    }
  }
};
</script>
